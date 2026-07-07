const { videos } = require('../mock/videos')

const DEFAULT_DISH_COVER = '/images/dish-default.svg'

function getStepDesc(step) {
  if (!step) return ''
  return step.desc || step.description || ''
}

function normalizeSteps(steps) {
  return (steps || []).map(step => Object.assign({}, step, {
    desc: getStepDesc(step),
    description: getStepDesc(step)
  }))
}

function matchVideoForDish(dish) {
  if (!dish) return null
  if (dish.videoId) return dish.videoId

  const exact = videos.find(video => {
    const names = video.dishNames || []
    return names.includes(dish.name)
  })
  if (exact) return exact.id

  const category = videos.find(video => {
    const categories = video.matchCategories || [video.category]
    return categories.includes(dish.category) || categories.includes(dish.categoryTag) || categories.includes(dish.cuisine)
  })
  if (category) return category.id

  return videos[0] ? videos[0].id : null
}

function normalizeDish(dish) {
  if (!dish) return dish
  const normalized = Object.assign({}, dish)
  normalized.steps = normalizeSteps(dish.steps)
  normalized.videoId = matchVideoForDish(dish)
  if (!normalized.cover || normalized.cover.indexOf('/images/dishes/') === 0) {
    normalized.cover = DEFAULT_DISH_COVER
  }
  return normalized
}

function normalizeDishList(list) {
  return (list || []).map(normalizeDish)
}

function normalizeShuffleResult(result) {
  if (!result) return result
  const matchedDishes = normalizeDishList(result.matchedDishes || result.matched_dishes || [])
  return Object.assign({}, result, {
    matchedDish: normalizeDish(result.matchedDish || result.matched_dish || matchedDishes[0]),
    matchedDishes,
    matched_dish: normalizeDish(result.matchedDish || result.matched_dish || matchedDishes[0]),
    matched_dishes: matchedDishes
  })
}

module.exports = {
  DEFAULT_DISH_COVER,
  getStepDesc,
  normalizeDish,
  normalizeDishList,
  normalizeShuffleResult,
  matchVideoForDish
}
