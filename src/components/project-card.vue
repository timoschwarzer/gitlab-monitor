<template>
  <div v-if="showPipelinesOnly ? (pipelineCount > 0) : true" :class="['project-card', status]">
    <div class="content">
      <div class="title small">{{ project !== null ? project.namespace.name : '...' }} /</div>
      <a class="title" target="_blank" rel="noopener noreferrer" :href="project !== null ? project.web_url : '#'">
        {{ project !== null ? project.name : 'Loading project...' }}
      </a>
      <div class="pipeline-container">
        <em v-if="pipelines !== null && pipelineCount === 0" class="no-pipelines">
          No recent pipelines
        </em>
        <div v-else-if="pipelines !== null">
          <template v-for="refName in refNames">
            <div v-for="(pipeline, index) in pipelines[refName]" :key="pipeline.id">
              <pipeline-view :pipeline="pipeline" :project="project" :show-branch="index === 0" />
            </div>
          </template>
        </div>
        <octicon v-else name="sync" scale="1.4" spin />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="info">
      <div class="badge-container">
        <a target="_blank" rel="noopener noreferrer" v-for="badge in badges" :href="badge.link_url">
          <img :key="badge.id" :src="badge.rendered_image_url" alt="badge image"/>
        </a>
      </div>
      <div class="spacer"></div>
      <gitlab-icon class="calendar-icon" name="calendar" size="12" />
      <timeago v-if="project !== null" :datetime="project.last_activity_at" :auto-update="1" />
      <time v-else>...</time>
    </div>
  </div>
</template>

<script>
  import Octicon from 'vue-octicon/components/Octicon'
  import 'vue-octicon/icons/clock'
  import 'vue-octicon/icons/git-branch'
  import 'vue-octicon/icons/sync'
  import Config from '../Config'
  import GitlabIcon from './gitlab-icon'
  import PipelineView from './pipeline-view'
  import merge from 'deepmerge'

  export default {
    components: {
      GitlabIcon,
      PipelineView,
      Octicon
    },
    name: 'project-card',
    props: ['project-id', 'gitlabApi', 'privateToken'],
    data: () => ({
      project: null,
      pipelines: null,
      pipelineCount: 0,
      refNames: [],
      badges: [],
      status: '',
      loading: false,
      refreshInterval: null,
      alertSoundPlayedForPipelines: []
    }),
    computed: {
      showMerged() {
        return this.config.showMerged
      },
      showTags() {
        return this.config.showTags
      },
      showPipelinesOnly() {
        return Config.root.pipelinesOnly
      },
      config() {
        let config = Config.root.projectConfig['*']

        if (Config.root.projectConfig.hasOwnProperty(this.project.path_with_namespace)) {
          config = merge(config, Config.root.projectConfig[this.project.path_with_namespace])
        }

        return config
      }
    },
    mounted() {
      this.fetchProject()
    },
    beforeDestroy() {
      if (this.refreshIntervalId) clearInterval(this.refreshIntervalId)
    },
    watch: {
      project() {
        this.fetchPipelines()
        if (Config.root.badges) this.fetchBadges()
      },
      pipelines: {
        deep: true,
        handler(pipelines) {
          if (!this.project) {
            this.status = ''
            this.refreshInterval = 60000
            return
          }

          // Set project status
          const configuredDefaultBranch = this.config.default || this.project.default_branch

          if (
            pipelines &&
            this.project &&
            !!pipelines[configuredDefaultBranch] &&
            pipelines[configuredDefaultBranch].length > 0
          ) {
            this.status = pipelines[configuredDefaultBranch][0].status

            switch (pipelines[configuredDefaultBranch][0].status) {
              case 'pending':
              case 'running':
                this.refreshInterval = 5000
                break
              default:
                this.refreshInterval = 15000
            }
          } else {
            this.status = ''
            this.refreshInterval = 60000
          }

          // Process alert sounds
          if (pipelines && this.project && this.config.soundAlerts.soundUrl !== null) {
            const pipelinesWithSoundAlertsEnabled = Object.keys(pipelines).filter(branchName => {
              return !!branchName.match(new RegExp(this.config.soundAlerts.include)) &&
                (!this.config.soundAlerts.exclude || !branchName.match(new RegExp(this.config.soundAlerts.exclude)))
            })

            let alert = false
            for (const branch of pipelinesWithSoundAlertsEnabled) {
              const newFailedPipelines = pipelines[branch].filter(p => p.status === 'failed' && !this.alertSoundPlayedForPipelines.includes(p.id))
              for (const pipeline of newFailedPipelines) {
                this.alertSoundPlayedForPipelines.push(pipeline.id)
                alert = true
              }
            }

            if (alert) {
              this.playSound(this.config.soundAlerts.soundUrl)
            }
          }
        }
      },
      refreshInterval(newInterval, oldInterval) {
        if (newInterval !== oldInterval) {
          if (this.refreshIntervalId) clearInterval(this.refreshIntervalId)
          this.refreshIntervalId = setInterval(() => {
            if (!this.loading) {
              this.fetchProject()
            }
          }, newInterval * Config.root.pollingIntervalMultiplier)
        }
      }
    },
    methods: {
      async playSound(sound) {
        let audio = await new Audio(sound)
        let playPromise = await audio.play();
        if (playPromise !== undefined) {
          playPromise.then(async _ => {
            await audio.pause();
            await audio.play();
          })
          .catch(error => {
            console.log(error)
          });
        }
      },
      async fetchProject() {
        this.loading = true

        this.project = await this.$api(`${this.gitlabApi}`, `${this.privateToken}`, `/projects/${this.projectId}`)
        this.project.gitlabApi = this.gitlabApi;
        this.project.privateToken = this.privateToken;
        this.$emit('input', this.project.last_activity_at)

        this.loading = false
      },
      async fetchPipelines() {
        this.loading = true

        const maxAge = Config.root.maxAge
        const showMerged = this.showMerged
        const showTags = this.showTags
        const fetchCount = Config.root.fetchCount

        const branches = await this.$api(`${this.gitlabApi}`, `${this.privateToken}`,`/projects/${this.projectId}/repository/branches`, {
          per_page: fetchCount > 100 ? 100 : fetchCount
        }, { follow_next_page_links: fetchCount > 100 })
        const branchNames = branches.filter(branch => showMerged ? true : !branch.merged)
          .sort((a, b) => new Date(b.commit.committed_date).getTime() - new Date(a.commit.committed_date).getTime()).reverse()
          .map(branch => branch.name)
          .filter(branchName => {
            return !!branchName.match(new RegExp(this.config.include)) &&
              (!this.config.exclude || !branchName.match(new RegExp(this.config.exclude)))
          })
        let tags = []
        if (showTags) {
          tags = await this.$api(`${this.gitlabApi}`, `${this.privateToken}`,`/projects/${this.projectId}/repository/tags`, {
            per_page: fetchCount > 100 ? 100 : fetchCount
          }, { follow_next_page_links: fetchCount > 100 })
        }
        const tagNames = tags.map((tag) => tag.name)
        const newPipelines = {}
        let count = 0
        const refNames = branchNames.concat(tagNames)

        let hideSkippedPipelines = Config.root.projectConfig['*'].hideSkippedPipelines
        if (Config.root.projectConfig.hasOwnProperty(this.project.path_with_namespace)) {
          hideSkippedPipelines = Config.root.projectConfig[this.project.path_with_namespace].hideSkippedPipelines
        }

        refLoop:
        for (const refName of refNames) {
          const pipelines = await this.$api(`${this.gitlabApi}`, `${this.privateToken}`,`/projects/${this.projectId}/pipelines`, {
            ref: refName,
            per_page: fetchCount > 100 ? 100 : fetchCount
          }, { follow_next_page_links: fetchCount > 100 })

          const resolvedPipelines = []

          if (pipelines.length > 0) {
            const filteredPipelines = []

            for (const pipeline of pipelines) {
              if (pipeline.status === 'pending' || pipeline.status === 'running') {
                filteredPipelines.push(pipeline)
              }
            }

            for (const pipeline of filteredPipelines) {
              const resolvedPipeline = await this.$api(`${this.gitlabApi}`, `${this.privateToken}`,`/projects/${this.projectId}/pipelines/${pipeline.id}`)
              if (
                (maxAge === 0 ||
                  ((new Date() - new Date(resolvedPipeline.updated_at)) / 1000 / 60 / 60 <= maxAge)
                ) && (
                  !hideSkippedPipelines ||
                  resolvedPipeline.status !== 'skipped'
                )
              ) {
                resolvedPipelines.push(resolvedPipeline)
              }
            }

            if (pipelines.length >= 1 && filteredPipelines.length === 0) {
              for (let i = 0; i < pipelines.length; i++) {
                const resolvedPipeline = await this.$api(`${this.gitlabApi}`, `${this.privateToken}`,`/projects/${this.projectId}/pipelines/${pipelines[i].id}`)
                if (
                  (maxAge === 0 ||
                    ((new Date() - new Date(resolvedPipeline.updated_at)) / 1000 / 60 / 60 <= maxAge)
                  ) && (
                    !hideSkippedPipelines ||
                    resolvedPipeline.status !== 'skipped'
                  )
                ) {
                  newPipelines[refName] = [resolvedPipeline]
                  count++
                  break
                }
              }
            } else {
              newPipelines[refName] = []

              for (const resolvedPipeline of resolvedPipelines) {
                if (
                  !hideSkippedPipelines ||
                  resolvedPipeline.status !== 'skipped'
                ) {
                  newPipelines[refName].push(resolvedPipeline)
                  count++
                }

                if (this.config.maxPipelines !== 0 && count >= this.config.maxPipelines) {
                  break refLoop
                }
              }
            }

            if (this.config.maxPipelines !== 0 && count >= this.config.maxPipelines) {
              break
            }
          }
        }

        this.pipelines = newPipelines
        this.refNames = refNames
        this.pipelineCount = count
        this.loading = false
      },
      async fetchBadges() {
        this.badges = await this.$api(`${this.gitlabApi}`, `${this.privateToken}`,`/projects/${this.projectId}/badges`)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .project-card {
    margin: 4px;
    border-radius: 3px;
    background-color: #424242;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    transition: background-color 200ms;

    &.success {
      background-color: #2E7D32;
    }

    &.running {
      background-color: #1565C0;
    }

    &.pending {
      background-color: #A93F00;
    }

    &.failed {
      background-color: #C62828;
    }

    &.canceled {
      background-color: #010101;
    }

    &.skipped {
      background-color: #4b4b4b;
    }

    .content {
      padding: 12px;

      .title {
        white-space: nowrap;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 1.5px 1.5px rgba(0, 0, 0, 0.4);
        text-decoration: none;
        color: inherit;

        &.small {
          font-size: 12px;
          line-height: 0.6;
        }
      }

      .pipeline-container {
        padding: 8px 0 0 0;
      }

      .no-pipelines {
        color: rgba(255, 255, 255, 0.5);
        font-size: 10px;
      }
    }

    .spacer {
      flex-grow: 1;
    }

    .info {
      padding: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.3);

      time {
        line-height: 1;
      }

      .calendar-icon {
        margin-right: 4px;
      }
    }

    .badge-container {
      max-width:80%;

      a {
        margin-right: 8px;
        transition: background-color 100ms, color 100ms, border 100ms;

        img {
          opacity: 0.9;

          &:hover {
            opacity: 1;
          }
        }
      }
    }
  }
</style>
