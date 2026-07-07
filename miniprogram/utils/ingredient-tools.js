const { allIngredients } = require('../mock/dishes')
const { enrichIngredient } = require('./icon-map')

function findIngredient(name) {
  return allIngredients.find(item => item.name === name) || null
}

function getIngredientSubstitutes(name, limit = 3) {
  // 兼容对象输入：{name, amount} → 取 name
  const realName = typeof name === 'string' ? name : (name && name.name) || ''
  const source = findIngredient(realName)
  if (!source) return []

  return allIngredients
    .filter(item => item.type === source.type && item.name !== realName)
    .slice(0, limit)
    .map(enrichIngredient)
}

function enrichIngredientWithSubstitutes(ingredient) {
  // 兼容字符串与对象两种输入
  const item = enrichIngredient(ingredient)
  const name = typeof ingredient === 'string' ? ingredient : (ingredient && ingredient.name) || item.name
  item.substitutes = getIngredientSubstitutes(name)
  return item
}

function groupShoppingList(list) {
  const groups = []
  const map = {}
  ;(list || []).forEach((item) => {
    const key = item.dishId || 'unknown'
    if (!map[key]) {
      map[key] = {
        dishId: key,
        dishName: item.dishName || '其他食材',
        items: []
      }
      groups.push(map[key])
    }
    map[key].items.push(Object.assign({}, item, enrichIngredient(item.name)))
  })
  return groups
}

module.exports = {
  getIngredientSubstitutes,
  enrichIngredientWithSubstitutes,
  groupShoppingList
}
