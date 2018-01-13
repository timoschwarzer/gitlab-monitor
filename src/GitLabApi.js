import axios from 'axios';

const GitLabApi = {};

GitLabApi.install = (Vue, options) => {
  Vue.prototype.$api = async (path, params = {}) => {
    const response = await axios.get(path, {
      baseURL: options.gitlab_api_url,
      params,
      headers: {'Private-Token': options.private_token}
    });
    return response.data;
  };
};

export default GitLabApi;
