import queryString from 'query-string'

export const getQueryParameter = (name) => {
  const parsed = queryString.parse(location.search)

  if (name in parsed) {
    let parameter = parsed[name]

    if (parameter === 'true') {
      return true
    } else if (parameter === 'false') {
      return false
    } else if (!isNaN(+parameter)) {
      return +parameter
    }

    return parameter
  } else {
    return null
  }
}
