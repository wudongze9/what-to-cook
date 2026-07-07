/**
 * 摇一摇 - 随机菜品选择核心逻辑
 * 
 * 策略：从食材库中随机抽取 2-4 个食材，
 * 然后匹配包含这些食材的菜品。
 * 如果没有完全匹配，返回最接近的菜品。
 */

const { dishes, allIngredients } = require('../mock/dishes')
const { normalizeDish, normalizeDishList } = require('./video-match')
const RECOMMENDATION_COUNT = 8

/**
 * 兼容字符串/对象两种 ingredient 格式，统一取 name
 *  - string: "番茄" → "番茄"
 *  - object: {name, amount} → "番茄"
 */
function ingredientName(ingredient) {
  return typeof ingredient === 'string' ? ingredient : (ingredient && ingredient.name) || ''
}

function isAll(value) {
  return !value || value === 'all' || value === '全部'
}

function ingredientType(name) {
  const found = allIngredients.find(item => item.name === name)
  return found ? found.type : ''
}

function dishIngredientNames(dish) {
  return (dish.ingredients || []).map(ingredientName).filter(Boolean)
}

function scoreDish(dish, selectedIngredients, category = 'all', spiceLevel = 'all', preferredDishId) {
  const selectedNames = selectedIngredients.map(ingredient => ingredient.name || ingredient).filter(Boolean)
  const selectedTypes = selectedNames.map(ingredientType).filter(Boolean)
  const dishNames = dishIngredientNames(dish)
  const dishTypes = dishNames.map(ingredientType).filter(Boolean)
  const exactMatches = selectedNames.filter(name => dishNames.includes(name)).length
  const typeMatches = selectedTypes.filter(type => dishTypes.includes(type)).length
  const categoryMatch = isAll(category) || dish.cuisine === category || dish.category === category
  const spiceMatch = isAll(spiceLevel) || dish.spiceLevel === spiceLevel
  const extraCount = Math.max(0, dishNames.length - exactMatches)
  const missingCount = Math.max(0, selectedNames.length - exactMatches)

  let score = exactMatches * 120
  score += typeMatches * 10
  score += categoryMatch ? 18 : 0
  score += spiceMatch ? 12 : 0
  score += preferredDishId && String(dish.id) === String(preferredDishId) ? 45 : 0
  score -= extraCount * 2
  score -= missingCount * 6

  return {
    dish,
    score,
    exactMatches,
    typeMatches,
    categoryMatch,
    spiceMatch
  }
}

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
  return normalizeDish(matchTopDishes(selectedIngredients, 1, category, spiceLevel)[0] || dishes[0])
}

/**
 * 执行摇一摇：返回选中的食材和多种匹配菜品组合
 * @param {Object} options - 配置项
 * @param {string} options.category - 可选，筛选菜系
 * @param {number} options.ingredientCount - 可选，食材个数（默认3）
 * @param {string} options.ingredientType - 可选，食材类型筛选（默认all）
 * @param {Array} options.selectedIngredients - 可选，摇杆机摇出的食材名数组（优先使用）
 */
function performShuffle(options = {}) {
  const { category, spiceLevel = 'all', ingredientCount = 3, ingredientType = 'all', selectedIngredients: passedNames, preferredDishId } = options

  let selectedIngredients

  if (passedNames && passedNames.length) {
    // 使用摇杆机摇出的食材作为匹配依据
    selectedIngredients = passedNames.map(name => {
      const found = allIngredients.find(i => i.name === name)
      return found || { name, emoji: '🍽️', type: 'other' }
    })
  } else {
    // 兜底：本地随机抽取
    selectedIngredients = pickRandomIngredients(ingredientCount, ingredientType)
  }

  // 匹配菜品：主推荐 + 多个备选组合，避免结果页只有一种选择。
  const matchedDishes = matchTopDishes(selectedIngredients, RECOMMENDATION_COUNT, category, spiceLevel, preferredDishId)

  return {
    selectedIngredients,
    matchedDish: normalizeDish(matchedDishes[0]),  // 最佳匹配
    matchedDishes: normalizeDishList(matchedDishes),                   // Top 3 全部结果
    timestamp: Date.now()
  }
}

/**
 * 返回 Top N 个匹配菜品
 * @param {Array} selectedIngredients - 选中的食材
 * @param {number} topN - 返回前 N 个
 * @param {string} category - 可选，筛选菜系
 */
function matchTopDishes(selectedIngredients, topN = 3, category = 'all', spiceLevel = 'all', preferredDishId) {
  const selectedNames = selectedIngredients.map(i => i.name || i).filter(Boolean)
  let scored = dishes.map(dish => scoreDish(dish, selectedIngredients, category, spiceLevel, preferredDishId))

  // 摇杆已经给出食材时，推荐必须优先命中这些食材。只要有命中菜，就不展示 0 命中的菜。
  if (selectedNames.length) {
    const exactScored = scored.filter(item => item.exactMatches > 0)
    if (exactScored.length) scored = exactScored
  }

  // 同分时优先：命中食材更多 > 菜系匹配 > 辣度匹配 > 食材更少更易做。
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches
    if (Number(b.categoryMatch) !== Number(a.categoryMatch)) return Number(b.categoryMatch) - Number(a.categoryMatch)
    if (Number(b.spiceMatch) !== Number(a.spiceMatch)) return Number(b.spiceMatch) - Number(a.spiceMatch)
    return dishIngredientNames(a.dish).length - dishIngredientNames(b.dish).length
  })

  return scored.slice(0, topN).map(s => normalizeDish(s.dish))
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
  getCategories,
  RECOMMENDATION_COUNT
}
