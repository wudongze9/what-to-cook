/**
 * 菜品数据库 - Mock 数据
 * 包含菜品名称、所需食材、分类、难度、时间、热量、步骤
 * 支持菜系(cuisine)和口味程度(spiceLevel)筛选
 */

// ==================== 菜系 ====================
const cuisineTypes = [
  { key: 'all', name: '全部', emoji: '🍜' },
  { key: 'home', name: '家常菜', emoji: '🏠' },
  { key: 'sichuan', name: '川菜', emoji: '🌶️' },
  { key: 'cantonese', name: '粤菜', emoji: '🥘' },
  { key: 'hunan', name: '湘菜', emoji: '🔥' },
  { key: 'shandong', name: '鲁菜', emoji: '🫕' },
  { key: 'jiangsu', name: '苏菜', emoji: '🥢' },
  { key: 'zhejiang', name: '浙菜', emoji: '🐟' },
  { key: 'northeast', name: '东北菜', emoji: '🥟' },
  { key: 'western', name: '西餐', emoji: '🥩' },
  { key: 'japanese', name: '日料', emoji: '🍣' },
  { key: 'dessert', name: '甜品', emoji: '🍰' }
]

// ==================== 口味程度 ====================
const spiceLevels = [
  { key: 'all', name: '不限', emoji: '🍽️' },
  { key: 'mild', name: '清淡', emoji: '🥬' },
  { key: 'light_spicy', name: '微辣', emoji: '🌿' },
  { key: 'medium_spicy', name: '中辣', emoji: '🌶️' },
  { key: 'heavy_spicy', name: '重辣', emoji: '🔥' },
  { key: 'sweet', name: '甜口', emoji: '🍯' },
  { key: 'sour', name: '酸口', emoji: '🍋' },
  { key: 'salty', name: '咸鲜', emoji: '🧂' }
]

// ==================== 食材分类 ====================
const ingredientTypes = [
  { key: 'all', name: '全部', emoji: '🎲' },
  { key: 'vegetable', name: '蔬菜', emoji: '🥬' },
  { key: 'meat', name: '肉禽', emoji: '🥩' },
  { key: 'seafood', name: '海鲜', emoji: '🦐' },
  { key: 'egg', name: '蛋豆', emoji: '🥚' },
  { key: 'staple', name: '主食', emoji: '🍚' },
  { key: 'seasoning', name: '调味', emoji: '🧂' }
]

// ==================== 所有食材 ====================
const allIngredients = [
  // 蔬菜类
  { name: '番茄', emoji: '🍅', type: 'vegetable' },
  { name: '西兰花', emoji: '🥦', type: 'vegetable' },
  { name: '土豆', emoji: '🥔', type: 'vegetable' },
  { name: '青椒', emoji: '🫑', type: 'vegetable' },
  { name: '白菜', emoji: '🥬', type: 'vegetable' },
  { name: '菠菜', emoji: '🥬', type: 'vegetable' },
  { name: '芹菜', emoji: '🥬', type: 'vegetable' },
  { name: '胡萝卜', emoji: '🥕', type: 'vegetable' },
  { name: '洋葱', emoji: '🧅', type: 'vegetable' },
  { name: '蘑菇', emoji: '🍄', type: 'vegetable' },
  { name: '茄子', emoji: '🍆', type: 'vegetable' },
  { name: '豆角', emoji: '🫘', type: 'vegetable' },
  { name: '冬瓜', emoji: '🥒', type: 'vegetable' },
  { name: '苦瓜', emoji: '🥒', type: 'vegetable' },
  { name: '丝瓜', emoji: '🥒', type: 'vegetable' },
  { name: '莲藕', emoji: '🥔', type: 'vegetable' },
  { name: '木耳', emoji: '🍄', type: 'vegetable' },
  { name: '笋', emoji: '📝', type: 'vegetable' },
  { name: '黄瓜', emoji: '🥒', type: 'vegetable' },
  { name: '南瓜', emoji: '🎃', type: 'vegetable' },
  { name: '韭菜', emoji: '🥬', type: 'vegetable' },
  { name: '蒜薹', emoji: '🥬', type: 'vegetable' },
  { name: '小白菜', emoji: '🥬', type: 'vegetable' },
  { name: '空心菜', emoji: '🥬', type: 'vegetable' },
  { name: '生菜', emoji: '🥬', type: 'vegetable' },
  { name: '玉米', emoji: '🌽', type: 'vegetable' },

  // 肉禽类
  { name: '猪肉', emoji: '🥩', type: 'meat' },
  { name: '五花肉', emoji: '🥩', type: 'meat' },
  { name: '排骨', emoji: '🍖', type: 'meat' },
  { name: '猪肝', emoji: '🥩', type: 'meat' },
  { name: '鸡胸肉', emoji: '🍗', type: 'meat' },
  { name: '鸡腿', emoji: '🍗', type: 'meat' },
  { name: '鸡翅', emoji: '🍗', type: 'meat' },
  { name: '鸭肉', emoji: '🦆', type: 'meat' },
  { name: '牛肉', emoji: '🥩', type: 'meat' },
  { name: '牛腱', emoji: '🥩', type: 'meat' },
  { name: '牛腩', emoji: '🥩', type: 'meat' },
  { name: '肥牛', emoji: '🥩', type: 'meat' },
  { name: '猪里脊', emoji: '🥩', type: 'meat' },
  { name: '羊肉', emoji: '🥩', type: 'meat' },
  { name: '腊肉', emoji: '🥓', type: 'meat' },
  { name: '香肠', emoji: '🌭', type: 'meat' },

  // 海鲜类
  { name: '虾', emoji: '🦐', type: 'seafood' },
  { name: '鲈鱼', emoji: '🐟', type: 'seafood' },
  { name: '三文鱼', emoji: '🐟', type: 'seafood' },
  { name: '鲫鱼', emoji: '🐟', type: 'seafood' },
  { name: '螃蟹', emoji: '🦀', type: 'seafood' },
  { name: '蛤蜊', emoji: '🐚', type: 'seafood' },
  { name: '鱿鱼', emoji: '🦑', type: 'seafood' },
  { name: '带鱼', emoji: '🐟', type: 'seafood' },
  { name: '龙虾', emoji: '🦞', type: 'seafood' },
  { name: '扇贝', emoji: '🐚', type: 'seafood' },
  { name: '海参', emoji: '🥬', type: 'seafood' },

  // 蛋豆制品
  { name: '鸡蛋', emoji: '🥚', type: 'egg' },
  { name: '鸭蛋', emoji: '🥚', type: 'egg' },
  { name: '咸鸭蛋', emoji: '🥚', type: 'egg' },
  { name: '豆腐', emoji: '🧈', type: 'egg' },
  { name: '豆干', emoji: '🧈', type: 'egg' },
  { name: '腐竹', emoji: '🧈', type: 'egg' },
  { name: '豆皮', emoji: '🧈', type: 'egg' },
  { name: '千张', emoji: '🧈', type: 'egg' },
  { name: '豌豆', emoji: '🫘', type: 'egg' },
  { name: '红豆', emoji: '🫘', type: 'egg' },
  { name: '绿豆', emoji: '🫘', type: 'egg' },

  // 主食类
  { name: '米饭', emoji: '🍚', type: 'staple' },
  { name: '隔夜米饭', emoji: '🍚', type: 'staple' },
  { name: '面条', emoji: '🍜', type: 'staple' },
  { name: '馒头', emoji: '🥟', type: 'staple' },
  { name: '饺子皮', emoji: '🥟', type: 'staple' },
  { name: '意面', emoji: '🍝', type: 'staple' },
  { name: '年糕', emoji: '🍚', type: 'staple' },
  { name: '粉丝', emoji: '🍜', type: 'staple' },
  { name: '粉条', emoji: '🍜', type: 'staple' },
  { name: '糯米', emoji: '🍚', type: 'staple' },

  // 调味料
  { name: '蒜', emoji: '🧄', type: 'seasoning' },
  { name: '蒜泥', emoji: '🧄', type: 'seasoning' },
  { name: '蒜苗', emoji: '🧄', type: 'seasoning' },
  { name: '蒜蓉', emoji: '🧄', type: 'seasoning' },
  { name: '葱', emoji: '🧅', type: 'seasoning' },
  { name: '葱花', emoji: '🧅', type: 'seasoning' },
  { name: '葱丝', emoji: '🧅', type: 'seasoning' },
  { name: '姜', emoji: '🫚', type: 'seasoning' },
  { name: '姜片', emoji: '🫚', type: 'seasoning' },
  { name: '盐', emoji: '🧂', type: 'seasoning' },
  { name: '糖', emoji: '🍬', type: 'seasoning' },
  { name: '冰糖', emoji: '🍬', type: 'seasoning' },
  { name: '醋', emoji: '🫗', type: 'seasoning' },
  { name: '酱油', emoji: '🫗', type: 'seasoning' },
  { name: '生抽', emoji: '🫗', type: 'seasoning' },
  { name: '老抽', emoji: '🫗', type: 'seasoning' },
  { name: '蚝油', emoji: '🫗', type: 'seasoning' },
  { name: '蒸鱼豉油', emoji: '🫗', type: 'seasoning' },
  { name: '豆瓣酱', emoji: '🌶️', type: 'seasoning' },
  { name: '剁椒', emoji: '🌶️', type: 'seasoning' },
  { name: '花椒', emoji: '🌶️', type: 'seasoning' },
  { name: '花椒粉', emoji: '🌶️', type: 'seasoning' },
  { name: '辣椒油', emoji: '🌶️', type: 'seasoning' },
  { name: '八角', emoji: '⭐', type: 'seasoning' },
  { name: '桂皮', emoji: '🌿', type: 'seasoning' },
  { name: '干辣椒', emoji: '🌶️', type: 'seasoning' },
  { name: '料酒', emoji: '🫗', type: 'seasoning' },
  { name: '淀粉', emoji: '🥣', type: 'seasoning' },
  { name: '芝麻', emoji: '🥜', type: 'seasoning' },
  { name: '白芝麻', emoji: '🥜', type: 'seasoning' },
  { name: '花生', emoji: '🥜', type: 'seasoning' },
  { name: '花生米', emoji: '🥜', type: 'seasoning' },
  { name: '香油', emoji: '🫗', type: 'seasoning' },
  { name: '番茄酱', emoji: '🍅', type: 'seasoning' },
  { name: '可乐', emoji: '🥤', type: 'seasoning' },
  { name: '豆豉', emoji: '🫘', type: 'seasoning' },
  { name: '泡椒', emoji: '🌶️', type: 'seasoning' },
  { name: '香菜', emoji: '🌿', type: 'seasoning' },
  { name: '食用油', emoji: '🫗', type: 'seasoning' },
  { name: '虾皮', emoji: '🦐', type: 'seasoning' },
  { name: '沙拉酱', emoji: '🥣', type: 'seasoning' }
]

// ==================== 菜品列表 ====================
const dishes = [
  // ========== 1. 番茄炒蛋 ==========
  {
    id: 1,
    name: '番茄炒蛋',
    category: '家常菜',
    categoryTag: '快手菜',
    description: '经典中式家常菜，酸甜可口，营养丰富，十分钟搞定！',
    difficulty: '简单',
    time: 10,
    calories: 180,
    ingredients: ['番茄', '鸡蛋', '葱花', '盐', '糖'],
    steps: [
      { title: '准备食材', desc: '番茄切块，鸡蛋打散加少许盐搅匀，葱切葱花', time: 2 },
      { title: '炒鸡蛋', desc: '热锅倒油，油温七成热时倒入蛋液，快速翻炒至凝固盛出', time: 2 },
      { title: '炒番茄', desc: '锅中再加少许油，放入番茄块翻炒出汁', time: 3 },
      { title: '合炒调味', desc: '倒回鸡蛋，加盐和少许糖翻炒均匀', time: 2 },
      { title: '出锅装盘', desc: '撒上葱花，翻炒几下即可出锅', time: 1 }
    ],
    tips: '番茄要选熟透的才甜，鸡蛋不要炒太老',
    videoId: 'v001',
    cuisine: 'home',
    spiceLevel: 'mild'
  },

  // ========== 2. 青椒肉丝 ==========
  {
    id: 2,
    name: '青椒肉丝',
    category: '家常菜',
    categoryTag: '快手菜',
    description: '下饭神菜！肉丝嫩滑，青椒爽脆，米饭杀手。',
    difficulty: '简单',
    time: 15,
    calories: 220,
    ingredients: ['猪肉', '青椒', '生抽', '料酒', '淀粉', '蒜', '盐'],
    steps: [
      { title: '腌制肉丝', desc: '猪肉切丝，加生抽、料酒、淀粉腌制15分钟', time: 15 },
      { title: '准备配菜', desc: '青椒去籽切丝，蒜切片', time: 2 },
      { title: '滑炒肉丝', desc: '热锅凉油，下肉丝滑炒至变色盛出', time: 2 },
      { title: '炒青椒', desc: '锅中留底油，下蒜片爆香，放入青椒丝翻炒', time: 2 },
      { title: '合炒调味', desc: '倒回肉丝，加生抽、盐调味，翻炒均匀出锅', time: 1 }
    ],
    tips: '肉丝顺着纹理切更嫩，腌制时加淀粉锁住水分',
    videoId: 'v002',
    cuisine: 'home',
    spiceLevel: 'salty'
  },

  // ========== 3. 红烧肉 ==========
  {
    id: 3,
    name: '红烧肉',
    category: '家常菜',
    categoryTag: '经典菜',
    description: '肥而不腻，入口即化的经典红烧肉，家的味道。',
    difficulty: '中等',
    time: 60,
    calories: 450,
    ingredients: ['五花肉', '冰糖', '生抽', '老抽', '料酒', '八角', '桂皮', '姜片'],
    steps: [
      { title: '处理五花肉', desc: '五花肉切3cm方块，冷水下锅焯水去腥，捞出洗净', time: 10 },
      { title: '炒糖色', desc: '锅中放少许油，加入冰糖小火慢炒至枣红色', time: 5 },
      { title: '煸炒上色', desc: '放入五花肉翻炒上色，加料酒去腥', time: 3 },
      { title: '炖煮入味', desc: '加入开水没过肉块，放生抽、老抽、八角、桂皮、姜片，大火烧开转小火炖40分钟', time: 40 },
      { title: '收汁装盘', desc: '大火收汁至浓稠，汤汁包裹肉块即可', time: 5 }
    ],
    tips: '炖煮时一定要加热水，冷水会让肉质发紧；冰糖比白糖上色更好看',
    videoId: 'v003',
    cuisine: 'home',
    spiceLevel: 'sweet'
  },

  // ========== 4. 蒜蓉西兰花 ==========
  {
    id: 4,
    name: '蒜蓉西兰花',
    category: '家常菜',
    categoryTag: '健康菜',
    description: '清淡爽口，营养满分，减脂期也能放心吃。',
    difficulty: '简单',
    time: 8,
    calories: 85,
    ingredients: ['西兰花', '蒜', '盐', '蚝油', '食用油'],
    steps: [
      { title: '处理西兰花', desc: '西兰花掰成小朵，清水浸泡10分钟后洗净', time: 10 },
      { title: '焯水', desc: '烧开水加少许盐和油，放入西兰花焯水1分钟捞出', time: 2 },
      { title: '炒蒜末', desc: '锅中放油，小火煸香蒜末', time: 1 },
      { title: '翻炒调味', desc: '放入西兰花，加蚝油和少许盐翻炒均匀即可', time: 1 }
    ],
    tips: '焯水时间不要太长，保持脆嫩口感',
    videoId: 'v004',
    cuisine: 'home',
    spiceLevel: 'mild'
  },

  // ========== 5. 蛋炒饭 ==========
  {
    id: 5,
    name: '蛋炒饭',
    category: '主食',
    categoryTag: '快手菜',
    description: '粒粒分明，蛋香四溢，最简单的美味。',
    difficulty: '简单',
    time: 10,
    calories: 350,
    ingredients: ['隔夜米饭', '鸡蛋', '葱花', '盐', '食用油'],
    steps: [
      { title: '准备米饭', desc: '隔夜米饭提前用手拨散（或用勺子打散）', time: 1 },
      { title: '炒鸡蛋', desc: '热锅倒油，打入鸡蛋快速炒散', time: 1 },
      { title: '炒米饭', desc: '倒入米饭，大火翻炒，让每粒米都裹上蛋液', time: 5 },
      { title: '调味出锅', desc: '加盐调味，撒葱花翻炒均匀出锅', time: 1 }
    ],
    tips: '一定要用隔夜饭，水分少更容易炒散',
    videoId: 'v005',
    cuisine: 'home',
    spiceLevel: 'salty'
  },

  // ========== 6. 酸辣土豆丝 ==========
  {
    id: 6,
    name: '酸辣土豆丝',
    category: '家常菜',
    categoryTag: '快手菜',
    description: '酸辣爽脆，开胃下饭，十分钟搞定一道菜。',
    difficulty: '简单',
    time: 12,
    calories: 120,
    ingredients: ['土豆', '干辣椒', '花椒', '醋', '盐', '蒜', '葱'],
    steps: [
      { title: '切丝泡水', desc: '土豆去皮切细丝，泡入清水中去淀粉，沥干备用', time: 5 },
      { title: '爆香辅料', desc: '热锅倒油，放入花椒、干辣椒、蒜片爆香', time: 1 },
      { title: '翻炒土豆丝', desc: '放入土豆丝大火快炒，加醋翻炒', time: 3 },
      { title: '调味出锅', desc: '加盐调味，撒葱花出锅', time: 1 }
    ],
    tips: '土豆丝切好后一定要泡水去淀粉，这样炒出来才脆',
    videoId: 'v006',
    cuisine: 'home',
    spiceLevel: 'light_spicy'
  },

  // ========== 7. 清蒸鲈鱼 ==========
  {
    id: 7,
    name: '清蒸鲈鱼',
    category: '海鲜',
    categoryTag: '健康菜',
    description: '鲜嫩无比，原汁原味，宴客必备硬菜。',
    difficulty: '中等',
    time: 25,
    calories: 150,
    ingredients: ['鲈鱼', '葱丝', '姜丝', '蒸鱼豉油', '料酒', '红椒丝'],
    steps: [
      { title: '处理鲈鱼', desc: '鲈鱼去鳞去内脏洗净，鱼身两面划三刀，抹料酒腌制10分钟', time: 10 },
      { title: '摆盘上锅', desc: '鱼身放姜丝，水开后上锅大火蒸8分钟', time: 8 },
      { title: '去腥提味', desc: '倒掉蒸鱼水，铺上葱丝、姜丝、红椒丝，淋上蒸鱼豉油', time: 2 },
      { title: '浇热油', desc: '锅中烧热油，浇在鱼身的葱姜丝上，滋啦一声即可', time: 1 }
    ],
    tips: '蒸鱼时间不要太长，8-10分钟刚好；一定要水开后再放鱼',
    videoId: 'v007',
    cuisine: 'cantonese',
    spiceLevel: 'mild'
  },

  // ========== 8. 宫保鸡丁 ==========
  {
    id: 8,
    name: '宫保鸡丁',
    category: '川菜',
    categoryTag: '经典菜',
    description: '麻辣鲜香，鸡丁滑嫩，花生酥脆，经典川菜代表作。',
    difficulty: '中等',
    time: 20,
    calories: 280,
    ingredients: ['鸡胸肉', '花生米', '干辣椒', '花椒', '黄瓜', '胡萝卜', '生抽', '醋', '糖', '淀粉'],
    steps: [
      { title: '腌制鸡丁', desc: '鸡胸肉切丁，加生抽、料酒、淀粉腌制15分钟', time: 15 },
      { title: '炸花生米', desc: '冷油下花生米，小火慢炸至金黄酥脆捞出', time: 5 },
      { title: '炒鸡丁', desc: '热锅宽油，放入鸡丁滑炒至变色盛出', time: 3 },
      { title: '爆香辅料', desc: '锅中留底油，爆香干辣椒、花椒', time: 1 },
      { title: '合炒收汁', desc: '倒回鸡丁，加黄瓜丁、胡萝卜丁，淋入调好的酱汁（生抽+醋+糖+水+淀粉），快速翻炒，最后撒花生米', time: 3 }
    ],
    tips: '花生米最后放，保持酥脆；酱汁要提前调好',
    videoId: 'v008',
    cuisine: 'sichuan',
    spiceLevel: 'medium_spicy'
  },

  // ========== 9. 紫菜蛋花汤 ==========
  {
    id: 9,
    name: '紫菜蛋花汤',
    category: '汤煲',
    categoryTag: '快手菜',
    description: '简单快手的家常汤品，鲜香可口，几分钟搞定。',
    difficulty: '简单',
    time: 8,
    calories: 60,
    ingredients: ['紫菜', '鸡蛋', '盐', '香油', '葱花', '虾皮'],
    steps: [
      { title: '泡紫菜', desc: '紫菜撕成小块，用温水泡软', time: 2 },
      { title: '烧水', desc: '锅中烧开水，加入虾皮煮1分钟', time: 2 },
      { title: '淋入蛋液', desc: '鸡蛋打散，沿锅边慢慢淋入蛋液，形成蛋花', time: 2 },
      { title: '调味出锅', desc: '放入紫菜，加盐调味，淋香油，撒葱花', time: 1 }
    ],
    tips: '蛋液要慢慢淋，不要搅动，这样蛋花才漂亮',
    videoId: null,
    cuisine: 'home',
    spiceLevel: 'mild'
  },

  // ========== 10. 糖醋排骨 ==========
  {
    id: 10,
    name: '糖醋排骨',
    category: '家常菜',
    categoryTag: '经典菜',
    description: '外酥里嫩，酸甜适口，大人小孩都爱吃。',
    difficulty: '中等',
    time: 40,
    calories: 380,
    ingredients: ['排骨', '冰糖', '生抽', '老抽', '醋', '料酒', '姜片', '白芝麻'],
    steps: [
      { title: '焯水排骨', desc: '排骨冷水下锅，加姜片料酒焯水，捞出洗净', time: 10 },
      { title: '炒糖色', desc: '锅中放油，加冰糖小火炒至枣红色', time: 3 },
      { title: '煸炒排骨', desc: '放入排骨翻炒上色', time: 3 },
      { title: '炖煮', desc: '加热水没过排骨，加生抽、老抽、料酒，大火烧开转小火炖25分钟', time: 25 },
      { title: '收汁装盘', desc: '加醋，大火收汁至浓稠，撒白芝麻装盘', time: 3 }
    ],
    tips: '醋要最后加，太早会挥发；收汁时注意翻动防止粘锅',
    videoId: 'v009',
    cuisine: 'home',
    spiceLevel: 'sweet'
  },

  // ========== 11. 麻婆豆腐 ==========
  {
    id: 11,
    name: '麻婆豆腐',
    category: '川菜',
    categoryTag: '经典菜',
    description: '麻辣鲜香，豆腐嫩滑入味，下饭神器，川菜灵魂之作。',
    difficulty: '中等',
    time: 20,
    calories: 200,
    ingredients: ['豆腐', '猪肉', '豆瓣酱', '花椒粉', '干辣椒', '蒜', '葱', '淀粉', '生抽'],
    steps: [
      { title: '处理豆腐', desc: '豆腐切成2cm小方块，放入加了盐的开水中焯水2分钟捞出沥水', time: 5 },
      { title: '准备配料', desc: '猪肉剁成肉末，蒜切末，葱切葱花，干辣椒切段', time: 3 },
      { title: '炒肉末', desc: '热锅放油，下肉末炒散至变色', time: 2 },
      { title: '炒香酱料', desc: '加入豆瓣酱小火炒出红油，放入蒜末、干辣椒爆香', time: 2 },
      { title: '炖煮豆腐', desc: '加入适量热水，放入豆腐块，加生抽调味，中小火煮5分钟让豆腐入味', time: 5 },
      { title: '勾芡出锅', desc: '淋入水淀粉勾芡，撒花椒粉和葱花翻匀出锅', time: 1 }
    ],
    tips: '豆腐焯水能去除豆腥味且不易碎；豆瓣酱要小火炒才不会糊',
    videoId: 'v011',
    cuisine: 'sichuan',
    spiceLevel: 'heavy_spicy'
  },

  // ========== 12. 水煮牛肉 ==========
  {
    id: 12,
    name: '水煮牛肉',
    category: '川菜',
    categoryTag: '经典菜',
    description: '肉片滑嫩，麻辣烫鲜，满盆红油让人欲罢不能。',
    difficulty: '较难',
    time: 35,
    calories: 380,
    ingredients: ['牛肉', '白菜', '干辣椒', '花椒', '豆瓣酱', '蒜', '姜片', '料酒'],
    steps: [
      { title: '腌制牛肉', desc: '牛肉逆纹切薄片，加料酒、生抽、淀粉、食用油抓匀腌制20分钟', time: 20 },
      { title: '炒底料', desc: '锅中放油，爆香姜片、蒜，加豆瓣酱炒出红油', time: 3 },
      { title: '煮蔬菜垫底', desc: '加入足量热水烧开，先放白菜梗煮2分钟，再放入菜叶烫软，捞出铺在大碗底部', time: 4 },
      { title: '煮牛肉片', desc: '汤中保持微沸，将牛肉片逐片下入锅中，滑散至变色捞出铺在白菜上', time: 3 },
      { title: '浇热油激香', desc: '在牛肉上撒满干辣椒段、花椒、蒜末，将烧至冒烟的热油浇上去，滋啦作响即可', time: 2 }
    ],
    tips: '牛肉一定要逆纹切；煮牛肉时汤不能大滚，微沸即可，肉质更嫩',
    videoId: 'v012',
    cuisine: 'sichuan',
    spiceLevel: 'heavy_spicy'
  },

  // ========== 13. 白切鸡 ==========
  {
    id: 13,
    name: '白切鸡',
    category: '粤菜',
    categoryTag: '经典菜',
    description: '皮爽肉滑，原汁原味，蘸姜葱酱食用，粤菜经典代表。',
    difficulty: '中等',
    time: 45,
    calories: 260,
    ingredients: ['鸡腿', '姜', '葱', '料酒', '香油'],
    steps: [
      { title: '准备鸡腿', desc: '整鸡腿洗净，冷水浸泡30分钟去血水', time: 30 },
      { title: '煮姜葱水', desc: '锅中放入大量清水，加入姜片、葱结、料酒，大火烧开', time: 5 },
      { title: '三提三放', desc: '提起鸡腿放入沸水中烫3秒提起，重复三次，使鸡皮定型收紧', time: 2 },
      { title: '浸泡煮熟', desc: '将鸡腿放入水中，保持水面微沸（不翻滚），加盖浸泡25分钟', time: 25 },
      { title: '冰水激冷', desc: '捞出鸡腿立即放入冰水中浸泡10分钟，使皮爽肉紧', time: 10 },
      { title: '斩块装盘', desc: '鸡腿沥干斩块装盘，配姜葱蘸料上桌', time: 3 }
    ],
    tips: '关键在水不能大滚，用浸泡的方式鸡肉才嫩；冰水浸泡是皮爽肉滑的秘诀',
    videoId: 'v013',
    cuisine: 'cantonese',
    spiceLevel: 'mild'
  },

  // ========== 14. 蒜蓉粉丝蒸虾 ==========
  {
    id: 14,
    name: '蒜蓉粉丝蒸虾',
    category: '海鲜',
    categoryTag: '健康菜',
    description: '蒜香浓郁，虾肉鲜甜Q弹，粉丝吸满汤汁，好吃到舔盘。',
    difficulty: '中等',
    time: 25,
    calories: 180,
    ingredients: ['虾', '粉丝', '蒜', '生抽', '糖', '葱'],
    steps: [
      { title: '泡粉丝', desc: '粉丝用温水泡软，剪成短段铺在蒸盘底部', time: 10 },
      { title: '处理虾', desc: '虾去虾线，剪去虾须，从背部剖开但不切断，虾尾留好摆造型', time: 5 },
      { title: '炒蒜蓉', desc: '大量蒜切末，取一半蒜蓉小火炒至微黄出香味，关火后与生蒜蓉混合，加生抽和少许糖拌匀', time: 3 },
      { title: '摆盘铺蒜', desc: '将虾摆放在粉丝上，虾背朝上，均匀铺上蒜蓉酱', time: 2 },
      { title: '上锅蒸制', desc: '水开后放入蒸锅，大火蒸6-8分钟至虾变红', time: 8 },
      { title: '点缀出锅', desc: '出锅后撒上葱花，淋少许热油激香即可', time: 1 }
    ],
    tips: '生蒜和炒蒜混合才有层次感；蒸的时间不要太长，虾老了不好吃',
    videoId: 'v014',
    cuisine: 'cantonese',
    spiceLevel: 'mild'
  },

  // ========== 15. 剁椒鱼头 ==========
  {
    id: 15,
    name: '剁椒鱼头',
    category: '湘菜',
    categoryTag: '经典菜',
    description: '鲜辣入味，鱼头嫩滑，剁椒酸辣可口，湘菜灵魂代表。',
    difficulty: '较难',
    time: 30,
    calories: 320,
    ingredients: ['鲈鱼', '剁椒', '蒜', '姜', '豆豉', '葱', '料酒'],
    steps: [
      { title: '处理鱼头', desc: '鱼头从下巴处劈开成两半（不切断），去除鱼鳃和黑膜，洗净血水，用料酒和姜片腌制15分钟', time: 15 },
      { title: '准备配料', desc: '蒜切末，姜切片，豆豉略捣碎，葱切葱花', time: 3 },
      { title: '铺底摆盘', desc: '盘底铺上姜片，将鱼头切面朝上摆在盘中', time: 1 },
      { title: '铺剁椒', desc: '将剁椒、蒜末、豆豉混合均匀，铺在鱼头表面，淋入少许料酒和生抽', time: 2 },
      { title: '上锅蒸制', desc: '水开后上锅，大火蒸12-15分钟至鱼眼凸出', time: 15 },
      { title: '点缀出锅', desc: '出锅后撒上葱花，浇一勺热油激出香味即可', time: 1 }
    ],
    tips: '鱼头一定要去净血水才不会有腥味；蒸的时间不宜过长',
    videoId: 'v015',
    cuisine: 'hunan',
    spiceLevel: 'medium_spicy'
  },

  // ========== 16. 小炒黄牛肉 ==========
  {
    id: 16,
    name: '小炒黄牛肉',
    category: '湘菜',
    categoryTag: '经典菜',
    description: '牛肉嫩滑，辣椒香辣，镬气十足，一口一口停不下来。',
    difficulty: '中等',
    time: 20,
    calories: 300,
    ingredients: ['牛肉', '青椒', '红椒', '蒜', '生抽', '淀粉', '香菜'],
    steps: [
      { title: '腌制牛肉', desc: '黄牛肉切薄片，加生抽、淀粉、少许食用油抓匀腌制15分钟', time: 15 },
      { title: '准备配菜', desc: '青椒和红椒切圈或切块，蒜切片，香菜切段', time: 3 },
      { title: '爆炒牛肉', desc: '锅烧热至冒烟，倒入油，下入牛肉大火快炒至变色，立即盛出', time: 2 },
      { title: '炒辣椒', desc: '锅中留底油，放入蒜片爆香，下青椒红椒翻炒至断生', time: 2 },
      { title: '合炒调味', desc: '倒回牛肉，加生抽、少许蚝油快速翻炒，最后放香菜翻匀出锅', time: 1 }
    ],
    tips: '牛肉要大火快炒，时间长了会老；锅一定要够热才有镬气',
    videoId: 'v016',
    cuisine: 'hunan',
    spiceLevel: 'medium_spicy'
  },

  // ========== 17. 地三鲜 ==========
  {
    id: 17,
    name: '地三鲜',
    category: '东北菜',
    categoryTag: '经典菜',
    description: '土豆软糯、茄子入味、青椒清甜，东北家常菜的完美代表。',
    difficulty: '中等',
    time: 25,
    calories: 280,
    ingredients: ['土豆', '茄子', '青椒', '蒜', '生抽', '淀粉'],
    steps: [
      { title: '切块备料', desc: '土豆去皮切滚刀块，茄子切滚刀块，青椒掰成小块，蒜切片', time: 3 },
      { title: '炸土豆', desc: '油温六成热，放入土豆块炸至表面金黄捞出', time: 4 },
      { title: '炸茄子', desc: '油温升高至七成，放入茄子炸至软缩表面微焦捞出', time: 3 },
      { title: '调酱汁', desc: '碗中调入生抽、蚝油、少许糖、淀粉和适量清水搅匀', time: 1 },
      { title: '合炒收汁', desc: '锅中留少许油，爆香蒜片，放入三种食材翻炒，倒入酱汁大火快速翻炒至浓稠裹匀', time: 3 }
    ],
    tips: '茄子先用盐腌一下能减少吸油；土豆先炸后炒更软糯',
    videoId: 'v017',
    cuisine: 'northeast',
    spiceLevel: 'salty'
  },

  // ========== 18. 锅包肉 ==========
  {
    id: 18,
    name: '锅包肉',
    category: '东北菜',
    categoryTag: '经典菜',
    description: '外酥里嫩，酸甜开胃，咬一口嘎嘣脆，东北人的骄傲。',
    difficulty: '较难',
    time: 30,
    calories: 400,
    ingredients: ['猪里脊', '淀粉', '糖', '醋', '番茄酱', '姜', '葱'],
    steps: [
      { title: '切肉腌制', desc: '猪里脊切成0.5cm厚的大片，加少许盐和料酒腌制10分钟', time: 10 },
      { title: '调脆皮糊', desc: '淀粉加水搅成浓稠面糊，加少许食用油拌匀，将肉片裹满面糊', time: 3 },
      { title: '炸第一遍', desc: '油温六成热，逐片放入肉片炸至定型微黄捞出', time: 4 },
      { title: '炸第二遍', desc: '油温升至八成热，放入肉片复炸至金黄酥脆捞出', time: 2 },
      { title: '调糖醋汁', desc: '锅中留少许油，放入番茄酱、糖、醋、少许水烧开至冒泡', time: 2 },
      { title: '裹汁装盘', desc: '放入炸好的肉片快速翻炒裹匀酱汁，撒姜丝葱丝立即出锅', time: 1 }
    ],
    tips: '复炸是酥脆的关键；裹酱汁要快，时间长了肉就不脆了',
    videoId: 'v018',
    cuisine: 'northeast',
    spiceLevel: 'sweet'
  },

  // ========== 19. 鱼香肉丝 ==========
  {
    id: 19,
    name: '鱼香肉丝',
    category: '川菜',
    categoryTag: '经典菜',
    description: '酸甜咸辣鲜五味俱全，没有鱼却有鱼香，川菜万能调味典范。',
    difficulty: '中等',
    time: 20,
    calories: 260,
    ingredients: ['猪肉', '木耳', '胡萝卜', '青椒', '蒜', '姜', '葱', '豆瓣酱', '糖', '醋', '淀粉'],
    steps: [
      { title: '腌制肉丝', desc: '猪肉切丝，加生抽、料酒、淀粉腌制15分钟', time: 15 },
      { title: '准备配菜', desc: '木耳泡发切丝，胡萝卜切丝，青椒切丝，蒜姜切末，葱切段', time: 5 },
      { title: '调鱼香汁', desc: '碗中加入生抽、醋、糖、料酒、淀粉和少许水调匀备用', time: 1 },
      { title: '滑炒肉丝', desc: '热锅宽油，放入肉丝滑炒至变色盛出', time: 2 },
      { title: '炒香配料', desc: '锅中留底油，爆香姜蒜末和豆瓣酱，放入胡萝卜丝翻炒至软', time: 2 },
      { title: '合炒收汁', desc: '放入木耳丝、青椒丝翻炒，倒回肉丝，淋入鱼香汁快速翻匀至浓稠出锅', time: 2 }
    ],
    tips: '鱼香汁的比例是灵魂：糖和醋的比例约1:1；配菜可按喜好调整',
    videoId: 'v019',
    cuisine: 'sichuan',
    spiceLevel: 'medium_spicy'
  },

  // ========== 20. 回锅肉 ==========
  {
    id: 20,
    name: '回锅肉',
    category: '川菜',
    categoryTag: '经典菜',
    description: '肉片微卷带焦边，蒜苗鲜香，豆瓣醇厚，被誉为川菜之首。',
    difficulty: '中等',
    time: 25,
    calories: 350,
    ingredients: ['五花肉', '青椒', '蒜苗', '豆瓣酱', '豆豉', '姜', '葱'],
    steps: [
      { title: '煮五花肉', desc: '五花肉整块冷水下锅，加姜片、葱结、料酒，大火烧开后煮20分钟至筷子能插透', time: 20 },
      { title: '切片备料', desc: '煮好的五花肉捞出放凉，切成薄片；蒜苗斜切段，青椒切片', time: 3 },
      { title: '煸肉片', desc: '锅中不放油或放少许油，下入五花肉片中小火煸炒至出油、边缘微卷起灯盏窝', time: 4 },
      { title: '炒酱出香', desc: '将肉推到锅边，放入豆瓣酱和豆豉小火炒出红油', time: 2 },
      { title: '合炒出锅', desc: '放入青椒和蒜苗翻炒至断生，加少许生抽调味，翻匀出锅', time: 2 }
    ],
    tips: '五花肉煮熟后放冰箱冷藏一会儿更容易切薄片；一定要煸出油才香',
    videoId: 'v020',
    cuisine: 'sichuan',
    spiceLevel: 'light_spicy'
  },

  // ========== 21. 东坡肉 ==========
  {
    id: 21,
    name: '东坡肉',
    category: '苏菜',
    categoryTag: '经典菜',
    description: '色泽红亮，肥而不腻，入口即化，千年传承的杭帮菜经典。',
    difficulty: '较难',
    time: 90,
    calories: 520,
    ingredients: ['五花肉', '冰糖', '老抽', '料酒', '姜', '葱'],
    steps: [
      { title: '焯水定型', desc: '五花肉整块冷水下锅焯水5分钟捞出，切成5cm见方的大块', time: 8 },
      { title: '煎至微焦', desc: '砂锅底部铺竹垫（或葱姜），放入五花肉块，煎至表面微焦', time: 5 },
      { title: '铺料调色', desc: '铺上姜片和葱结，加入冰糖、老抽、料酒，再加开水没过肉面', time: 3 },
      { title: '慢炖入味', desc: '大火烧开后转小火，加盖慢炖约60分钟，中途翻面一次', time: 60 },
      { title: '收汁装盘', desc: '开盖转大火收汁至汤汁浓稠包裹肉块，小心取出装盘，浇上汤汁', time: 5 }
    ],
    tips: '全程不要加盐，老抽和料酒的咸度足够；小火慢炖是入口即化的关键',
    videoId: 'v021',
    cuisine: 'jiangsu',
    spiceLevel: 'mild'
  },

  // ========== 22. 可乐鸡翅 ==========
  {
    id: 22,
    name: '可乐鸡翅',
    category: '家常菜',
    categoryTag: '快手菜',
    description: '甜香浓郁，鸡翅嫩滑多汁，零失败的新手友好菜。',
    difficulty: '简单',
    time: 30,
    calories: 320,
    ingredients: ['鸡翅', '可乐', '生抽', '老抽', '姜', '料酒'],
    steps: [
      { title: '处理鸡翅', desc: '鸡翅洗净，在两面各划两刀方便入味', time: 2 },
      { title: '焯水去腥', desc: '鸡翅冷水下锅，加姜片和料酒焯水3分钟捞出沥干', time: 5 },
      { title: '煎鸡翅', desc: '锅中放少许油，放入鸡翅煎至两面金黄微焦', time: 5 },
      { title: '加可乐炖煮', desc: '倒入可乐没过鸡翅，加生抽和少许老抽上色，大火烧开', time: 3 },
      { title: '收汁装盘', desc: '转小火炖15分钟，然后转大火收汁至浓稠挂在鸡翅上', time: 15 }
    ],
    tips: '一定要用普通可乐，无糖可乐收不出浓汁；划刀有利于入味',
    videoId: 'v022',
    cuisine: 'home',
    spiceLevel: 'sweet'
  },

  // ========== 23. 西红柿牛腩 ==========
  {
    id: 23,
    name: '西红柿牛腩',
    category: '家常菜',
    categoryTag: '经典菜',
    description: '汤汁浓郁酸甜，牛肉软烂入味，配米饭或面条都绝了。',
    difficulty: '中等',
    time: 70,
    calories: 380,
    ingredients: ['牛腩', '番茄', '土豆', '姜', '葱', '八角', '料酒', '盐'],
    steps: [
      { title: '焯水牛腩', desc: '牛腩切大块，冷水下锅加姜片、料酒焯水5分钟，捞出洗净浮沫', time: 10 },
      { title: '炒番茄', desc: '番茄顶部划十字，开水烫去皮切块；锅中放油炒番茄至出汁软烂', time: 5 },
      { title: '炖牛腩', desc: '加入焯好的牛腩翻炒，倒入开水没过食材，加八角、葱结，大火烧开转小火炖50分钟', time: 50 },
      { title: '加土豆收汁', desc: '加入土豆块继续炖15分钟至软烂，加盐调味，大火收汁至浓稠', time: 15 }
    ],
    tips: '牛腩要选带筋膜的部位，炖出来更软烂；番茄多放几个汤汁更浓',
    videoId: 'v023',
    cuisine: 'home',
    spiceLevel: 'mild'
  },

  // ========== 24. 干锅花菜 ==========
  {
    id: 24,
    name: '干锅花菜',
    category: '湘菜',
    categoryTag: '经典菜',
    description: '花菜焦香微辣，配肉片越吃越香，干锅菜的头牌。',
    difficulty: '中等',
    time: 20,
    calories: 220,
    ingredients: ['西兰花', '猪肉', '干辣椒', '蒜', '生抽', '豆瓣酱', '葱'],
    steps: [
      { title: '处理花菜', desc: '花菜掰成小朵洗净沥干，猪肉切薄片', time: 3 },
      { title: '煸炒花菜', desc: '锅中放少许油，放入花菜中火煸炒至边缘微焦盛出', time: 5 },
      { title: '炒肉片', desc: '锅中加油，放入猪肉片炒出油脂至微微焦黄', time: 3 },
      { title: '炒香酱料', desc: '加入豆瓣酱炒出红油，放入干辣椒段和蒜片爆香', time: 2 },
      { title: '合炒调味', desc: '倒回花菜，加生抽翻炒均匀，最后撒葱段出锅', time: 2 }
    ],
    tips: '花菜一定要煸炒至微焦才有干锅的香味；花菜不要焯水，直接炒口感更好',
    videoId: 'v024',
    cuisine: 'hunan',
    spiceLevel: 'medium_spicy'
  },

  // ========== 25. 蛋黄焗南瓜 ==========
  {
    id: 25,
    name: '蛋黄焗南瓜',
    category: '家常菜',
    categoryTag: '创意菜',
    description: '金黄诱人，外酥里糯，咸蛋黄的浓郁裹着南瓜的清甜。',
    difficulty: '中等',
    time: 25,
    calories: 250,
    ingredients: ['南瓜', '咸鸭蛋', '葱'],
    steps: [
      { title: '处理南瓜', desc: '南瓜去皮去籽切成长条，表面薄薄拍一层淀粉', time: 3 },
      { title: '炸南瓜', desc: '油温六成热，放入南瓜条炸至表面微硬金黄捞出', time: 4 },
      { title: '蒸咸蛋黄', desc: '咸鸭蛋取蛋黄（约3-4个），上锅蒸5分钟后用勺子压碎', time: 5 },
      { title: '炒蛋黄', desc: '锅中放少许油，小火放入蛋黄碎翻炒至起泡冒细密泡沫', time: 2 },
      { title: '裹匀出锅', desc: '放入炸好的南瓜条快速翻裹，让每根南瓜都沾满蛋黄，撒葱花出锅', time: 1 }
    ],
    tips: '蛋黄一定要小火慢慢炒才会起沙；南瓜不要炸太硬，微硬即可',
    videoId: 'v025',
    cuisine: 'home',
    spiceLevel: 'sweet'
  },

  // ========== 26. 蒜泥白肉 ==========
  {
    id: 26,
    name: '蒜泥白肉',
    category: '川菜',
    categoryTag: '经典菜',
    description: '肉片薄如纸，肥瘦相间，蒜香浓郁微辣回甜，下酒下饭。',
    difficulty: '中等',
    time: 25,
    calories: 310,
    ingredients: ['五花肉', '蒜', '辣椒油', '生抽', '醋', '糖', '葱'],
    steps: [
      { title: '煮五花肉', desc: '五花肉整块冷水下锅，加姜片、料酒，大火烧开后转中小火煮20分钟至熟透', time: 20 },
      { title: '冰水浸泡', desc: '捞出五花肉放入冰水中浸泡5分钟，使肉质紧实便于切薄片', time: 5 },
      { title: '切薄片', desc: '将五花肉切成约2mm的薄片，尽量薄且不断，整齐码在盘中', time: 3 },
      { title: '调蒜泥酱', desc: '大蒜捣成泥，加入生抽、醋、糖、辣椒油、少许凉白开调匀', time: 2 },
      { title: '浇酱上桌', desc: '将蒜泥酱汁均匀浇在肉片上，撒上葱花即可', time: 1 }
    ],
    tips: '肉煮好后冰水激一下更容易切薄；蒜泥要现捣现用才香',
    videoId: 'v026',
    cuisine: 'sichuan',
    spiceLevel: 'light_spicy'
  },

  // ========== 27. 蚝油生菜 ==========
  {
    id: 27,
    name: '蚝油生菜',
    category: '粤菜',
    categoryTag: '快手菜',
    description: '翠绿爽脆，蚝油鲜香，简单到不能再简单的粤式青菜。',
    difficulty: '简单',
    time: 8,
    calories: 65,
    ingredients: ['生菜', '蚝油', '蒜', '糖'],
    steps: [
      { title: '调蚝油汁', desc: '碗中放入蚝油、少许糖、少许生抽和清水搅匀', time: 1 },
      { title: '焯水生菜', desc: '烧开大量水，加少许盐和几滴油，放入整棵生菜烫10秒立即捞出沥干摆盘', time: 1 },
      { title: '炒蒜末', desc: '锅中放少许油，小火爆香蒜末', time: 1 },
      { title: '浇汁出锅', desc: '倒入蚝油汁煮至微微冒泡，浇在生菜上即可', time: 1 }
    ],
    tips: '生菜焯水时间极短，几秒就好，保持翠绿爽脆；焯水时加盐加油能保持色泽',
    videoId: 'v027',
    cuisine: 'cantonese',
    spiceLevel: 'mild'
  },

  // ========== 28. 红烧茄子 ==========
  {
    id: 28,
    name: '红烧茄子',
    category: '家常菜',
    categoryTag: '快手菜',
    description: '茄子软糯入味，酱香浓郁，比肉还好吃的下饭菜。',
    difficulty: '简单',
    time: 20,
    calories: 200,
    ingredients: ['茄子', '蒜', '生抽', '蚝油', '糖', '淀粉'],
    steps: [
      { title: '切茄子', desc: '茄子洗净切成滚刀块，撒少许盐腌制10分钟挤去水分', time: 10 },
      { title: '调酱汁', desc: '碗中调入生抽、蚝油、糖、淀粉和少许水搅匀', time: 1 },
      { title: '煎茄子', desc: '锅中放稍多的油，放入茄子中火煎至两面微焦软塌盛出', time: 5 },
      { title: '合炒收汁', desc: '锅中留少许油，爆香蒜末，放入茄子翻炒，倒入酱汁翻匀至浓稠', time: 3 }
    ],
    tips: '茄子先用盐腌能减少吸油量；也可以用少油煎代替炸，更健康',
    videoId: 'v028',
    cuisine: 'home',
    spiceLevel: 'mild'
  },

  // ========== 29. 酸汤肥牛 ==========
  {
    id: 29,
    name: '酸汤肥牛',
    category: '湘菜',
    categoryTag: '经典菜',
    description: '酸辣开胃，肥牛嫩滑，汤底浓郁，一碗下肚超满足。',
    difficulty: '中等',
    time: 20,
    calories: 280,
    ingredients: ['肥牛', '蘑菇', '泡椒', '醋', '姜', '蒜', '葱'],
    steps: [
      { title: '准备食材', desc: '肥牛片提前解冻，蘑菇撕成小朵，泡椒切段，姜蒜切片', time: 3 },
      { title: '炒底料', desc: '锅中放油，爆香姜蒜片和泡椒段，炒出香味', time: 2 },
      { title: '煮汤底', desc: '加入足量清水烧开，放入蘑菇煮3分钟，加醋、少许盐和糖调味', time: 5 },
      { title: '烫肥牛', desc: '将肥牛片逐片放入微沸的汤中，滑散至变色立即捞出铺在碗中', time: 2 },
      { title: '浇汤上桌', desc: '将汤底倒入碗中，撒葱花和少许干辣椒装饰即可', time: 1 }
    ],
    tips: '肥牛烫变色就要捞出，煮久了会老；汤底可以根据喜好加金针菇、粉丝等',
    videoId: 'v029',
    cuisine: 'hunan',
    spiceLevel: 'medium_spicy'
  },

  // ========== 30. 溏心蛋沙拉 ==========
  {
    id: 30,
    name: '溏心蛋沙拉',
    category: '西餐',
    categoryTag: '健康菜',
    description: '嫩滑溏心蛋搭配新鲜蔬菜，淋上沙拉酱，简单健康的西式轻食。',
    difficulty: '简单',
    time: 15,
    calories: 220,
    ingredients: ['鸡蛋', '生菜', '番茄', '黄瓜', '沙拉酱'],
    steps: [
      { title: '煮溏心蛋', desc: '鸡蛋室温回温，冷水下锅煮沸后转中小火煮6分半钟，捞出立即放入冰水中浸泡5分钟', time: 8 },
      { title: '准备蔬菜', desc: '生菜洗净沥干撕成小块，番茄切小块，黄瓜切薄片', time: 3 },
      { title: '摆盘组合', desc: '将生菜铺在盘底，番茄和黄瓜摆在上面的', time: 1 },
      { title: '切开鸡蛋', desc: '溏心蛋去壳对半切开，摆放在沙拉上', time: 1 },
      { title: '淋酱完成', desc: '均匀淋上沙拉酱，可撒少许黑胡椒调味', time: 1 }
    ],
    tips: '煮蛋时间6-7分钟是溏心的关键；一定要冰水激一下才好剥壳',
    videoId: 'v030',
    cuisine: 'western',
    spiceLevel: 'mild'
  }
]

// ==================== 导出 ====================

function getCategories() {
  const cats = ['全部']
  const seen = new Set()
  for (const d of dishes) {
    if (!seen.has(d.category)) {
      seen.add(d.category)
      cats.push(d.category)
    }
  }
  return cats
}

function getCuisines() {
  return cuisineTypes
}

function getSpiceLevels() {
  return spiceLevels
}

module.exports = {
  dishes,
  allIngredients,
  ingredientTypes,
  cuisineTypes,
  spiceLevels,
  getCategories,
  getCuisines,
  getSpiceLevels
}
