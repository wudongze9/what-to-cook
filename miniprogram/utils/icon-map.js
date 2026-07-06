const ICON_BASE = '/images/icons/'

const iconByType = {
  all: 'spark.svg',
  vegetable: 'leaf.svg',
  meat: 'meat.svg',
  seafood: 'seafood.svg',
  egg: 'egg.svg',
  staple: 'rice.svg',
  seasoning: 'seasoning.svg'
}

const iconByName = {
  番茄: 'tomato.svg',
  白菜: 'cabbage.svg',
  菠菜: 'leaf.svg',
  芹菜: 'celery.svg',
  胡萝卜: 'carrot.svg',
  洋葱: 'onion.svg',
  蘑菇: 'mushroom.svg',
  西兰花: 'leaf.svg',
  土豆: 'potato.svg',
  青椒: 'pepper.svg',
  红椒: 'pepper.svg',
  茄子: 'eggplant.svg',
  豆角: 'beans.svg',
  冬瓜: 'cucumber.svg',
  苦瓜: 'cucumber.svg',
  丝瓜: 'cucumber.svg',
  黄瓜: 'cucumber.svg',
  莲藕: 'lotus.svg',
  木耳: 'wood-ear.svg',
  笋: 'bamboo-shoot.svg',
  南瓜: 'pumpkin.svg',
  韭菜: 'scallion.svg',
  蒜薹: 'scallion.svg',
  小白菜: 'cabbage.svg',
  空心菜: 'leaf.svg',
  生菜: 'leaf.svg',
  玉米: 'corn.svg',
  鸡蛋: 'egg.svg',
  鸭蛋: 'egg.svg',
  咸鸭蛋: 'egg.svg',
  豆腐: 'tofu.svg',
  豆干: 'tofu.svg',
  腐竹: 'soy-skin.svg',
  豆皮: 'soy-skin.svg',
  千张: 'soy-skin.svg',
  豌豆: 'beans.svg',
  红豆: 'beans.svg',
  绿豆: 'beans.svg',
  猪肉: 'meat.svg',
  五花肉: 'meat.svg',
  排骨: 'meat.svg',
  猪肝: 'liver.svg',
  鸡胸肉: 'chicken.svg',
  鸡腿: 'chicken.svg',
  鸡翅: 'chicken.svg',
  鸭肉: 'duck.svg',
  牛肉: 'meat.svg',
  牛腱: 'meat.svg',
  牛腩: 'meat.svg',
  肥牛: 'meat.svg',
  猪里脊: 'meat.svg',
  羊肉: 'lamb.svg',
  腊肉: 'bacon.svg',
  香肠: 'sausage.svg',
  虾: 'seafood.svg',
  鲈鱼: 'fish.svg',
  三文鱼: 'salmon.svg',
  鲫鱼: 'fish.svg',
  螃蟹: 'crab.svg',
  蛤蜊: 'shell.svg',
  鱿鱼: 'squid.svg',
  带鱼: 'fish.svg',
  龙虾: 'lobster.svg',
  扇贝: 'shell.svg',
  海参: 'sea-cucumber.svg',
  鱼: 'fish.svg',
  米饭: 'rice.svg',
  隔夜米饭: 'rice.svg',
  面条: 'noodle.svg',
  馒头: 'bun.svg',
  饺子皮: 'dumpling.svg',
  意面: 'pasta.svg',
  年糕: 'rice-cake.svg',
  粉丝: 'vermicelli.svg',
  粉条: 'vermicelli.svg',
  糯米: 'sticky-rice.svg',
  蒜: 'garlic.svg',
  蒜泥: 'garlic.svg',
  蒜苗: 'scallion.svg',
  蒜蓉: 'garlic.svg',
  葱: 'scallion.svg',
  葱花: 'scallion.svg',
  葱丝: 'scallion.svg',
  姜: 'ginger.svg',
  姜片: 'ginger.svg',
  盐: 'seasoning.svg',
  糖: 'seasoning.svg',
  冰糖: 'sugar-cube.svg',
  醋: 'sauce.svg',
  酱油: 'sauce.svg',
  生抽: 'sauce.svg',
  老抽: 'sauce.svg',
  蚝油: 'sauce.svg',
  蒸鱼豉油: 'sauce.svg',
  干辣椒: 'pepper.svg',
  花椒: 'pepper.svg',
  花椒粉: 'pepper.svg',
  辣椒油: 'pepper.svg',
  豆瓣酱: 'pepper.svg',
  剁椒: 'pepper.svg',
  八角: 'star-anise.svg',
  桂皮: 'cinnamon.svg',
  料酒: 'wine.svg',
  淀粉: 'starch.svg',
  芝麻: 'sesame.svg',
  白芝麻: 'sesame.svg',
  花生: 'peanut.svg',
  花生米: 'peanut.svg',
  香油: 'oil.svg',
  番茄酱: 'tomato.svg',
  可乐: 'coke.svg',
  豆豉: 'beans.svg',
  泡椒: 'pepper.svg',
  香菜: 'cilantro.svg',
  食用油: 'oil.svg',
  虾皮: 'seafood.svg',
  沙拉酱: 'salad.svg'
}

const keywordIcons = [
  ['番茄', 'tomato.svg'],
  ['西兰花', 'leaf.svg'],
  ['白菜', 'cabbage.svg'],
  ['生菜', 'leaf.svg'],
  ['青菜', 'leaf.svg'],
  ['菜', 'leaf.svg'],
  ['胡萝卜', 'carrot.svg'],
  ['洋葱', 'onion.svg'],
  ['蘑菇', 'mushroom.svg'],
  ['菇', 'mushroom.svg'],
  ['茄子', 'eggplant.svg'],
  ['豆角', 'beans.svg'],
  ['豆', 'beans.svg'],
  ['瓜', 'cucumber.svg'],
  ['藕', 'lotus.svg'],
  ['木耳', 'wood-ear.svg'],
  ['笋', 'bamboo-shoot.svg'],
  ['玉米', 'corn.svg'],
  ['鸡蛋', 'egg.svg'],
  ['蛋', 'egg.svg'],
  ['豆腐', 'tofu.svg'],
  ['腐竹', 'soy-skin.svg'],
  ['肉', 'meat.svg'],
  ['排骨', 'meat.svg'],
  ['鸡', 'chicken.svg'],
  ['鸭', 'duck.svg'],
  ['羊', 'lamb.svg'],
  ['腊肉', 'bacon.svg'],
  ['香肠', 'sausage.svg'],
  ['虾', 'seafood.svg'],
  ['鱼', 'fish.svg'],
  ['蟹', 'crab.svg'],
  ['贝', 'shell.svg'],
  ['蛤', 'shell.svg'],
  ['鱿鱼', 'squid.svg'],
  ['龙虾', 'lobster.svg'],
  ['海参', 'sea-cucumber.svg'],
  ['米饭', 'rice.svg'],
  ['米', 'rice.svg'],
  ['面', 'noodle.svg'],
  ['粉', 'vermicelli.svg'],
  ['馒头', 'bun.svg'],
  ['饺子', 'dumpling.svg'],
  ['蒜', 'garlic.svg'],
  ['葱', 'scallion.svg'],
  ['姜', 'ginger.svg'],
  ['辣椒', 'pepper.svg'],
  ['椒', 'pepper.svg'],
  ['糖', 'sugar-cube.svg'],
  ['油', 'oil.svg'],
  ['酱', 'sauce.svg'],
  ['醋', 'sauce.svg'],
  ['酒', 'wine.svg'],
  ['淀粉', 'starch.svg'],
  ['芝麻', 'sesame.svg'],
  ['花生', 'peanut.svg'],
  ['可乐', 'coke.svg'],
  ['沙拉', 'salad.svg']
]

const iconByCuisine = {
  all: 'spark.svg',
  home: 'home.svg',
  sichuan: 'pepper.svg',
  cantonese: 'steam.svg',
  hunan: 'fire.svg',
  shandong: 'pot.svg',
  jiangsu: 'bamboo.svg',
  zhejiang: 'fish.svg',
  northeast: 'dumpling.svg',
  western: 'fork.svg',
  japanese: 'fish.svg',
  dessert: 'dessert.svg'
}

const iconBySpice = {
  all: 'plate.svg',
  mild: 'leaf.svg',
  light_spicy: 'pepper.svg',
  medium_spicy: 'pepper.svg',
  heavy_spicy: 'fire.svg',
  sweet: 'honey.svg',
  sour: 'lemon.svg',
  salty: 'seasoning.svg'
}

function iconPath(file) {
  return ICON_BASE + file
}

function getTypeIcon(type) {
  return iconPath(iconByType[type] || iconByType.all)
}

function getIngredientIcon(item) {
  const name = typeof item === 'string' ? item : item.name
  const type = typeof item === 'string' ? '' : item.type
  let keywordIcon = ''
  if (name) {
    for (let i = 0; i < keywordIcons.length; i++) {
      if (name.indexOf(keywordIcons[i][0]) !== -1) {
        keywordIcon = keywordIcons[i][1]
        break
      }
    }
  }
  return iconPath(iconByName[name] || keywordIcon || iconByType[type] || 'spark.svg')
}

function enrichIngredient(item) {
  if (typeof item === 'string') {
    return { name: item, icon: getIngredientIcon(item) }
  }
  const result = Object.assign({}, item)
  result.icon = getIngredientIcon(item)
  return result
}

function enrichIngredientType(item) {
  const result = Object.assign({}, item)
  result.icon = getTypeIcon(item.key)
  return result
}

function enrichCuisine(item) {
  const result = Object.assign({}, item)
  result.icon = iconPath(iconByCuisine[item.key] || 'plate.svg')
  return result
}

function enrichSpice(item) {
  const result = Object.assign({}, item)
  result.icon = iconPath(iconBySpice[item.key] || 'plate.svg')
  return result
}

function getTabIcon(key) {
  const icons = {
    shake: 'dice.svg',
    video: 'video.svg',
    chat: 'chat.svg',
    profile: 'user.svg'
  }
  return iconPath(icons[key] || 'spark.svg')
}

module.exports = {
  getIngredientIcon,
  enrichIngredient,
  enrichIngredientType,
  enrichCuisine,
  enrichSpice,
  getTabIcon
}
