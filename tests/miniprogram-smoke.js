const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const mini = path.join(root, 'miniprogram')

const memory = new Map()
global.wx = {
  getStorageSync(key) { return memory.get(key) },
  setStorageSync(key, value) { memory.set(key, value) },
  removeStorageSync(key) { memory.delete(key) },
}

const storage = require(path.join(mini, 'utils/storage'))
const ingredients = require(path.join(mini, 'utils/ingredient-tools'))
const shuffle = require(path.join(mini, 'utils/shuffle'))
const runtime = require(path.join(mini, 'config/env'))
const { cuisineTypes, spiceLevels } = require(path.join(mini, 'mock/dishes'))

storage.startNewChatSession()
storage.saveChatMessage({ text: '第一轮', isUser: true })
assert.strictEqual(storage.getChatHistory().length, 1)
storage.startNewChatSession()
assert.strictEqual(storage.getChatHistory().length, 0)
storage.saveChatMessage({ text: '第二轮', isUser: true })
assert.strictEqual(storage.getChatHistory()[0].text, '第二轮')

let shopping = storage.upsertShoppingItem({ name: '番茄', amount: '2个' })
assert.strictEqual(shopping.length, 1)
shopping = storage.upsertShoppingItem({ ...shopping[0], amount: '3个' })
assert.strictEqual(shopping[0].amount, '3个')
shopping = storage.setAllShoppingItemsChecked(true)
assert.strictEqual(shopping[0].checked, true)
assert.strictEqual(ingredients.groupShoppingList(shopping)[0].items[0].name, '番茄')
shopping = storage.removeShoppingItem(shopping[0].id)
assert.strictEqual(shopping.length, 0)

const recommendation = shuffle.performShuffle({
  ingredientCount: 3,
  selectedIngredients: ['番茄', '鸡蛋'],
})
assert.strictEqual(recommendation.selectedIngredients.length, 2)
assert(recommendation.matchedDish && recommendation.matchedDish.name)
assert(recommendation.matchedDishes.length >= 1)

for (const cuisine of cuisineTypes) {
  const result = shuffle.performShuffle({
    ingredientCount: 3,
    category: cuisine.key,
    spiceLevel: 'all',
  })
  assert(result.matchedDish, `No local recommendation for cuisine ${cuisine.key}`)
}

for (const spice of spiceLevels) {
  const result = shuffle.performShuffle({
    ingredientCount: 3,
    category: 'all',
    spiceLevel: spice.key,
  })
  assert(result.matchedDish, `No local recommendation for spice ${spice.key}`)
}

const allergySafe = shuffle.performShuffle({
  ingredientCount: 3,
  selectedIngredients: ['花生'],
  excludedIngredients: ['花生'],
})
assert(allergySafe.matchedDish, 'Allergy-safe local fallback returned no dish')
assert(!allergySafe.matchedDish.ingredients.some(item => (item.name || item) === '花生'))

assert.strictEqual(runtime.ENV_NAME, 'development')
assert(runtime.API_BASE_URL.endsWith('/api'))
assert(runtime.REQUEST_TIMEOUT >= 5000)

function walk(directory, extension, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(target, extension, output)
    else if (target.endsWith(extension)) output.push(target)
  }
  return output
}

for (const jsonFile of walk(mini, '.json')) JSON.parse(fs.readFileSync(jsonFile, 'utf8'))

const appConfig = JSON.parse(fs.readFileSync(path.join(mini, 'app.json'), 'utf8'))
for (const page of appConfig.pages) {
  for (const extension of ['.js', '.json', '.wxml', '.wxss']) {
    assert(fs.existsSync(path.join(mini, page + extension)), `Missing page file: ${page + extension}`)
  }
}

for (const wxml of walk(mini, '.wxml')) {
  const source = fs.readFileSync(wxml, 'utf8')
  assert(!source.includes('.indexOf('), `Unsupported method call in WXML: ${wxml}`)
  const references = [...source.matchAll(/(?:src|selectedIconPath|iconPath)="(\/images\/[^"{]+)"/g)]
  for (const match of references) {
    assert(fs.existsSync(path.join(mini, match[1].slice(1))), `Missing image ${match[1]} in ${wxml}`)
  }
}

for (const jsFile of walk(mini, '.js')) {
  const source = fs.readFileSync(jsFile, 'utf8')
  const requires = [...source.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)]
  for (const match of requires) {
    const base = path.resolve(path.dirname(jsFile), match[1])
    const exists = fs.existsSync(base) || fs.existsSync(base + '.js') || fs.existsSync(path.join(base, 'index.js'))
    assert(exists, `Missing require target ${match[1]} in ${jsFile}`)
  }
}

console.log('Mini Program smoke tests passed.')
