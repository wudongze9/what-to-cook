Component({
  properties: {
    step: {
      type: Object,
      value: {}
    },
    index: {
      type: Number,
      value: 0
    },
    status: {
      type: String,
      value: 'upcoming' // completed | current | upcoming
    },
    isLast: {
      type: Boolean,
      value: false
    }
  }
})
