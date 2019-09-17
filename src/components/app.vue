<template>
  <div class="app">
    <div v-if="loaded && configured" :style="{zoom}">
      <h1 class="title" v-if="!!getTitle()">{{ getTitle() }}</h1>
      <div class="projects">
        <project-card
          v-for="project in sortedProjects"
          :key="project.id"
          :project-id="project.id"
          v-model="project.last_activity_at"
        />
      </div>
    </div>
    <div v-else-if="!configured" class="container">
      <h1>Configuration</h1>
      <p>
        Hi! Before you can use GitLab Monitor, it has to be configured.<br>
        Configuration is done by supplying YAML formatted configuration.<br>
        Your configuration is being persisted in this browser.
      </p>
      <textarea class="config" v-model="config"></textarea>
      <p class="error" v-if="!configIsValid">
        YAML is invalid!
      </p>
      <button :disabled="!configIsValid" @click="saveConfig">Save</button>
    </div>
    <div v-else class="loader">
      <octicon name="sync" spin scale="3" />
    </div>
    <div v-if="configured" class="configure" @click.prevent.stop="configured = false">
      Configure
    </div>
  </div>
</template>

<script>
  import Octicon from 'vue-octicon/components/Octicon'
  import Config from '../Config'
  import { configureApi } from '../GitLabApi'
  import ProjectCard from './project-card'
  import YAML from 'yaml'

  export default {
    components: {
      Octicon,
      ProjectCard
    },
    name: 'app',
    data: () => ({
      projects: [],
      zoom: 1,
      loaded: false,
      configured: false,
      config: ''
    }),
    computed: {
      sortedProjects() {
        return this.projects.sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
      },
      configIsValid() {
        try {
          YAML.parse(this.config)
        } catch (e) {
          return false
        }
        return true
      }
    },
    beforeMount() {
      this.reloadConfig()
    },
    beforeDestroy() {
      clearInterval(this.refreshIntervalId)
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
                    project.tag_list.length > 0 ||
                    !Config.root.filter.excludeUntagged
                  ) && (
                    project.tag_list.length === 0 ||
                    project.tag_list.some(tag => tag.match(new RegExp(Config.root.filter.includeTags)))
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

        if (this.$el.clientHeight > window.innerHeight) {
          step = -0.1
        }

        while (
          (step > 0 && this.$el.clientHeight <= window.innerHeight) ||
          (step < 0 && this.$el.clientHeight > window.innerHeight)
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
            clearInterval(this.refreshIntervalId)
          }

          this.refreshIntervalId = setInterval(async () => {
            if (!this.loading) {
              await this.fetchProjects()
            }
          }, 120000 * Config.root.pollingIntervalMultiplier)
        }

        this.configured = Config.isConfigured

        if (this.configured) {
          this.config = YAML.stringify(Config.local, null, 2)
        } else {
          this.config = YAML.stringify(require('../config.template'), null, 2)
        }
      },
      saveConfig() {
        Config.load(YAML.parse(this.config))
        this.reloadConfig()
      },
      getTitle() {
        return Config.root.title || null
      }
    }
  }
</script>

<style lang="scss">
  html {
    background-color: #212121;
    color: #dddddd;
    font-family: Roboto, sans-serif;
  }

  body {
    margin: 0;
    padding: 4px;
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
</style>

<style lang="scss" scoped>
  .app {
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
      background-color: transparentize(#212121, 0.5);
    }

    .container {
      padding: 0 16px;
      height: 100%;
    }

    .config {
      font-family: "Fira Code", "Fira Mono", "DejaVu Sans Mono", "Consolas", monospace;
      background: transparentize(black, 0.7);
      color: white;
      border: 1px solid gray;
      width: 100%;
      min-height: 300px;
      flex-grow: 1;
      margin-bottom: 8px;
    }

    .configure {
      position: fixed;
      bottom: 0;
      left: 0;
      padding: 16px 16px;
      background-color: #161616;
      border-top-right-radius: 3px;
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
  }
</style>
