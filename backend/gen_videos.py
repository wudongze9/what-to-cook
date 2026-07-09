"""
生成 dish-videos.json：为所有菜品生成教学视频链接条目
从数据库读取菜品信息，按正确 id→name 映射生成视频数据。
同时生成前端 mock/dish-videos.js 降级数据。
运行：python gen_videos.py
"""
import json
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'whattocook.db')
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'app', 'data', 'dish-videos.json')
MOCK_PATH = os.path.join(os.path.dirname(__file__), '..', 'miniprogram', 'mock', 'dish-videos.js')

# 按菜系生成标签
CATEGORY_TAGS = {
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

# 按难度补充标签
DIFFICULTY_TAGS = {
    '简单': ['新手友好'],
    '中等': [],
    '较难': ['宴客菜'],
}

# 按烹饪时间估算视频时长
def estimate_duration(cook_time):
    if cook_time <= 10:
        return '05:00'
    elif cook_time <= 20:
        return '08:00'
    elif cook_time <= 40:
        return '12:00'
    elif cook_time <= 60:
        return '15:00'
    else:
        return '20:00'


def generate():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT d.id, d.name, c.name as category, d.cuisine, d.difficulty, d.time, d.description
        FROM dishes d
        LEFT JOIN categories c ON d.category_id = c.id
        ORDER BY d.id
    """).fetchall()
    conn.close()

    videos = []
    for r in rows:
        dish_id = r['id']
        name = r['name']
        category = r['category'] or '家常菜'
        difficulty = r['difficulty'] or '简单'
        cook_time = r['time'] or 15
        desc = r['description'] or ''

        # 生成拼音式 ID（用 dish_id 保证唯一）
        vid = f'v_dish_{dish_id:03d}'

        # 标签
        tags = list(CATEGORY_TAGS.get(category, ['家常菜']))
        tags.extend(DIFFICULTY_TAGS.get(difficulty, []))
        # 去重
        tags = list(dict.fromkeys(tags))

        # 视频标题
        title = f'{name}家常做法教学，手把手教你做出好味道'

        # 视频简介
        video_desc = f'{name}的详细做法教学。'
        if desc:
            video_desc += desc
        video_desc += ' 从食材准备到火候控制，新手也能学会。'

        video = {
            'id': vid,
            'dish_id': dish_id,
            'dish_name': name,
            'title': title,
            'category': category,
            'tags': tags,
            'cover': '',
            'duration': estimate_duration(cook_time),
            'source': 'bilibili',
            'author': '教学视频',
            'external_url': f'https://www.bilibili.com/search?keyword={name}做法',
            'video_url': '',
            'playable_in_miniprogram': False,
            'description': video_desc
        }
        videos.append(video)

    # 组装完整 JSON（保留说明和模板）
    output = {
        '_说明': {
            '用途': '菜品教学视频种子数据，每道菜绑定一个外部视频链接',
            '数据结构': '每个对象对应 dish_videos 表一条记录',
            '字段说明': {
                'id': '视频条目 ID，格式 v_dish_{dish_id:03d}',
                'dish_id': '菜品 ID（对应 dishes 表 id）',
                'dish_name': '菜品名（冗余字段，方便核对）',
                'title': '视频标题',
                'category': '所属菜系',
                'tags': '标签数组',
                'cover': '封面图 URL（可后续补充）',
                'duration': '预估时长',
                'source': '来源平台：bilibili/douyin/xiaohongshu/youtube/other',
                'author': 'UP主或作者名',
                'external_url': '外部页面链接（B站搜索链接，可替换为具体视频页）',
                'video_url': '可直接播放的 mp4/HLS 地址，有才填',
                'playable_in_miniprogram': '是否能在小程序 <video> 直接播放（false=需跳转）',
                'description': '视频简介'
            },
            '收集方法': {
                'step1': '在 B站/抖音/小红书/YouTube 搜索菜名 + "做法"',
                'step2': '挑选清晰、步骤完整的教学视频',
                'step3': '复制视频页面链接填入 external_url（替换搜索链接）',
                'step4': '记录标题、UP主、时长、封面',
                'step5': 'playable_in_miniprogram 默认 false',
                'step6': '若找到 mp4 直链，可填 video_url 并设 playable_in_miniprogram 为 true'
            },
            '注意事项': [
                '当前 external_url 为 B站搜索链接占位，可替换为具体视频页 URL',
                '外链视频在小程序中只能复制链接跳转，不能用 <video> 直接播放',
                '收集后运行 python migrate.py 重新导入数据库',
                '共 100 道菜，每道菜至少有 1 条视频链接'
            ]
        },
        '_收集模板_复制此块修改': {
            'id': 'v_dish_xxx',
            'dish_id': 0,
            'dish_name': '菜品名',
            'title': '视频标题',
            'category': '家常菜',
            'tags': ['家常菜'],
            'cover': '',
            'duration': '08:00',
            'source': 'bilibili',
            'author': '',
            'external_url': '',
            'video_url': '',
            'playable_in_miniprogram': False,
            'description': ''
        },
        'videos': videos
    }

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f'✅ 已生成 {len(videos)} 条视频数据 → {OUTPUT_PATH}')

    # ====== 同时生成前端 mock/dish-videos.js ======
    js_lines = []
    js_lines.append('/**')
    js_lines.append(' * 菜品教学视频 Mock 数据（自动生成，请勿手动编辑）')
    js_lines.append(' * 与后端 dish_videos 表 / dish-videos.json 一一对应。')
    js_lines.append(' * 仅在后端不可用时作为降级数据使用。')
    js_lines.append(' *')
    js_lines.append(' * 字段说明：')
    js_lines.append(' * - id: 视频条目 ID')
    js_lines.append(' * - dishId: 绑定的菜品 ID')
    js_lines.append(' * - dishName: 菜品名')
    js_lines.append(' * - title: 视频标题')
    js_lines.append(' * - category: 所属菜系')
    js_lines.append(' * - tags: 标签数组')
    js_lines.append(' * - cover: 封面图 URL')
    js_lines.append(' * - duration: 时长字符串')
    js_lines.append(' * - source: 来源平台')
    js_lines.append(' * - author: UP主或作者名')
    js_lines.append(' * - externalUrl: 外部页面链接')
    js_lines.append(' * - videoUrl: 可直接播放的 mp4/HLS 地址')
    js_lines.append(' * - playableInMiniprogram: 是否能在小程序 <video> 直接播放')
    js_lines.append(' * - description: 视频简介')
    js_lines.append(' */')
    js_lines.append('')
    frontend_videos = []
    for v in videos:
        frontend_videos.append({
            'id': v['id'],
            'dishId': v['dish_id'],
            'dishName': v['dish_name'],
            'title': v['title'],
            'category': v.get('category', ''),
            'tags': v.get('tags', []),
            'cover': v.get('cover', ''),
            'duration': v.get('duration', ''),
            'source': v.get('source', ''),
            'author': v.get('author', ''),
            'externalUrl': v.get('external_url', ''),
            'videoUrl': v.get('video_url', ''),
            'playableInMiniprogram': bool(v.get('playable_in_miniprogram')),
            'description': v.get('description', ''),
        })

    js_lines.append('const dishVideos = ' + json.dumps(frontend_videos, ensure_ascii=False, indent=2))
    js_lines.append('')
    js_lines.append('/**')
    js_lines.append(' * 按菜品 ID 查询所有教学视频')
    js_lines.append(' */')
    js_lines.append('function getVideosByDish(dishId) {')
    js_lines.append('  return dishVideos.filter(v => v.dishId === dishId)')
    js_lines.append('}')
    js_lines.append('')
    js_lines.append('/**')
    js_lines.append(' * 按视频 ID 查询单个视频')
    js_lines.append(' */')
    js_lines.append('function getVideoById(videoId) {')
    js_lines.append('  return dishVideos.find(v => v.id === videoId) || null')
    js_lines.append('}')
    js_lines.append('')
    js_lines.append('/**')
    js_lines.append(' * 获取所有视频（可按菜系筛选）')
    js_lines.append(' */')
    js_lines.append('function getAllVideos(category) {')
    js_lines.append("  if (!category || category === '全部' || category === 'all') return dishVideos")
    js_lines.append('  return dishVideos.filter(v => v.category === category)')
    js_lines.append('}')
    js_lines.append('')
    js_lines.append('/**')
    js_lines.append(' * 获取所有视频来源平台')
    js_lines.append(' */')
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
    print(f'✅ 已生成前端 mock → {MOCK_PATH}')

    # 统计菜系分布
    from collections import Counter
    cat_count = Counter(v['category'] for v in videos)
    print('📊 菜系分布：')
    for cat, cnt in sorted(cat_count.items(), key=lambda x: -x[1]):
        print(f'   {cat}：{cnt} 条')


if __name__ == '__main__':
    generate()
