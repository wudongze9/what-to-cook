"""
菜品数据库 - 从 miniprogram/mock/dishes.js 迁移
"""

dishes = [
    {
        "id": 1,
        "name": "番茄炒蛋",
        "category": "家常菜",
        "categoryTag": "快手菜",
        "description": "经典中式家常菜，酸甜可口，营养丰富，十分钟搞定！",
        "difficulty": "简单",
        "time": 10,
        "calories": 180,
        "ingredients": ["番茄", "鸡蛋", "葱花", "盐", "糖"],
        "steps": [
            {"title": "准备食材", "desc": "番茄切块，鸡蛋打散加少许盐搅匀，葱切葱花", "time": 2},
            {"title": "炒鸡蛋", "desc": "热锅倒油，油温七成热时倒入蛋液，快速翻炒至凝固盛出", "time": 2},
            {"title": "炒番茄", "desc": "锅中再加少许油，放入番茄块翻炒出汁", "time": 3},
            {"title": "合炒调味", "desc": "倒回鸡蛋，加盐和少许糖翻炒均匀", "time": 2},
            {"title": "出锅装盘", "desc": "撒上葱花，翻炒几下即可出锅", "time": 1}
        ],
        "tips": "番茄要选熟透的才甜，鸡蛋不要炒太老",
        "videoId": "v001"
    },
    {
        "id": 2,
        "name": "青椒肉丝",
        "category": "家常菜",
        "categoryTag": "快手菜",
        "description": "下饭神菜！肉丝嫩滑，青椒爽脆，米饭杀手。",
        "difficulty": "简单",
        "time": 15,
        "calories": 220,
        "ingredients": ["猪肉", "青椒", "生抽", "料酒", "淀粉", "蒜", "盐"],
        "steps": [
            {"title": "腌制肉丝", "desc": "猪肉切丝，加生抽、料酒、淀粉腌制15分钟", "time": 15},
            {"title": "准备配菜", "desc": "青椒去籽切丝，蒜切片", "time": 2},
            {"title": "滑炒肉丝", "desc": "热锅凉油，下肉丝滑炒至变色盛出", "time": 2},
            {"title": "炒青椒", "desc": "锅中留底油，下蒜片爆香，放入青椒丝翻炒", "time": 2},
            {"title": "合炒调味", "desc": "倒回肉丝，加生抽、盐调味，翻炒均匀出锅", "time": 1}
        ],
        "tips": "肉丝顺着纹理切更嫩，腌制时加淀粉锁住水分",
        "videoId": "v002"
    },
    {
        "id": 3,
        "name": "红烧肉",
        "category": "家常菜",
        "categoryTag": "经典菜",
        "description": "肥而不腻，入口即化的经典红烧肉，家的味道。",
        "difficulty": "中等",
        "time": 60,
        "calories": 450,
        "ingredients": ["五花肉", "冰糖", "生抽", "老抽", "料酒", "八角", "桂皮", "姜片"],
        "steps": [
            {"title": "处理五花肉", "desc": "五花肉切3cm方块，冷水下锅焯水去腥，捞出洗净", "time": 10},
            {"title": "炒糖色", "desc": "锅中放少许油，加入冰糖小火慢炒至枣红色", "time": 5},
            {"title": "煸炒上色", "desc": "放入五花肉翻炒上色，加料酒去腥", "time": 3},
            {"title": "炖煮入味", "desc": "加入开水没过肉块，放生抽、老抽、八角、桂皮、姜片，大火烧开转小火炖40分钟", "time": 40},
            {"title": "收汁装盘", "desc": "大火收汁至浓稠，汤汁包裹肉块即可", "time": 5}
        ],
        "tips": "炖煮时一定要加热水，冷水会让肉质发紧；冰糖比白糖上色更好看",
        "videoId": "v003"
    },
    {
        "id": 4,
        "name": "蒜蓉西兰花",
        "category": "家常菜",
        "categoryTag": "健康菜",
        "description": "清淡爽口，营养满分，减脂期也能放心吃。",
        "difficulty": "简单",
        "time": 8,
        "calories": 85,
        "ingredients": ["西兰花", "蒜", "盐", "蚝油", "食用油"],
        "steps": [
            {"title": "处理西兰花", "desc": "西兰花掰成小朵，清水浸泡10分钟后洗净", "time": 10},
            {"title": "焯水", "desc": "烧开水加少许盐和油，放入西兰花焯水1分钟捞出", "time": 2},
            {"title": "炒蒜末", "desc": "锅中放油，小火煸香蒜末", "time": 1},
            {"title": "翻炒调味", "desc": "放入西兰花，加蚝油和少许盐翻炒均匀即可", "time": 1}
        ],
        "tips": "焯水时间不要太长，保持脆嫩口感",
        "videoId": "v004"
    },
    {
        "id": 5,
        "name": "蛋炒饭",
        "category": "主食",
        "categoryTag": "快手菜",
        "description": "粒粒分明，蛋香四溢，最简单的美味。",
        "difficulty": "简单",
        "time": 10,
        "calories": 350,
        "ingredients": ["隔夜米饭", "鸡蛋", "葱花", "盐", "食用油"],
        "steps": [
            {"title": "准备米饭", "desc": "隔夜米饭提前用手拨散（或用勺子打散）", "time": 1},
            {"title": "炒鸡蛋", "desc": "热锅倒油，打入鸡蛋快速炒散", "time": 1},
            {"title": "炒米饭", "desc": "倒入米饭，大火翻炒，让每粒米都裹上蛋液", "time": 5},
            {"title": "调味出锅", "desc": "加盐调味，撒葱花翻炒均匀出锅", "time": 1}
        ],
        "tips": "一定要用隔夜饭，水分少更容易炒散",
        "videoId": "v005"
    },
    {
        "id": 6,
        "name": "酸辣土豆丝",
        "category": "家常菜",
        "categoryTag": "快手菜",
        "description": "酸辣爽脆，开胃下饭，十分钟搞定一道菜。",
        "difficulty": "简单",
        "time": 12,
        "calories": 120,
        "ingredients": ["土豆", "干辣椒", "花椒", "醋", "盐", "蒜", "葱"],
        "steps": [
            {"title": "切丝泡水", "desc": "土豆去皮切细丝，泡入清水中去淀粉，沥干备用", "time": 5},
            {"title": "爆香辅料", "desc": "热锅倒油，放入花椒、干辣椒、蒜片爆香", "time": 1},
            {"title": "翻炒土豆丝", "desc": "放入土豆丝大火快炒，加醋翻炒", "time": 3},
            {"title": "调味出锅", "desc": "加盐调味，撒葱花出锅", "time": 1}
        ],
        "tips": "土豆丝切好后一定要泡水去淀粉，这样炒出来才脆",
        "videoId": "v006"
    },
    {
        "id": 7,
        "name": "清蒸鲈鱼",
        "category": "海鲜",
        "categoryTag": "健康菜",
        "description": "鲜嫩无比，原汁原味，宴客必备硬菜。",
        "difficulty": "中等",
        "time": 25,
        "calories": 150,
        "ingredients": ["鲈鱼", "葱丝", "姜丝", "蒸鱼豉油", "料酒", "红椒丝"],
        "steps": [
            {"title": "处理鲈鱼", "desc": "鲈鱼去鳞去内脏洗净，鱼身两面划三刀，抹料酒腌制10分钟", "time": 10},
            {"title": "摆盘上锅", "desc": "鱼身放姜丝，水开后上锅大火蒸8分钟", "time": 8},
            {"title": "去腥提味", "desc": "倒掉蒸鱼水，铺上葱丝、姜丝、红椒丝，淋上蒸鱼豉油", "time": 2},
            {"title": "浇热油", "desc": "锅中烧热油，浇在鱼身的葱姜丝上，滋啦一声即可", "time": 1}
        ],
        "tips": "蒸鱼时间不要太长，8-10分钟刚好；一定要水开后再放鱼",
        "videoId": "v007"
    },
    {
        "id": 8,
        "name": "宫保鸡丁",
        "category": "川菜",
        "categoryTag": "经典菜",
        "description": "麻辣鲜香，鸡丁滑嫩，花生酥脆，经典川菜代表作。",
        "difficulty": "中等",
        "time": 20,
        "calories": 280,
        "ingredients": ["鸡胸肉", "花生米", "干辣椒", "花椒", "黄瓜", "胡萝卜", "生抽", "醋", "糖", "淀粉"],
        "steps": [
            {"title": "腌制鸡丁", "desc": "鸡胸肉切丁，加生抽、料酒、淀粉腌制15分钟", "time": 15},
            {"title": "炸花生米", "desc": "冷油下花生米，小火慢炸至金黄酥脆捞出", "time": 5},
            {"title": "炒鸡丁", "desc": "热锅宽油，放入鸡丁滑炒至变色盛出", "time": 3},
            {"title": "爆香辅料", "desc": "锅中留底油，爆香干辣椒、花椒", "time": 1},
            {"title": "合炒收汁", "desc": "倒回鸡丁，加黄瓜丁、胡萝卜丁，淋入调好的酱汁（生抽+醋+糖+水+淀粉），快速翻炒，最后撒花生米", "time": 3}
        ],
        "tips": "花生米最后放，保持酥脆；酱汁要提前调好",
        "videoId": "v008"
    },
    {
        "id": 9,
        "name": "紫菜蛋花汤",
        "category": "汤煲",
        "categoryTag": "快手菜",
        "description": "简单快手的家常汤品，鲜香可口，几分钟搞定。",
        "difficulty": "简单",
        "time": 8,
        "calories": 60,
        "ingredients": ["紫菜", "鸡蛋", "盐", "香油", "葱花", "虾皮"],
        "steps": [
            {"title": "泡紫菜", "desc": "紫菜撕成小块，用温水泡软", "time": 2},
            {"title": "烧水", "desc": "锅中烧开水，加入虾皮煮1分钟", "time": 2},
            {"title": "淋入蛋液", "desc": "鸡蛋打散，沿锅边慢慢淋入蛋液，形成蛋花", "time": 2},
            {"title": "调味出锅", "desc": "放入紫菜，加盐调味，淋香油，撒葱花", "time": 1}
        ],
        "tips": "蛋液要慢慢淋，不要搅动，这样蛋花才漂亮",
        "videoId": None
    },
    {
        "id": 10,
        "name": "糖醋排骨",
        "category": "家常菜",
        "categoryTag": "经典菜",
        "description": "外酥里嫩，酸甜适口，大人小孩都爱吃。",
        "difficulty": "中等",
        "time": 40,
        "calories": 380,
        "ingredients": ["排骨", "冰糖", "生抽", "老抽", "醋", "料酒", "姜片", "白芝麻"],
        "steps": [
            {"title": "焯水排骨", "desc": "排骨冷水下锅，加姜片料酒焯水，捞出洗净", "time": 10},
            {"title": "炒糖色", "desc": "锅中放油，加冰糖小火炒至枣红色", "time": 3},
            {"title": "煸炒排骨", "desc": "放入排骨翻炒上色", "time": 3},
            {"title": "炖煮", "desc": "加热水没过排骨，加生抽、老抽、料酒，大火烧开转小火炖25分钟", "time": 25},
            {"title": "收汁装盘", "desc": "加醋，大火收汁至浓稠，撒白芝麻装盘", "time": 3}
        ],
        "tips": "醋要最后加，太早会挥发；收汁时注意翻动防止粘锅",
        "videoId": "v009"
    }
]

all_ingredients = [
    {"name": "番茄", "emoji": "🍅"},
    {"name": "鸡蛋", "emoji": "🥚"},
    {"name": "西兰花", "emoji": "🥦"},
    {"name": "鸡肉", "emoji": "🍗"},
    {"name": "蘑菇", "emoji": "🍄"},
    {"name": "虾", "emoji": "🦐"},
    {"name": "洋葱", "emoji": "🧅"},
    {"name": "米饭", "emoji": "🍚"},
    {"name": "土豆", "emoji": "🥔"},
    {"name": "猪肉", "emoji": "🥩"},
    {"name": "青椒", "emoji": "🫑"},
    {"name": "豆腐", "emoji": "🧈"},
    {"name": "鱼", "emoji": "🐟"},
    {"name": "排骨", "emoji": "🍖"},
    {"name": "蒜", "emoji": "🧄"},
    {"name": "葱", "emoji": "🧅"}
]

def get_categories():
    cats = set()
    for d in dishes:
        cats.add(d["category"])
        if d.get("categoryTag"):
            cats.add(d["categoryTag"])
    return ["全部"] + sorted(cats)