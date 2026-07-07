const { allIngredients, dishes } = require('../../mock/dishes')
const { enrichIngredient } = require('../../utils/icon-map')

function ingredientName(ingredient) {
  return typeof ingredient === 'string' ? ingredient : (ingredient && ingredient.name) || ''
}

function isAll(value) {
  return !value || value === 'all' || value === '全部'
}

Component({
  properties: {
    spinning: {
      type: Boolean,
      value: false
    },
    slotCount: {
      type: Number,
      value: 3
    },
    ingredientType: {
      type: String,
      value: 'all'
    },
    cuisine: {
      type: String,
      value: 'all'
    },
    spiceLevel: {
      type: String,
      value: 'all'
    }
  },

  data: {
    slots: [],
    leverPulling: false,
    internalSpinning: false
  },

  observers: {
    'slotCount, ingredientType, cuisine, spiceLevel': function () {
      this._clearTimers()
      this.setData({ internalSpinning: false, leverPulling: false })
      this._initSlots()
    }
  },

  lifetimes: {
    attached() {
      this._spinTimers = []
      this._finishTimers = []
      this._initSlots()
    },

    detached() {
      this._clearTimers()
    }
  },

  methods: {
    _clearTimers() {
      const spinTimers = this._spinTimers || []
      const finishTimers = this._finishTimers || []
      for (let i = 0; i < spinTimers.length; i++) clearInterval(spinTimers[i])
      for (let i = 0; i < finishTimers.length; i++) clearTimeout(finishTimers[i])
      this._spinTimers = []
      this._finishTimers = []
    },

    _randomItem(pool) {
      return pool[Math.floor(Math.random() * pool.length)]
    },

    _initSlots() {
      const slotCount = this.properties.slotCount
      const pool = this._getPool()
      const slots = []
      for (let i = 0; i < slotCount; i++) {
        slots.push({
          current: this._randomItem(pool),
          settled: true,
          pulseKey: 0
        })
      }
      this.setData({ slots })
    },

    _getPool() {
      const ingredientType = this.properties.ingredientType
      const pool = (!ingredientType || ingredientType === 'all')
        ? allIngredients
        : allIngredients.filter(i => i.type === ingredientType)
      return pool.map(enrichIngredient)
    },

    _getCandidateDishes() {
      const cuisine = this.properties.cuisine
      const spiceLevel = this.properties.spiceLevel
      const ingredientType = this.properties.ingredientType

      let result = dishes.slice()
      if (!isAll(cuisine)) {
        result = result.filter(dish => dish.cuisine === cuisine || dish.category === cuisine)
      }
      if (!isAll(spiceLevel)) {
        result = result.filter(dish => dish.spiceLevel === spiceLevel)
      }
      if (!isAll(ingredientType)) {
        result = result.filter(dish => {
          return (dish.ingredients || []).some(ingredient => {
            const name = ingredientName(ingredient)
            const found = allIngredients.find(item => item.name === name)
            return found && found.type === ingredientType
          })
        })
      }

      if (result.length) return result

      result = dishes.slice()
      if (!isAll(ingredientType)) {
        result = result.filter(dish => {
          return (dish.ingredients || []).some(ingredient => {
            const name = ingredientName(ingredient)
            const found = allIngredients.find(item => item.name === name)
            return found && found.type === ingredientType
          })
        })
      }
      return result.length ? result : dishes
    },

    _buildFinalItems(pool, slotCount) {
      const dish = this._randomItem(this._getCandidateDishes())
      const dishIngredients = (dish.ingredients || [])
        .map(ingredient => {
          const name = ingredientName(ingredient)
          const found = allIngredients.find(item => item.name === name) || { name, type: 'other' }
          return enrichIngredient(found)
        })
        .filter(item => item && item.name)

      const finalItems = []
      const used = {}
      const addItem = (item) => {
        if (!item || used[item.name] || finalItems.length >= slotCount) return
        used[item.name] = true
        finalItems.push(item)
      }

      const ingredientType = this.properties.ingredientType
      if (!isAll(ingredientType)) {
        dishIngredients
          .filter(item => item.type === ingredientType)
          .forEach(addItem)
      }
      dishIngredients.forEach(addItem)

      while (finalItems.length < slotCount && pool.length) {
        addItem(this._randomItem(pool))
        if (Object.keys(used).length >= pool.length) break
      }

      return {
        dish,
        items: finalItems.slice(0, slotCount)
      }
    },

    onLeverTap() {
      this.triggerEvent('levertap')
      this.startSpin()
    },

    startSpin() {
      if (this.data.internalSpinning) return

      this._clearTimers()
      this.setData({ internalSpinning: true, leverPulling: true })

      const releaseTimer = setTimeout(() => {
        this.setData({ leverPulling: false })
      }, 260)
      this._finishTimers.push(releaseTimer)

      const pool = this._getPool()
      const slotCount = this.properties.slotCount
      const selectedIngredients = []
      const finalPlan = this._buildFinalItems(pool, slotCount)
      let finishedCount = 0

      for (let i = 0; i < slotCount; i++) {
        const intervalMs = 74 + i * 16
        const finishDelay = 980 + i * 360

        const tick = setInterval(() => {
          const key = 'slots[' + i + ']'
          const current = this._randomItem(pool)
          this.setData({
            [key]: {
              current,
              settled: false,
              pulseKey: Date.now()
            }
          })
        }, intervalMs)
        this._spinTimers.push(tick)

        const finish = setTimeout(() => {
          clearInterval(tick)
          const finalItem = finalPlan.items[i] || this._randomItem(pool)
          selectedIngredients[i] = finalItem
          const key = 'slots[' + i + ']'
          this.setData({
            [key]: {
              current: finalItem,
              settled: true,
              pulseKey: Date.now()
            }
          })

          finishedCount += 1
          if (finishedCount === slotCount) {
            this._clearTimers()
            this.setData({ internalSpinning: false })
            this.triggerEvent('spinend', {
              selectedIngredients,
              preferredDishId: finalPlan.dish && finalPlan.dish.id
            })
          }
        }, finishDelay)
        this._finishTimers.push(finish)
      }
    }
  }
})
