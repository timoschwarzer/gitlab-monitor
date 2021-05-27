<template>
  <div class="pipeline-view">
    <octicon v-if="loading" class="spinner-icon" name="sync" scale="1.4" spin />

    <div v-else>
      <a
        v-if="showBranch"
        class="branch"
        target="_blank"
        rel="noopener noreferrer"
        :href="project.web_url + (!pipeline.ref.includes('merge-request') ?  '/tree/' + pipeline.ref : '/-/merge_requests' + '/' + pipeline.ref.match(/\d+/))"
      >
        <octicon :name="!pipeline.ref.includes('merge-request') ? 'git-branch' : 'git-pull-request'" scale="0.9" />
        {{ pipeline.ref }} <span v-if="pipeline.additional"> – {{ pipeline.additional.title }}</span>
      </a>

      <div :class="['pipeline', {'with-stages-names': showStagesNames, 'is-skipped': pipeline.status === 'skipped'}]">
        <a
          class="pipeline-id-link"
          target="_blank"
          rel="noopener noreferrer"
          :href="pipeline.web_url"
        >
          <gitlab-icon v-if="showPipelineIds" class="pipeline-icon" name="hashtag" size="12" />
          <div v-if="showPipelineIds" class="pipeline-id">{{ pipeline.id }}</div>
        </a>
        <div class="stages">
          <div class="skipped" v-if="pipeline.status === 'skipped'">
            <gitlab-icon class="pipeline-icon" name="status_skipped_borderless" size="24" />
            Pipeline skipped
          </div>
          <stage-view v-else v-for="stage in stages" :key="stage.name" :stage="stage" :project="project" />
        </div>
        <gitlab-icon v-if="showDurations && duration !== null" class="clock-icon" name="clock" size="10" />
        <span v-if="showDurations && duration !== null" class="duration">{{ durationString }}</span>
        <gitlab-icon v-if="showCoverage && pipeline.coverage !== null" class="chart-icon" name="chart" size="10" />
        <span v-if="showCoverage && pipeline.coverage !== null" class="coverage">{{ pipeline.coverage + '%' }}</span>
        <gitlab-icon v-if="showUsers && duration !== null" class="user-icon" name="user" size="10" />
        <span v-if="showUsers && pipeline.user !== null" class="user">{{ pipeline.user.name }}</span>
      </div>
    </div>
    <test-report v-if="showTestReport && pipeline.test_report !== null" :pipeline="pipeline" />
  </div>
</template>

<script>
  import Octicon from 'vue-octicon/components/Octicon'
  import 'vue-octicon/icons/sync'
  import Config from '../Config'
  import GitlabIcon from './gitlab-icon'
  import StageView from './stage-view'
  import TestReport from './test-report'

  export default {
    components: {
      GitlabIcon,
      Octicon,
      StageView,
      TestReport
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
      showCoverage() {
        return Config.root.showCoverage
      },
      showUsers() {
        return Config.root.showUsers
      },
      showStagesNames() {
        return Config.root.showStagesNames;
      },
      showTestReport() {
        return Config.root.showTestReport
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
      },
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
      },
    },
    methods: {
      async fetchJobs() {
        this.jobs = await this.$api(`/projects/${this.project.id}/pipelines/${this.pipeline.id}/jobs?per_page=50`)
        this.jobs.sort((j1, j2) => j1.id - j2.id);

        if (!Config.root.showRestartedJobs) {
          this.excludeRestartedJobs();
        }
        this.stages = this.jobs.reduce(function(stages, job) {
          const stage_name = job["stage"]
          let stage_id = stages.findIndex(s => s["name"] === stage_name)
          if (!~stage_id) {
            stage_id = stages.length;
            stages.push({"name": stage_name, "jobs": []});
          }
          stages[stage_id]["jobs"].push(job)
          return stages
        }, [])
        this.loading = false
      },
      excludeRestartedJobs() {
        // Job restarts appear at the end of the list and break pipeline view.
        // We sort jobs to place restarts on the positions of the restarted ones.
        // This array contains list of jobs names as they was originally enqueued.
        const jobs_order = [];

        // This dictionary contains id of the latest job for each job name
        const jobs_id_by_name = {};

        for (let job of this.jobs) {
          jobs_id_by_name[job["name"]] = job["id"];
          if (!~jobs_order.indexOf(job["name"])) {
            jobs_order.push(job["name"]);
          }
        }

        // Skip filtering and sorting if there is no restarted jobs
        if (this.jobs.length === jobs_order.length) {
          return;
        }

        this.jobs = this.jobs.filter(job => jobs_id_by_name[job["name"]] === job["id"]);
        this.jobs = this.jobs.sort((j1, j2) => (jobs_order.indexOf(j1["name"]) - jobs_order.indexOf(j2["name"])));
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
        } else if (this.durationCounterIntervalId) {
          clearInterval(this.durationCounterIntervalId)
          this.durationCounterIntervalId = null
        }
      },
    }
  }
</script>

<style lang="scss" scoped>
  .pipeline-view {
    &:not(:last-child) {
      margin-bottom: 4px;
    }

    .spinner-icon {
      color: var(--project-spinner-color, inherit);
    }

    .branch {
      color: var(--pipeline-branch, rgba(255, 255, 255, 0.5));
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
      margin-bottom: 4px;

      &.with-stages-names {
        padding-bottom: 20px;
      }

      .pipeline-id-link {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
      }

      .pipeline-icon {
        width: var(--job-icon-size, 16px);
        height: var(--job-icon-size, 16px);
        margin-right: 1px;
        color: var(--pipeline-hashtag, rgba(255, 255, 255, 0.8));
      }

      .pipeline-id {
        margin-right: 8px;
        color: var(--pipeline-id, rgba(255, 255, 255, 0.8));
      }

      .stages {
        white-space: nowrap;
        margin-right: 8px;
        align-self: start;
      }

      .clock-icon {
        margin-right: 3px;
        color: var(--pipeline-clock-icon, rgba(255, 255, 255, 0.5));
      }

      .duration {
        color: var(--pipeline-duration, rgba(255, 255, 255, 0.8));
        line-height: 1;
        font-size: 14px;
        margin-right: 6px;
      }

      .user-icon {
        margin-right: 3px;
        color: var(--pipeline-user-icon, rgba(255, 255, 255, 0.5));
      }

      .user {
        color: var(--pipeline-user, rgba(255, 255, 255, 0.8));
        line-height: 1;
        font-size: 12px;
      }

      .coverage {
        color: var(--pipeline-duration, rgba(255, 255, 255, 0.8));
        line-height: 1;
        font-size: 14px;
        margin-right: 6px;
      }

      .chart-icon {
        margin-right: 3px;
        color: var(--pipeline-chart-icon, rgba(255, 255, 255, 0.5));
      }

      .skipped {
        color: inherit;
        display: flex;
        align-items: center;
        border: 2px solid var(--job-border-color, white);
        padding: 1px 9px 1px 1px;
        border-radius: 8px;
        font-size: smaller;
        line-height: var(--job-icon-size, inherit);
      }
    }
  }
</style>
