<template>
  <div class="pipeline-view">
    <octicon v-if="loading" name="sync" scale="1.4" spin />

    <div v-else>
      <a
        v-if="showBranch"
        class="branch"
        target="_blank"
        rel="noopener noreferrer"
        :href="project.web_url + '/tree/' + pipeline.ref"
      >
        <octicon name="git-branch" scale="0.9" />
        {{ pipeline.ref }}
      </a>

      <div :class="['pipeline', {'with-stages-names': showStagesNames}]">
        <a
          class="pipeline-id-link"
          target="_blank"
          rel="noopener noreferrer"
          :href="project.web_url + '/pipelines/' + pipeline.id"
        >
          <gitlab-icon v-if="showPipelineIds" class="pipeline-icon" name="hashtag" size="12" />
          <div v-if="showPipelineIds" class="pipeline-id">{{ pipeline.id }}</div>
        </a>
        <div class="stages">
          <stage-view v-for="stage in stages" :key="stage.name" :stage="stage" :project="project" />
          <div class="skipped" v-if="pipeline.status === 'skipped'">
            <gitlab-icon class="pipeline-icon" name="status_skipped_borderless" size="24" />
            Pipeline skipped
          </div>
        </div>
        <gitlab-icon v-if="showDurations && duration !== null" class="clock-icon" name="clock" size="10" />
        <span v-if="showDurations && duration !== null" class="duration">{{ durationString }}</span>
        <gitlab-icon v-if="showUsers && duration !== null" class="user-icon" name="user" size="10" />
        <span v-if="showUsers && pipeline.user !== null" class="user">{{ pipeline.user.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import Octicon from 'vue-octicon/components/Octicon'
  import 'vue-octicon/icons/sync'
  import Config from '../Config'
  import GitlabIcon from './gitlab-icon'
  import StageView from './stage-view'

  export default {
    components: {
      GitlabIcon,
      Octicon,
      StageView
    },
    name: 'pipeline-view',
    props: ['pipeline', 'project', 'showBranch'],
    data: () => ({
      jobs: [],
      loading: true,
      duration: null,
      updatedAt: null
    }),
    computed: {
      showPipelineIds() {
        return Config.root.showPipelineIds
      },
      showDurations() {
        return (Config.root.showDurations) &&
          (
            this.pipeline.status === 'running' ||
            this.pipeline.status === 'failed' ||
            this.pipeline.status === 'canceled' ||
            this.pipeline.status === 'success'
          )
      },
      showUsers() {
        return Config.root.showUsers
      },
      showStagesNames() {
        return Config.root.showStagesNames;
      },
      durationString() {
        const duration = this.duration
        const hrs = ~~(duration / 3600)
        const mins = ~~((duration % 3600) / 60)
        const secs = Math.trunc(duration % 60)

        // Output like "1:01" or "4:03:59" or "123:03:59"
        let timeString = ''

        if (hrs > 0) {
          timeString += '' + hrs + ':' + (mins < 10 ? '0' : '')
        }

        timeString += mins + ':' + (secs < 10 ? '0' : '')
        timeString += secs

        return timeString
      }
    },
    mounted() {
      this.fetchJobs()
      this.setupDurationCounter()
    },
    watch: {
      pipeline() {
        this.fetchJobs()
        this.$nextTick(() => this.setupDurationCounter())
      },
      'pipeline.status'() {
        this.$nextTick(() => this.setupDurationCounter())
      }
    },
    methods: {
      async fetchJobs() {
        this.jobs = await this.$api(`/projects/${this.project.id}/pipelines/${this.pipeline.id}/jobs?per_page=50`)
        this.stages = this.jobs.reduce(function(stages, job) {
          const stage_name = job["stage"]
          var stage_id = stages.findIndex(s => s["name"] === stage_name)
          if (!~stage_id) {
            stage_id = stages.length;
            stages.push({"name": stage_name, "jobs": []});
          }
          stages[stage_id]["jobs"].push(job)
          return stages
        }, [])
        this.loading = false
      },
      setupDurationCounter() {
        const pipeline = this.pipeline

        const startedAtDiffSeconds = ((pipeline.finished_at !== null ? new Date(pipeline.finished_at) : new Date()) - new Date(pipeline.started_at !== null ? pipeline.started_at : pipeline.created_at)) / 1000

        if (pipeline.status !== 'running' && pipeline.duration !== null && (this.duration === null || Math.abs(pipeline.duration - this.duration) > 5)) {
          this.duration = pipeline.duration
        } else if (this.duration === null || pipeline.updated_at !== this.updatedAt || Math.abs(startedAtDiffSeconds - this.updatedAt) > 5) {
          // Update the duration if the started_at property changed or the timer is >5 seconds off
          this.duration = startedAtDiffSeconds
          this.updatedAt = pipeline.updated_at
        }

        if (this.pipeline && this.pipeline.status === 'running') {
          if (!this.durationCounterIntervalId) {
            this.durationCounterIntervalId = setInterval(() => {
              this.duration++
            }, 1000)
          }
        } else {
          if (this.durationCounterIntervalId) {
            clearInterval(this.durationCounterIntervalId)
            this.durationCounterIntervalId = null
          }
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  .pipeline-view {
    &:not(:last-child) {
      margin-bottom: 4px;
    }

    .branch {
      color: rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      font-size: 14px;
      padding: 0 0 2px 0;
      text-decoration: none;

      .octicon {
        margin-right: 4px;
      }
    }

    .pipeline {
      display: flex;
      align-items: center;
      color: white;
      height: 30px;

      &.with-stages-names {
        padding-bottom: 20px;
      }

      .pipeline-id-link {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
      }

      .pipeline-icon {
        width: 16px;
        height: 16px;
        margin-right: 1px;
        color: rgba(255, 255, 255, 0.8);
      }

      .pipeline-id {
        margin-right: 8px;
        color: rgba(255, 255, 255, 0.8);
      }

      .stages {
        white-space: nowrap;
        margin-right: 8px;
        align-self: start;
      }

      .clock-icon {
        margin-right: 3px;
        color: rgba(255, 255, 255, 0.5);
      }

      .duration {
        color: rgba(255, 255, 255, 0.8);
        line-height: 1;
        font-size: 14px;
        margin-right: 6px;
      }

      .user-icon {
        margin-right: 3px;
        color: rgba(255, 255, 255, 0.5);
      }

      .user {
        color: rgba(255, 255, 255, 0.8);
        line-height: 1;
        font-size: 12px;
      }

      .skipped {
        display: flex;
        align-items: center;
        border: 2px solid white;
        padding: 1px 9px 1px 1px;
        border-radius: 8px;
        font-size: smaller;
      }
    }
  }
</style>
