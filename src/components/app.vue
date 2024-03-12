<template>
  <div class="app">
    <template v-if="loaded && configured">
      <div ref="content" class="content" :style="{zoom}">
        <h1 class="title" v-if="!!getTitle()">{{ getTitle() }}</h1>
        <div class="projects">
          <project-card
            v-for="project in sortedProjects"
            :key="project.id"
            :project-id="project.id"
          />
        </div>
        <div v-if="configured" class="configure" @click.prevent.stop="configured = false">
          Configure
        </div>
      </div>
      <div v-if="showRunnerStatus()">
        <runner-status/>
      </div>
    </template>
    <div v-else-if="!configured" class="container">
      <h1>Configuration</h1>
      <p>
        To use GitLab Monitor, it has to be configured.<br>
        Configuration is done by supplying YAML formatted options,<br>
        all configuration options are described <a href="https://github.com/timoschwarzer/gitlab-monitor/blob/main/CONFIGURATION.md#configuration-options" target="_blank">here</a>.<br>
        Your configuration is being persisted in this browser.
      </p>
      <monaco-editor v-model="config" language="yaml" class="config" :options="monacoOptions" />
      <p class="error" v-if="!configIsValid">
        YAML is invalid!
      </p>

      <template v-if="editCustomStyles">
        <h1>Custom styles</h1>
        <monaco-editor v-model="styleOverride" language="css" class="config" :options="monacoOptions" />
      </template>

      <button :disabled="!configIsValid" @click="saveConfig">Save</button>
      <button v-if="!editCustomStyles" @click="editCustomStyles = true">Add custom styles</button>
    </div>
    <div v-else class="loader">
      <octicon name="sync" spin scale="3" />
    </div>
  </div>
</template>

<script>
  import Octicon from 'vue-octicon/components/Octicon'
  import Config from '../Config'
  import { configureApi } from '@/GitLabApi'
  import ProjectCard from './project-card'
  import RunnerStatus from './runner-status'
  import YAML from 'yaml'
  import Visibilty from 'visibilityjs'
  import MonacoEditor from 'vue-monaco'

  export default {
    components: {
      Octicon,
      ProjectCard,
      RunnerStatus,
      MonacoEditor
    },
    name: 'app',
    data: () => ({
      projects: [],
      zoom: 1,
      loaded: false,
      configured: false,
      config: '',
      styleOverride: '',
      editCustomStyles: false,
      monacoOptions: {
        theme: 'vs-dark',
        tabSize: 2,
        minimap: {
          enabled: false
        },
        scrollBeyondLastLine: false
      }
    }),
    computed: {
      sortedProjects() {
        const sortMethods = {
          // Register new order/sorting methods here in ascending order here
          lastActivity: (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime(),
          created: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          name: (a, b) => a.name.localeCompare(b.name),
          nameWithNamespace: (a, b) => a.name_with_namespace.localeCompare(b.name_with_namespace),
        }

        let byMethod = sortMethods[Config.root.orderBy]

        if (byMethod == null) {
          console.warn(
            `Config.orderBy: Invalid configuration value "${Config.root.orderBy}", falling back to lastActivity`,
            `Possible values: ${Object.keys(sortMethods).join(', ')}`
          )
          byMethod = sortMethods.lastActivity
        }

        if (Config.root.orderByDesc) {
          const currentMethod = byMethod
          byMethod = (a, b) => currentMethod(b, a)
        }

        return this.projects.sort(byMethod)
      },
      configIsValid() {
        try {
          YAML.parse(this.config)
        } catch (e) {
          return false
        }

        return true
      },
    },
    beforeMount() {
      this.reloadConfig()
    },
    beforeDestroy() {
      this.stopInterval(this.refreshIntervalId)
    },
    methods: {
      async fetchProjects() {
        const fetchCount = Config.root.fetchCount

        const gitlabApiParams = {
          order_by: 'last_activity_at',
          // GitLab per_page max is 100. We use > 100 values as next page follow trigger
          per_page: fetchCount > 100 ? 100 : fetchCount
        }

        const visibility = Config.root.projectVisibility
        // Only add the visibility attribute to the params if filtering is required
        // (if visiblity is not specified, Gitlab will return all projects)
        if (visibility !== 'any') {
          gitlabApiParams.visibility = visibility
        }

        // Only add the membership flag if it has been defined and is a valid type.
        const membership = Config.root.membership
        if (typeof membership === 'boolean') {
          gitlabApiParams.membership = membership
        }

        const includeSubgroups = Config.root.includeSubgroups
        if (typeof includeSubgroups === 'boolean') {
          gitlabApiParams.include_subgroups = includeSubgroups
        }

        const includeArchived = Config.root.includeArchived
        if (includeArchived === false) {
          gitlabApiParams.archived = "false"
        }

        // Only use main level projects API if tighter scope not defined
        const scopeType = Config.root.projectScope
        // Reformat the variable as a flat list of Ids
        const scopeId = [Config.root.projectScopeId].flat()

        const apiPromises = []
        for (let scope of scopeId) {
          let urlPrefix = ''
          if ((scopeType === 'users' || scopeType === 'groups') && scope !== null) {
            urlPrefix = '/' + scopeType + '/' + scope
          }

          apiPromises.push(this.$api(urlPrefix + '/projects', gitlabApiParams, { follow_next_page_links: fetchCount > 100 }))
        }

        const projects = (await Promise.all(apiPromises)).flat()

        // Only show projects that have jobs enabled
        const maxAge = Config.root.maxAge

        this.projects = projects.filter(project => {
          return project.jobs_enabled &&
            (maxAge === 0 || ((new Date() - new Date(project.last_activity_at)) / 1000 / 60 / 60 <= maxAge)) &&
            (
              // Include rules
              (
                project.path_with_namespace.match(new RegExp(Config.root.filter.include)) && (
                  // "Exclude untagged" rule
                  (
                    project.tag_list.length > 0 &&
                    project.tag_list.some(tag => tag.match(new RegExp(Config.root.filter.includeTags)))
                  ) || (
                    project.tag_list.length === 0 &&
                    !Config.root.filter.excludeUntagged
                  )
                )
              )

              // Exclude rules
              && (
                (
                  Config.root.filter.exclude === null ||
                  !project.path_with_namespace.match(new RegExp(Config.root.filter.exclude))
                ) && (
                  Config.root.filter.excludeTags === null ||
                  project.tag_list.some(tag => tag.match(new RegExp(Config.root.filter.excludeTags)))
                )
              )
            )
        })

        if (Config.root.autoZoom) {
          this.$nextTick(() => this.autoZoom())
        }

        this.loaded = true
      },
      async autoZoom() {
        let step = 0.1

        const content = this.$refs.content

        if (content.scrollHeight > content.clientHeight) {
          step = -0.1
        }

        while (
          (step > 0 && content.scrollHeight <= content.clientHeight) ||
          (step < 0 && content.scrollHeight > content.clientHeight)
        ) {
          this.zoom += step
          await this.$nextTick()

          if (this.zoom > 20 || this.zoom < 0) {
            // The browser likely doesn't support CSS zoom
            this.zoom = 0
            return
          }
        }

        if (step > 0) this.zoom -= step
      },
      reloadConfig() {
        this.$forceUpdate()

        if (!this.configured && Config.isConfigured) {
          configureApi()

          this.loaded = false
          this.projects = []
          this.fetchProjects()

          if (Config.root.autoZoom) {
            if (this.autoZoomIntervalId) {
              clearInterval(this.autoZoomIntervalId)
            }

            this.autoZoomIntervalId = setInterval(() => {
              this.autoZoom()
            }, 5000)
          }

          if (this.refreshIntervalId) {
            this.stopInterval(this.refreshIntervalId)
          }

          const twoMinutes = 2 * 60 * 1000

          if (Config.root.backgroundRefresh) {
            this.enableInterval = (t, f) => setInterval(f, t)
            this.stopInterval = (i) => clearInterval(i)
          } else {
            this.enableInterval = Visibilty.every
            this.stopInterval = Visibilty.stop
          }

          this.refreshIntervalId = this.enableInterval(
            twoMinutes * Config.root.pollingIntervalMultiplier,
            async () => {
              if (!this.loading) {
                await this.fetchProjects()
              }
            }
          )

          // https://webpack.js.org/loaders/style-loader/#lazystyletag
          this.themeStyles?.unuse()

          if (Config.root.theme) {
            document.documentElement.classList.value = Config.root.theme
            this.themeStyles =
              require('!!style-loader?injectType=lazyStyleTag!css-loader!sass-loader!../themes/' + Config.root.theme + '.theme.scss')
            this.themeStyles.use()
          }
        }

        this.configured = Config.isConfigured

        if (this.configured) {
          this.config = YAML.stringify(Config.local, null, 2)
        } else {
          this.config = YAML.stringify(require('../config.template'), null, 2)
        }

        this.styleOverride = Config.style
        this.editCustomStyles = this.styleOverride.trim() !== '';

        let styleOverrideElement = document.getElementById('style-override')
        if (styleOverrideElement !== null) {
          styleOverrideElement.remove()
        }
        styleOverrideElement = document.createElement('style')
        styleOverrideElement.id = 'style-override'
        styleOverrideElement.appendChild(document.createTextNode(Config.style))
        document.head.appendChild(styleOverrideElement)
      },
      saveConfig() {
        Config.load(YAML.parse(this.config), this.styleOverride)
        this.reloadConfig()
      },
      getTitle() {
        return Config.root.title || null
      },
      showRunnerStatus() {
        return Config.root.showRunnerStatus
      }
    }
  }
</script>

<style lang="scss">
  :root {
    --background-color: #212121;
    --color: #dddddd;
    --font-family: Roboto, sans-serif;
    --background: url('../assets/backdrop.svg') no-repeat bottom;
  }

  html {
    background-color: var(--background-color);
    color: var(--color);
    font-family: var(--font-family);
  }

  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    min-height: 100vh;
    background: url('../assets/backdrop.svg') no-repeat bottom;
    background-size: contain;
  }

  svg {
    overflow: visible;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.15s
  }

  .fade-enter, .fade-leave-to {
    opacity: 0
  }

  button {
    padding: 8px;
    margin-right: 4px;
    background: #2e2e2e;
    border: 1px solid white;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
  }
</style>

<style lang="scss" scoped>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    flex-grow: 0;

    .content {
      flex-grow: 1;
      overflow-y: auto;
    }

    .title {
      text-align: center;
      margin-left: 8px;
      margin-right: 8px;
    }

    .projects {
      display: flex;
      flex-wrap: wrap;
      justify-content: left;
    }

    .loader {
      display: flex;
      justify-content: center;
      align-items: center;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--loading-overlay-color, rgba(#212121, 0.5));
      color: var(--loading-indicator-color, inherit);
    }

    .container {
      height: 100%;
      overflow-y: auto;
      padding: 0 16px 1em;
      background-color: rgba(0, 0, 0, 0.5);
    }

    .config {
      margin-bottom: 8px;
      min-height: 500px;
    }

    .configure {
      position: fixed;
      left: 0;
      bottom: 0;
      padding: 16px 16px;
      background-color: #161616;
      border-top-right-radius: 4px;
      border-top: 2px solid white;
      border-right: 2px solid white;
      opacity: 0;
      cursor: pointer;

      &:hover {
        opacity: 1;
      }
    }

    .error {
      color: red;
      font-weight: bold;
    }

    .warning {
      padding: 16px;
      margin-bottom: 16px;
      background: #C62828;
      line-height: 1.5;
      color: #fff;
      border-radius: 2px;

      a {
        color: #fff;
      }

      h2 {
        margin: 0 0 8px 0;
      }
    }
  }
</style>
