"""
视频数据 - 从 miniprogram/mock/videos.js 迁移
"""

videos = [
    {
        "id": "v001", "title": "零基础学会番茄炒蛋 — 大厨手把手教学",
        "chef": "王大厨", "chefAvatar": "/images/icons/chef.svg",
        "cover": "/images/video-cover-food.svg", "duration": "12:30",
        "views": "23.5万", "category": "家常菜", "isFeatured": True,
        "videoUrl": "", "description": "从切番茄到出锅，每一步都详细讲解，新手也能做出饭店味道"
    },
    {
        "id": "v002", "title": "5分钟快手炒饭",
        "chef": "李师傅", "chefAvatar": "/images/icons/chef.svg",
        "cover": "/images/video-cover-food.svg", "duration": "5:45",
        "views": "18.2万", "category": "快手菜", "isFeatured": False,
        "videoUrl": "", "description": "利用隔夜饭，5分钟做出粒粒分明的蛋炒饭"
    },
    {
        "id": "v003", "title": "红烧肉入门教程",
        "chef": "张阿姨", "chefAvatar": "/images/icons/chef.svg",
        "cover": "/images/video-cover-food.svg", "duration": "18:20",
        "views": "45.6万", "category": "家常菜", "isFeatured": False,
        "videoUrl": "", "description": "肥而不腻入口即化的秘诀，30年经验大厨倾囊相授"
    },
    {
        "id": "v004", "title": "清蒸鲈鱼的做法",
        "chef": "陈大厨", "chefAvatar": "/images/icons/chef.svg",
        "cover": "/images/video-cover-food.svg", "duration": "10:15",
        "views": "12.8万", "category": "海鲜", "isFeatured": False,
        "videoUrl": "", "description": "鲜嫩无比的清蒸鲈鱼，宴客必备硬菜"
    },
    {
        "id": "v005", "title": "家常酸辣土豆丝",
        "chef": "王大厨", "chefAvatar": "/images/icons/chef.svg",
        "cover": "/images/video-cover-food.svg", "duration": "7:30",
        "views": "31.4万", "category": "家常菜", "isFeatured": False,
        "videoUrl": "", "description": "酸辣爽脆开胃下饭，新手也能一次成功"
    },
    {
        "id": "v006", "title": "宫保鸡丁 - 正宗川味做法",
        "chef": "刘师傅", "chefAvatar": "/images/icons/chef.svg",
        "cover": "/images/video-cover-food.svg", "duration": "15:00",
        "views": "27.9万", "category": "川菜", "isFeatured": False,
        "videoUrl": "", "description": "麻辣鲜香花生酥脆，学会这道菜你就是川菜达人"
    },
    {
        "id": "v007", "title": "糖醋排骨 - 酸甜适口",
        "chef": "张阿姨", "chefAvatar": "/images/icons/chef.svg",
        "cover": "/images/video-cover-food.svg", "duration": "16:45",
        "views": "52.3万", "category": "家常菜", "isFeatured": True,
        "videoUrl": "", "description": "外酥里嫩酸甜适口，大人小孩都爱的经典菜"
    },
    {
        "id": "v008", "title": "紫菜蛋花汤 - 3分钟快手汤",
        "chef": "李师傅", "chefAvatar": "/images/icons/chef.svg",
        "cover": "/images/video-cover-food.svg", "duration": "3:20",
        "views": "8.6万", "category": "汤煲", "isFeatured": False,
        "videoUrl": "", "description": "最简单的家常汤品，鲜香可口几分钟搞定"
    }
]

video_categories = ["全部", "家常菜", "快手菜", "川菜", "海鲜", "汤煲", "甜品"]