import { getQueryParameter } from './util'
import merge                 from 'deepmerge'
import defaultConfig         from './config.default'
import base64Url             from 'base64url'
import YAML                  from 'yaml'

export default new class Config {
  constructor() {
    this.config = null
    this.localConfig = null
    this.styleOverride = ''
  }

  load(config = null, style = null) {
    const rawConfig = getQueryParameter('rawConfig')

    if (style !== null) {
      this.styleOverride = style
    }

    if (config !== null) {
      this.localConfig = config
      this.config = merge(defaultConfig, config)
    } else if (rawConfig !== null) {
      this.localConfig = YAML.parse(base64Url.decode(rawConfig))
      this.config = merge(defaultConfig, this.localConfig)
    } else {
      this.loadFromLocalStorage()
    }

    this.persist()
  }

  loadFromLocalStorage() {
    const config = window.localStorage.getItem('config')
    this.styleOverride = window.localStorage.getItem('styleOverride') || ''

    if (config !== null) {
      const localConfig = YAML.parse(config)
      this.config = merge(defaultConfig, localConfig)
      this.localConfig = localConfig
    }
  }

  persist() {
    if (!this.localConfig) {
      return
    }

    window.localStorage.setItem('config', YAML.stringify(this.localConfig, null, 2))
    window.localStorage.setItem('styleOverride', this.styleOverride)
  }

  get isConfigured() {
    return this.config !== null
  }

  get root() {
    return this.config
  }

  get local() {
    return this.localConfig
  }

  get style() {
    return this.styleOverride
  }

  getProjectProperty(property, pathWithNamespace = '*') {
    if (this.root.projectConfig.hasOwnProperty(pathWithNamespace)) {
      return this.root.projectConfig[pathWithNamespace][property]
    } else {
      return this.root.projectConfig['*'][property]
    }
  }
}
