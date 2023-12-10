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
      const canvas = document.createElement('canvas')
      canvas.width = this.video.videoWidth
      canvas.height = this.video.videoHeight
      canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height)
      const data = canvas.toDataURL('image/png')
      this.video.pause()
      this.base64image = data

      const base64 = data.split(',')[1]
      await this.predict(base64)
    },

    async upload(e) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = async () => {
        this.base64image = reader.result
        const base64 = this.base64image.split(',')[1]
        await this.predict(base64)
      }

      reader.readAsDataURL(file)
    },

    async urlfile() {
      const url = prompt('Please enter the image URL')
      if (url) {
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          const reader = new FileReader()

          reader.onload = async () => {
            this.base64image = reader.result
            const base64 = this.base64image.split(',')[1]
            await this.predict(base64)
          }

          reader.readAsDataURL(blob)
        } catch (error) {
          console.error(error)
        }
      }
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
          let predictions = []
          for (const [key, value] of Object.entries(res.prediction)) {
            predictions.push({
              disease: key
                .replace(/[_-]/g, ' ')
                .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase())),
              accuracy: (value * 100).toFixed(2) + '%',
              is_max: res.result.name === key,
            })
          }

          this.predictions = predictions
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.processing = false
        this.finished = true
      }

      console.log(this.predictions)
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
      window.location.href = '/'
    },
  }))
})
