export const getQueryParameter = (name, url = window.location.href) => {
  name = name.replace(/[[]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  const parameter = decodeURIComponent(results[2].replace(/\+/g, ' '));
  if (parameter === 'true') {
    return true;
  } else if (parameter === 'false') {
    return false;
  } else if (!isNaN(+parameter)) {
    return +parameter
  }
  return parameter;
};
