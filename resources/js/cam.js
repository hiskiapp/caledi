'use strict'

document.addEventListener('alpine:init', () => {
  Alpine.data('cam', () => ({
    started: false,
    processing: false,
    finished: false,
    base64image: null,
    predictions: [],
    is_unknown: false,
    video: document.getElementById('main-cam'),

    async start() {
      this.started = true
      const constraints = {
        audio: false,
        video: {
          width: 640,
          height: 420,
        },
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        window.stream = stream
        this.video.srcObject = stream
        this.video.play()
      } catch (e) {
        console.error('navigator.getUserMedia error:', e)
      }
    },

    async submit() {
      this.base64image = this.captureVideoFrame()
      await this.predict(this.getBase64Image())
    },

    async upload(e) {
      const file = e.target.files[0]
      this.base64image = await this.readFileAsDataURL(file)
      await this.predict(this.getBase64Image())
    },

    async urlfile() {
      const url = prompt('Please enter the image URL')
      if (url) {
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          this.base64image = await this.readFileAsDataURL(blob)
          await this.predict(this.getBase64Image())
        } catch (error) {
          console.error(error)
        }
      }
    },

    captureVideoFrame() {
      const canvas = document.createElement('canvas')
      canvas.width = this.video.videoWidth
      canvas.height = this.video.videoHeight
      canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height)
      this.video.pause()
      return canvas.toDataURL('image/png')
    },

    readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => {
          resolve(reader.result)
        }

        reader.onerror = reject

        reader.readAsDataURL(file)
      })
    },

    getBase64Image() {
      return this.base64image.split(',')[1]
    },

    async predict(base64) {
      this.processing = true
      this.finished = false
      this.predictions = []

      try {
        const response = await fetch('/store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
          }),
        })

        const res = await response.json()

        if (res.result.name === 'unknown') {
          this.is_unknown = true
        } else {
          this.predictions = this.formatPredictions(res)
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.processing = false
        this.finished = true
      }

      console.log(this.predictions)
    },

    formatPredictions(res) {
      return Object.entries(res.prediction).map(([key, value]) => ({
        disease: key
          .replace(/[_-]/g, ' ')
          .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase())),
        accuracy: (value * 100).toFixed(2) + '%',
        is_max: res.result.name === key,
      }))
    },

    retry() {
      this.started = true
      this.finished = false
      this.base64image = null
      this.predictions = []
      this.is_unknown = false
      this.video.play()
    },

    refresh() {
      window.location.reload()
    },
  }))
})
