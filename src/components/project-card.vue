<template>
  <div v-if="(showPipelinesOnly ? (pipelineCount > 0) : true) && showProjectOnlyOn" :class="['project-card', status]">
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
        <octicon v-else class="spinner-icon" name="sync" scale="1.4" spin />
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
  import 'vue-octicon/icons/git-pull-request'
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
    props: ['project-id'],
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
      showLatestTagOnly() {
        return this.config.showLatestTagOnly
      },
      showDetached() {
        return this.config.showDetached
      },
      showLabels() {
        return this.config.showLabels
      },
      showProjectOnlyOn() {
        const showProjectOnlyOn = Config.root.showProjectOnlyOn
        if (showProjectOnlyOn && showProjectOnlyOn.length) {
            return showProjectOnlyOn.includes(this.status)
        }
        return true
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

        this.project = await this.$api(`/projects/${this.projectId}`)
        this.$emit('input', this.project.last_activity_at)

        this.loading = false
      },
      async fetchPipelines() {
        this.loading = true

        const maxAge = Config.root.maxAge
        const showTestReport = Config.root.showTestReport
        const showMerged = this.showMerged
        const showTags = this.showTags
        const showLatestTagOnly = this.showLatestTagOnly
        const showDetached = this.showDetached
        const showLabels = this.showLabels
        const fetchCount = Config.root.fetchCount

        let refNamesAdditional = {}

        const branches = await this.$api(`/projects/${this.projectId}/repository/branches`, {
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
          if (showLatestTagOnly) {
            tags = await this.$api(`/projects/${this.projectId}/repository/tags`)
            tags = tags.slice(0, 1)
          } else {
            tags = await this.$api(`/projects/${this.projectId}/repository/tags`, {
              per_page: fetchCount > 100 ? 100 : fetchCount
            }, { follow_next_page_links: fetchCount > 100 })
          }
        }
        const tagNames = tags.map((tag) => tag.name)
        const detached = []
        if (showDetached) {
          const mergeRequests = await this.$api(`/projects/${this.projectId}/merge_requests`, {
            state: 'opened',
            per_page: fetchCount > 100 ? 100 : fetchCount
          }, { follow_next_page_links: fetchCount > 100 })
          for (const mergeRequest of mergeRequests) {
            const mrPipelines = await this.$api(`/projects/${this.projectId}/merge_requests/${mergeRequest.iid}/pipelines`)
            if (mrPipelines.length > 0) {
              const mrPipelineRef = mrPipelines[0].ref
              detached.push(mrPipelineRef)
              refNamesAdditional[mrPipelineRef] = {title: mergeRequest.title}
              if (showLabels && mergeRequest.labels.length) {
                refNamesAdditional[mrPipelineRef].labels = mergeRequest.labels
              }
            }
          }
        }
        const newPipelines = {}
        let count = 0
        const refNames = branchNames.concat(tagNames, detached)
        const hideSkippedPipelines = Config.getProjectProperty('hideSkippedPipelines', this.project.path_with_namespace)
        const hideSuccessfulPipelines = Config.getProjectProperty('hideSuccessfulPipelines', this.project.path_with_namespace)

        refLoop:
        for (const refName of refNames) {
          const pipelines = await this.$api(`/projects/${this.projectId}/pipelines`, {
            ref: refName,
            per_page: fetchCount > 100 ? 100 : fetchCount
          }, { follow_next_page_links: fetchCount > 100 })

          const resolvedPipelines = []

          if (pipelines.length > 0) {
            const activePipelines = []

            for (const pipeline of pipelines) {
              if (pipeline.status === 'pending' || pipeline.status === 'running') {
                activePipelines.push(pipeline)
              }
            }

            for (const pipeline of activePipelines) {
              const resolvedPipeline = await this.$api(`/projects/${this.projectId}/pipelines/${pipeline.id}`)
              if (
                (maxAge === 0 ||
                  ((new Date() - new Date(resolvedPipeline.updated_at)) / 1000 / 60 / 60 <= maxAge)
                ) && (
                  !hideSkippedPipelines ||
                  resolvedPipeline.status !== 'skipped'
                ) && (
                  !hideSuccessfulPipelines ||
                  resolvedPipeline.status !== 'success'
                )
              ) {
                resolvedPipelines.push(resolvedPipeline)
              }
            }

            const historyCount = Config.getProjectProperty('historyCount', this.project.path_with_namespace)

            newPipelines[refName] = []

            for (const resolvedPipeline of resolvedPipelines) {
              if (
                (!hideSkippedPipelines ||
                resolvedPipeline.status !== 'skipped'
                ) && (
                !hideSuccessfulPipelines ||
                resolvedPipeline.status !== 'success'
                )
              ) {
                resolvedPipeline.additional = refNamesAdditional[refName]

                newPipelines[refName].push(resolvedPipeline)
                count++
              }

              if (count >= historyCount) {
                break refLoop
              }
            }

            for (let i = newPipelines[refName].length; (i < historyCount) && (i < pipelines.length); i++) {
              const resolvedPipeline = await this.$api(`/projects/${this.projectId}/pipelines/${pipelines[i].id}`)
              if (
                (maxAge === 0 ||
                  ((new Date() - new Date(resolvedPipeline.updated_at)) / 1000 / 60 / 60 <= maxAge)
                ) && (
                  !hideSkippedPipelines ||
                  resolvedPipeline.status !== 'skipped'
                ) && (
                  !hideSuccessfulPipelines ||
                  resolvedPipeline.status !== 'success'
                )
              ) {
                resolvedPipeline['test_report'] = null
                if (showTestReport) {
                  const testReport = await this.$api(`/projects/${this.projectId}/pipelines/${pipelines[i].id}/test_report`)
                  resolvedPipeline['test_report'] = testReport
                }

                resolvedPipeline.additional = refNamesAdditional[refName]

                newPipelines[refName].push(resolvedPipeline)
                count++

                if (count >= historyCount) {
                  break
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
        this.badges = await this.$api(`/projects/${this.projectId}/badges`)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .project-card {
    --project-card-status-color: var(--project-default, #424242);

    margin: 4px;
    border-radius: 3px;
    background-color: var(--project-card-status-color, rgba(#424242, var(--project-card-opacity)));
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    transition: background-color 200ms;

    &.success {
      --project-card-status-color: var(--project-success, #2E7D32);
    }

    &.running {
      --project-card-status-color: var(--project-running, #1565C0);
    }

    &.pending {
      --project-card-status-color: var(--project-pending, #A93F00);
    }

    &.failed {
      --project-card-status-color: var(--project-failed, #C62828);
    }

    &.canceled {
      --project-card-status-color: var(--project-canceled, #010101);
    }

    &.skipped {
      --project-card-status-color: var(--project-skipped, #4b4b4b);
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

      .spinner-icon {
        color: var(--project-spinner-color, inherit);
      }

      .no-pipelines {
        color: var(--project-no-pipelines, rgba(255, 255, 255, 0.5));
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
      color: var(--project-info-color, rgba(255, 255, 255, 0.3));

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
