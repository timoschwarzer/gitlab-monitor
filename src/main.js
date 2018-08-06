import 'babel-polyfill';
import Vue                 from 'vue';
import App                 from './components/app.vue';
import GitLabApi           from './GitLabApi';
import VueTimeago          from 'vue-timeago';
import {getQueryParameter} from './util';

Vue.use(GitLabApi, {
  gitlab_api_url: getQueryParameter('gitlabApi') || process.env.GITLAB_API,
  private_token: getQueryParameter('privateToken') || process.env.GITLAB_PRIVATE_TOKEN
});

Vue.use(VueTimeago, {
  name: 'timeago', // component name, `timeago` by default
  locale: 'en',
  locales: {
    'en': require('date-fns/locale/en')
  }
});

new Vue({
  el: '#app',
  render: h => h(App)
});
