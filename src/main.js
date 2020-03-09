import 'regenerator-runtime/runtime'
import Vue from 'vue'
import VueTimeago from 'vue-timeago'
import App from './components/app.vue'
import Config from './Config'
import {configureApi} from './GitLabApi'
import axios from 'axios'

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
;(async () => {
  try {
    const {data} = await axios.get('./config.json')
    Config.load(data)
  } catch (e) {
    Config.load()
  } finally {
    finish()
  }
})()
