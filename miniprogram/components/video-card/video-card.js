Component({
  properties: {
    video: {
      type: Object,
      value: {}
    },
    featured: {
      type: Boolean,
      value: false
    }
  },

  data: {
    fallbackCover: '/images/video-cover-food.svg',
    fallbackAvatar: '/images/icons/chef.svg'
  },

  methods: {
    onTap() {
      const video = this.data.video
      this.triggerEvent('play', { video })
    },

    onCoverError() {
      this.setData({ 'video.cover': this.data.fallbackCover })
    },

    onAvatarError() {
      this.setData({ 'video.chefAvatar': this.data.fallbackAvatar })
    }
  }
})
