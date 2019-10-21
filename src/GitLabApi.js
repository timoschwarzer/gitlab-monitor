import axios  from 'axios'
import parse  from 'parse-link-header'
import Vue    from 'vue'
import Config from './Config'

const GitLabApi = {}

GitLabApi.install = (Vue) => {
  Vue.prototype.$api = async (url, privateToken, path, params = {}, behaviour = {}) => {
    console.log("api "+url+path);
    const response = await axios.get(path, {
      baseURL: url,
      params,
      headers: { 'Private-Token': privateToken }
    })
    const result = response.data
    if (behaviour.follow_next_page_links) {
      // Find the "next" link header and follow it, until we get a result that has no next link
      let parsedLinks = parse(response.headers.link)
      while (parsedLinks && parsedLinks.next) {
        const nextResponse = await axios.get(parsedLinks.next.url, {
          headers: { 'Private-Token': privateToken }
        })
        result.push(...nextResponse.data)
        parsedLinks = parse(nextResponse.headers.link)
      }
    }
    return result
  }
}

export default GitLabApi

export function configureApi() {
  Vue.use(GitLabApi)
}
