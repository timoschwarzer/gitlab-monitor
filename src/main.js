import 'babel-polyfill'
import Vue              from 'vue'
import VueTimeago       from 'vue-timeago'
import App              from './components/app.vue'
import Config           from './Config'
import { configureApi } from './GitLabApi'

const finish = () => {
  if (Config.isConfigured) {
    configureApi()
  }

  Vue.use(VueTimeago, {
    name: 'timeago', // component name, `timeago` by default
    locale: 'en',
    locales: {
      'en': require('date-fns/locale/en')
    }
  })

  new Vue({
    el: '#app',
    render: h => h(App)
  })
}

// Load bundled config, if present.
fetch('/config.json').then(response => {
  if (response.ok) {
    response.json().then(j => {
      Config.load(j)
      finish()
    }).catch(e => {
      Config.load()
      finish()
    })
  } else {
    Config.load()
    finish()
  }
})

