import axios  from 'axios'
import parse  from 'parse-link-header'
import Vue    from 'vue'
import Config from './Config'
import rateLimit from 'axios-rate-limit'

const GitLabApi = {}

GitLabApi.install = (Vue, options) => {
  const rateLimitOptions = Config.root.rateLimit || { maxRequests: 8, perMilliseconds: 1500}
  const http = rateLimit(axios.create(), rateLimitOptions)

  Vue.prototype.$api = async (path, params = {}, behaviour = {}) => {
    const response = await http.get(path, {
      baseURL: Config.root.gitlabApi,
      params,
      headers: { 'Private-Token': Config.root.privateToken }
    })
    const result = response.data
    if (behaviour.follow_next_page_links) {
      // Find the "next" link header and follow it, until we get a result that has no next link
      let parsedLinks = parse(response.headers.link)
      while (parsedLinks && parsedLinks.next) {
        const nextResponse = await axios.get(parsedLinks.next.url, {
          headers: { 'Private-Token': Config.root.privateToken }
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
  Vue.use(GitLabApi, {
    gitlab_api_url: Config.root.gitlabApi,
    private_token: Config.root.privateToken
  })
}
