import axios from 'axios';
import parse from 'parse-link-header'

const GitLabApi = {};

GitLabApi.install = (Vue, options) => {
  Vue.prototype.$api = async (path, params = {}, behaviour = {}) => {
    const response = await axios.get(path, {
      baseURL: options.gitlab_api_url,
      params,
      headers: {'Private-Token': options.private_token}
    });
    const result = response.data;
    if (behaviour.follow_next_page_links) {
      // Find the "next" link header and follow it, until we get a result that has no next link
      let parsedLinks = parse(response.headers.link);
      while (parsedLinks && parsedLinks.next) {
        const nextResponse = await axios.get(parsedLinks.next.url, {
          headers: {'Private-Token': options.private_token}
        });
        result.push(...nextResponse.data);
        parsedLinks = parse(nextResponse.headers.link);
      }
    }
    return result;
  };
};

export default GitLabApi;
