<template>
  <div class="pipeline-view">
    <octicon v-if="loading" name="sync" scale="1.4" spin />

    <div v-else>
      <a class="branch" target="_blank" rel="noopener noreferrer" :href="project.web_url + '/tree/' + pipeline.ref">
        <octicon name="git-branch" scale="0.9" />
        {{ pipeline.ref }}
      </a>

      <div class="pipeline">
       <a class="pipeline-id-link" target="_blank" rel="noopener noreferrer" :href="project.web_url + '/pipelines/' + pipeline.id">
          <gitlab-icon v-if="showPipelineIds" class="pipeline-icon" name="hashtag" size="12" />
        <div v-if="showPipelineIds" class="pipeline-id">{{ pipeline.id }}</div>
       </a>
        <div class="jobs">
          <job-view v-for="job in jobs" :key="job.id" :job="job" :project="project" />
        </div>
        <gitlab-icon v-if="showDurations && duration !== null" class="clock-icon" name="clock" size="10" />
        <span v-if="showDurations && duration !== null" class="duration">{{ durationString }}</span>
        <gitlab-icon v-if="showUsers && duration !== null" class="user-icon" name="user" size="10" />
        <span v-if="showUsers" class="user">{{ pipeline.user.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import Octicon             from 'vue-octicon/components/Octicon';
  import {getQueryParameter} from '../util';
  import GitlabIcon          from './gitlab-icon';
  import JobView             from './job-view';
  import 'vue-octicon/icons/sync';

  export default {
    components: {
      GitlabIcon,
      Octicon,
      JobView
    },
    name: 'pipeline-view',
    props: ['pipeline', 'project'],
    data: () => ({
      jobs: [],
      loading: true,
      duration: null,
      updatedAt: null
    }),
    computed: {
      showPipelineIds() {
        return getQueryParameter('showPipelineIds') !== null ? !!getQueryParameter('showPipelineIds') : true;
      },
      showDurations() {
        return (getQueryParameter('showDurations') !== null ? !!getQueryParameter('showDurations') : true) &&
          (
            this.$props.pipeline.status === 'running' ||
            this.$props.pipeline.status === 'failed' ||
            this.$props.pipeline.status === 'canceled' ||
            this.$props.pipeline.status === 'success'
          );
      },
      showUsers() {
        return getQueryParameter('showUsers') !== null ? !!getQueryParameter('showUsers') : false;
      },
      durationString() {
        const duration = this.$data.duration;
        const hrs = ~~(duration / 3600);
        const mins = ~~((duration % 3600) / 60);
        const secs = Math.trunc(duration % 60);

        // Output like "1:01" or "4:03:59" or "123:03:59"
        let timeString = "";

        if (hrs > 0) {
          timeString += "" + hrs + ":" + (mins < 10 ? "0" : "");
        }

        timeString += mins + ":" + (secs < 10 ? "0" : "");
        timeString += secs;

        return timeString;
      }
    },
    mounted() {
      this.fetchJobs();
      this.setupDurationCounter();
    },
    watch: {
      pipeline() {
        this.fetchJobs();
        this.$nextTick(() => this.setupDurationCounter());
      },
      'pipeline.status'() {
        this.$nextTick(() => this.setupDurationCounter());
      }
    },
    methods: {
      async fetchJobs() {
        this.$data.jobs = await this.$api(`/projects/${this.$props.project.id}/repository/commits/${this.$props.pipeline.sha}/statuses`);
        this.$data.loading = false;
      },
      setupDurationCounter() {
        const pipeline = this.$props.pipeline;

        const startedAtDiffSeconds = ((pipeline.finished_at !== null ? new Date(pipeline.finished_at) : new Date()) - new Date(pipeline.started_at !== null ? pipeline.started_at : pipeline.created_at)) / 1000;

        if (pipeline.status !== 'running' && pipeline.duration !== null && (this.$data.duration === null || Math.abs(pipeline.duration - this.$data.duration) > 5)) {
          this.$data.duration = pipeline.duration;
        } else if (this.$data.duration === null || pipeline.updated_at !== this.$data.updatedAt || Math.abs(startedAtDiffSeconds - this.$data.updatedAt) > 5) {
          // Update the duration if the started_at property changed or the timer is >5 seconds off
          this.$data.duration = startedAtDiffSeconds;
          this.$data.updatedAt = pipeline.updated_at;
        }

        if (this.$props.pipeline && this.$props.pipeline.status === 'running') {
          if (!this.durationCounterIntervalId) {
            this.durationCounterIntervalId = setInterval(() => {
              this.$data.duration++;
            }, 1000);
          }
        } else {
          if (this.durationCounterIntervalId) {
            clearInterval(this.durationCounterIntervalId);
            this.durationCounterIntervalId = null;
          }
        }
      }
    }
  };
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

      .jobs {
        white-space: nowrap;
        margin-right: 8px;
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
    }
  }
</style>
