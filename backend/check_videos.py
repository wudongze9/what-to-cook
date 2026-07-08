"""
检查 dish-videos.json 中所有视频链接的可访问性
运行：python check_videos.py
结果写入 video-check-report.json 和 video-check-log.txt
"""
import json
import os
import time
import sys
import requests
from urllib.parse import quote

VIDEOS_PATH = os.path.join(os.path.dirname(__file__), 'app', 'data', 'dish-videos.json')
LOG_PATH = os.path.join(os.path.dirname(__file__), 'video-check-log.txt')
REPORT_PATH = os.path.join(os.path.dirname(__file__), 'video-check-report.json')

# 模拟浏览器请求头
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

# 日志文件
log_file = open(LOG_PATH, 'w', encoding='utf-8')


def log(msg):
    """写入日志并刷新"""
    log_file.write(msg + '\n')
    log_file.flush()


def check_url(url):
    """检查单个 URL 的可访问性
    返回: (status_code, status_text)
    """
    try:
        response = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
        return response.status_code, 'OK'
    except requests.exceptions.Timeout:
        return 0, 'TIMEOUT'
    except requests.exceptions.ConnectionError:
        return 0, 'CONN_ERROR'
    except requests.exceptions.RequestException as e:
        return 0, 'REQUEST_ERROR: ' + type(e).__name__
    except Exception as e:
        return 0, 'ERROR: ' + str(e)[:50]


def main():
    with open(VIDEOS_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    videos = data.get('videos', [])
    total = len(videos)
    log(f'共 {total} 条视频链接需要检查')
    log(f'{"序号":<6} {"dish_id":<10} {"菜品名":<18} {"状态码":<8} {"结果"}')
    log('-' * 80)

    results = []
    ok_count = 0
    fail_count = 0

    for i, v in enumerate(videos, 1):
        url = v.get('external_url', '')
        dish_id = v.get('dish_id', '?')
        dish_name = v.get('dish_name', '?')

        if not url:
            log(f'{i:<8}{dish_id:<12}{dish_name:<22}{"":<10}空链接')
            results.append({'dish_id': dish_id, 'dish_name': dish_name, 'status': 'EMPTY', 'url': url, 'ok': False})
            fail_count += 1
            continue

        status_code, status_text = check_url(url)

        # 200 或 3xx 都算可访问
        is_ok = status_code == 200 or (300 <= status_code < 400)
        mark = 'OK' if is_ok else 'FAIL'

        log(f'{i:<8}{dish_id:<12}{dish_name:<22}{status_code:<10}{mark} {status_text}')

        results.append({
            'dish_id': dish_id,
            'dish_name': dish_name,
            'status_code': status_code,
            'status_text': status_text,
            'url': url,
            'ok': is_ok
        })

        if is_ok:
            ok_count += 1
        else:
            fail_count += 1

        # 每次请求间隔 0.5 秒，避免被限流
        time.sleep(0.5)

    # 汇总
    log('\n' + '=' * 80)
    log(f'\n检查结果汇总：')
    log(f'   总数：{total} 条')
    log(f'   可访问：{ok_count} 条')
    log(f'   不可访问：{fail_count} 条')

    if fail_count > 0:
        log(f'\n不可访问的链接：')
        for r in results:
            if not r.get('ok', False):
                log(f'   dish_id={r["dish_id"]} {r["dish_name"]}: [{r.get("status_code", "?")}] {r.get("status_text", "?")}')

    log(f'\n详细报告已保存：{REPORT_PATH}')
    log(f'日志已保存：{LOG_PATH}')

    # 保存详细结果
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump({
            'total': total,
            'ok': ok_count,
            'failed': fail_count,
            'results': results
        }, f, ensure_ascii=False, indent=2)

    log_file.close()

    # 控制台只打印关键信息
    print(f'DONE: total={total} ok={ok_count} failed={fail_count}')
    print(f'Log: {LOG_PATH}')
    print(f'Report: {REPORT_PATH}')


if __name__ == '__main__':
    main()
