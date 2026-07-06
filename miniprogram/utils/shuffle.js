/**
 * 摇一摇 - 随机菜品选择核心逻辑
 * 
 * 策略：从食材库中随机抽取 2-4 个食材，
 * 然后匹配包含这些食材的菜品。
 * 如果没有完全匹配，返回最接近的菜品。
 */

const { dishes, allIngredients } = require('../mock/dishes')

/**
 * 根据类型筛选食材池
 * @param {string} type - 食材类型，'all' 表示全部
 */
function getIngredientPool(type = 'all') {
  if (!type || type === 'all') return allIngredients
  return allIngredients.filter(i => i.type === type)
}

/**
 * 随机抽取 n 个不重复的食材
 * @param {number} count - 食材个数
 * @param {string} type - 食材类型筛选
 */
function pickRandomIngredients(count = 3, type = 'all') {
  const pool = getIngredientPool(type)
  const shuffled = pool.slice().sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, pool.length))
}

/**
 * 根据食材组合匹配菜品
 * 匹配规则：菜品食材与抽取食材重合度最高的菜品
 */
function matchDishByIngredients(selectedIngredients, category, spiceLevel) {
  const selectedNames = selectedIngredients.map(i => i.name)

  let candidateDishes = dishes

  if (category && category !== '全部') {
    candidateDishes = candidateDishes.filter(d => d.category === category)
  }
  if (spiceLevel && spiceLevel !== 'all') {
    candidateDishes = candidateDishes.filter(d => d.spiceLevel === spiceLevel)
  }
  if (candidateDishes.length === 0) {
    candidateDishes = dishes
    if (category && category !== '全部') {
      candidateDishes = candidateDishes.filter(d => d.category === category)
    }
  }

  let bestMatch = null
  let bestScore = -999

  for (const dish of candidateDishes) {
    let score = 0
    for (const ingredient of dish.ingredients) {
      if (selectedNames.includes(ingredient)) score++
    }
    // 惩罚需要太多额外食材的菜（更贴近用户已有食材）
    const extraCount = dish.ingredients.length - score
    const adjustedScore = score - extraCount * 0.3

    if (adjustedScore > bestScore) {
      bestScore = adjustedScore
      bestMatch = dish
    }
  }

  // 如果没有好的匹配，随机返回一个候选菜品
  if (!bestMatch || bestScore < 0.5) {
    bestMatch = candidateDishes[Math.floor(Math.random() * candidateDishes.length)] || dishes[0]
  }

  return bestMatch
}

/**
 * 执行摇一摇：返回选中的食材和 Top 3 匹配菜品
 * @param {Object} options - 配置项
 * @param {string} options.category - 可选，筛选菜系
 * @param {number} options.ingredientCount - 可选，食材个数（默认3）
 * @param {string} options.ingredientType - 可选，食材类型筛选（默认all）
 */
function performShuffle(options = {}) {
  const { category, spiceLevel = 'all', ingredientCount = 3, ingredientType = 'all' } = options

  // 按配置抽取食材
  const selectedIngredients = pickRandomIngredients(ingredientCount, ingredientType)

  // 匹配菜品（Top 3），按菜系和辣度筛选
  const matchedDishes = matchTopDishes(selectedIngredients, 3, category, spiceLevel)

  return {
    selectedIngredients,
    matchedDish: matchedDishes[0],  // 最佳匹配
    matchedDishes,                   // Top 3 全部结果
    timestamp: Date.now()
  }
}

/**
 * 返回 Top N 个匹配菜品
 * @param {Array} selectedIngredients - 选中的食材
 * @param {number} topN - 返回前 N 个
 * @param {string} category - 可选，筛选菜系
 */
function matchTopDishes(selectedIngredients, topN = 3, category = 'all', spiceLevel = 'all') {
  const selectedNames = selectedIngredients.map(i => i.name)

  let candidateDishes = dishes

  // Filter by cuisine/category
  if (category && category !== 'all' && category !== '全部') {
    candidateDishes = candidateDishes.filter(d => d.cuisine === category || d.category === category)
  }

  // Filter by spice level
  if (spiceLevel && spiceLevel !== 'all') {
    candidateDishes = candidateDishes.filter(d => d.spiceLevel === spiceLevel)
  }

  // If no candidates after filtering, fall back to no spice filter
  if (candidateDishes.length === 0) {
    candidateDishes = dishes
    if (category && category !== 'all' && category !== '全部') {
      candidateDishes = candidateDishes.filter(d => d.cuisine === category || d.category === category)
    }
  }

  const scored = candidateDishes.map(dish => {
    let score = 0
    for (const ingredient of dish.ingredients) {
      if (selectedNames.includes(ingredient)) score++
    }
    const extraCount = dish.ingredients.length - score
    const adjustedScore = score - extraCount * 0.3
    return { dish, score: adjustedScore }
  })

  // 按分数降序排列
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, topN).map(s => s.dish)
}

/**
 * 获取菜品分类列表
 */
function getCategories() {
  const cats = new Set()
  dishes.forEach(d => {
    cats.add(d.category)
    if (d.categoryTag) cats.add(d.categoryTag)
  })
  return ['全部'].concat(Array.from(cats))
}

module.exports = {
  pickRandomIngredients,
  matchDishByIngredients,
  matchTopDishes,
  performShuffle,
  getCategories
}
