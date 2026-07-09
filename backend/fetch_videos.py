"""
从 B站搜索 API 批量获取每道菜的具体教学视频链接
- 读取数据库中所有 100 道菜
- 搜索 "菜名 做法"，取综合排序第1个视频
- 更新 dish-videos.json 和前端 mock/dish-videos.js
运行：D:\anaconda\python.exe fetch_videos.py
"""
import json
import os
import time
import re
import requests
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'whattocook.db')
JSON_PATH = os.path.join(os.path.dirname(__file__), 'app', 'data', 'dish-videos.json')
MOCK_PATH = os.path.join(os.path.dirname(__file__), '..', 'miniprogram', 'mock', 'dish-videos.js')

BILI_SEARCH_API = "https://api.bilibili.com/x/web-interface/search/type"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://www.bilibili.com/',
    'Origin': 'https://www.bilibili.com',
}

LOG_PATH = os.path.join(os.path.dirname(__file__), 'fetch-log.txt')
log_file = open(LOG_PATH, 'w', encoding='utf-8')


def log(msg):
    log_file.write(msg + '\n')
    log_file.flush()


def clean_title(title):
    """去除标题中的 HTML 标签"""
    if not title:
        return ''
    return re.sub(r'<[^>]+>', '', title)


def format_duration(seconds):
    """秒数 → MM:SS"""
    try:
        seconds = int(seconds)
        return f'{seconds // 60:02d}:{seconds % 60:02d}'
    except Exception:
        return ''


def fix_pic_url(pic):
    """补全封面图 URL"""
    if not pic:
        return ''
    if pic.startswith('//'):
        return 'https:' + pic
    if pic.startswith('http'):
        return pic
    return 'https://' + pic


def search_bilibili(keyword, retries=3):
    """搜索 B站视频，返回第1个结果的详细信息"""
    params = {
        'search_type': 'video',
        'keyword': keyword,
        'page': 1,
        'page_size': 5,
        'order': 'totalrank',
    }
    for attempt in range(retries):
        try:
            resp = requests.get(BILI_SEARCH_API, params=params, headers=HEADERS, timeout=15)
            data = resp.json()
            if data.get('code') == 0:
                results = data.get('data', {}).get('result', [])
                if results:
                    item = results[0]
                    return {
                        'bvid': item.get('bvid', ''),
                        'title': clean_title(item.get('title', '')),
                        'author': item.get('author', ''),
                        'duration': format_duration(item.get('duration', 0)),
                        'cover': fix_pic_url(item.get('pic', '')),
                        'play': item.get('play', 0),
                        'external_url': f"https://www.bilibili.com/video/{item.get('bvid', '')}",
                    }
                else:
                    return None
            elif data.get('code') == -412:
                # 被限流，等待后重试
                wait = 3 + attempt * 5
                log(f'    被限流，等待 {wait}s 后重试 ({attempt+1}/{retries})')
                time.sleep(wait)
            else:
                log(f'    API 错误: code={data.get("code")} message={data.get("message", "")}')
                return None
        except Exception as e:
            log(f'    请求异常: {e}')
            time.sleep(2)
    return None


def main():
    # 读取数据库中所有菜品
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT d.id, d.name, c.name as category, d.difficulty, d.time, d.description
        FROM dishes d
        LEFT JOIN categories c ON d.category_id = c.id
        ORDER BY d.id
    """).fetchall()
    conn.close()

    dishes = [dict(r) for r in rows]
    total = len(dishes)
    log(f'共 {total} 道菜需要获取视频链接')
    log('=' * 80)

    # 读取现有 dish-videos.json（保留说明和模板字段）
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        existing = json.load(f)

    success_count = 0
    fail_count = 0
    videos = []

    for i, dish in enumerate(dishes, 1):
        dish_id = dish['id']
        name = dish['name']
        category = dish.get('category') or '家常菜'
        difficulty = dish.get('difficulty') or '简单'
        cook_time = dish.get('time') or 15
        desc = dish.get('description') or ''

        keyword = f'{name} 做法'
        log(f'[{i}/{total}] dish_id={dish_id} {name} → 搜索: {keyword}')

        result = search_bilibili(keyword)

        if result:
            # 标签
            cat_tags = {
                '家常菜': ['家常菜', '下饭菜'],
                '川菜': ['川菜', '下饭菜', '辣'],
                '粤菜': ['粤菜', '经典菜'],
                '湘菜': ['湘菜', '辣', '下饭菜'],
                '东北菜': ['东北菜', '家常菜'],
                '鲁菜': ['鲁菜', '经典菜'],
                '苏菜': ['苏菜', '经典菜'],
                '浙菜': ['浙菜', '经典菜'],
                '闽菜': ['闽菜', '宴客菜'],
                '西北菜': ['西北菜', '下饭菜'],
                '海鲜': ['海鲜', '宴客菜'],
                '汤煲': ['汤煲', '快手菜'],
                '主食': ['主食', '快手菜'],
                '甜品': ['甜品', '下午茶'],
                '西餐': ['西餐', '宴客菜'],
                '日料': ['日料', '快手菜'],
            }
            tags = list(cat_tags.get(category, ['家常菜']))
            if difficulty == '简单':
                tags.append('新手友好')
            tags = list(dict.fromkeys(tags))

            video = {
                'id': f'v_dish_{dish_id:03d}',
                'dish_id': dish_id,
                'dish_name': name,
                'title': result['title'],
                'category': category,
                'tags': tags,
                'cover': result['cover'],
                'duration': result['duration'],
                'source': 'bilibili',
                'author': result['author'],
                'external_url': result['external_url'],
                'video_url': '',
                'playable_in_miniprogram': False,
                'description': f'{name}的做法教学。{desc}' if desc else f'{name}的详细做法教学。',
                'play_count': result['play'],
            }
            videos.append(video)
            success_count += 1
            log(f'    ✅ {result["title"][:40]}')
            log(f'       UP主: {result["author"]} | 播放: {result["play"]} | {result["external_url"]}')
        else:
            # 失败：保留搜索链接占位
            video = {
                'id': f'v_dish_{dish_id:03d}',
                'dish_id': dish_id,
                'dish_name': name,
                'title': f'{name}家常做法教学',
                'category': category,
                'tags': list(cat_tags.get(category, ['家常菜'])),
                'cover': '',
                'duration': '',
                'source': 'bilibili',
                'author': '',
                'external_url': f'https://www.bilibili.com/search?keyword={name}做法',
                'video_url': '',
                'playable_in_miniprogram': False,
                'description': f'{name}的做法教学。',
                'play_count': 0,
            }
            videos.append(video)
            fail_count += 1
            log(f'    ❌ 未获取到，保留搜索链接占位')

        # 每次请求间隔 1.5 秒，避免限流
        if i < total:
            time.sleep(1.5)

        # 每 20 条打印进度
        if i % 20 == 0:
            log(f'--- 进度: {i}/{total} ---')

    # 汇总
    log('\n' + '=' * 80)
    log(f'\n获取结果汇总：')
    log(f'   总数：{total}')
    log(f'   ✅ 成功获取具体视频链接：{success_count}')
    log(f'   ❌ 失败（保留搜索链接）：{fail_count}')

    # 失败的菜品列表
    if fail_count > 0:
        log(f'\n失败的菜品：')
        for v in videos:
            if not v['author']:
                log(f'   dish_id={v["dish_id"]} {v["dish_name"]}')

    # 更新 dish-videos.json（保留 _说明 和 _收集模板）
    existing['videos'] = videos
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)
    log(f'\n✅ 已更新 {JSON_PATH}')

    # 同时生成前端 mock/dish-videos.js
    js_lines = []
    js_lines.append('/**')
    js_lines.append(' * 菜品教学视频 Mock 数据（自动生成，请勿手动编辑）')
    js_lines.append(' * 与后端 dish_videos 表 / dish-videos.json 一一对应。')
    js_lines.append(' * 仅在后端不可用时作为降级数据使用。')
    js_lines.append(' */')
    js_lines.append('')
    js_lines.append('const dishVideos = ' + json.dumps(videos, ensure_ascii=False, indent=2))
    js_lines.append('')
    js_lines.append('function getVideosByDish(dishId) {')
    js_lines.append('  return dishVideos.filter(v => v.dishId === dishId)')
    js_lines.append('}')
    js_lines.append('')
    js_lines.append('function getVideoById(videoId) {')
    js_lines.append('  return dishVideos.find(v => v.id === videoId) || null')
    js_lines.append('')
    js_lines.append('function getAllVideos(category) {')
    js_lines.append("  if (!category || category === '全部' || category === 'all') return dishVideos")
    js_lines.append('  return dishVideos.filter(v => v.category === category)')
    js_lines.append('}')
    js_lines.append('')
    js_lines.append('function getSources() {')
    js_lines.append('  const set = new Set(dishVideos.map(v => v.source).filter(Boolean))')
    js_lines.append('  return Array.from(set)')
    js_lines.append('}')
    js_lines.append('')
    js_lines.append('module.exports = {')
    js_lines.append('  dishVideos,')
    js_lines.append('  getVideosByDish,')
    js_lines.append('  getVideoById,')
    js_lines.append('  getAllVideos,')
    js_lines.append('  getSources')
    js_lines.append('}')

    with open(MOCK_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(js_lines))
    log(f'✅ 已更新 {MOCK_PATH}')

    log_file.close()
    print(f'DONE: total={total} success={success_count} failed={fail_count}')
    print(f'Log: {LOG_PATH}')


if __name__ == '__main__':
    main()
