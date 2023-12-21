import '../css/app.css'
import _ from 'lodash'
import Alpine from 'alpinejs'

window.Alpine = Alpine
Alpine.start()
import './cam.js'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}
