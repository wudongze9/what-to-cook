const { allIngredients } = require('../../mock/dishes')
const { enrichIngredient } = require('../../utils/icon-map')

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
    }
  },

  data: {
    slots: [],
    leverPulling: false,
    internalSpinning: false
  },

  observers: {
    'slotCount, ingredientType': function () {
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
          const finalItem = this._randomItem(pool)
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
            this.triggerEvent('spinend', { selectedIngredients })
          }
        }, finishDelay)
        this._finishTimers.push(finish)
      }
    }
  }
})
