<template>
  <div class="pipeline-view">
    <octicon v-if="loading" name="sync" scale="1.4" spin />
    <div class="pipeline" v-else>
      <gitlab-icon v-if="showPipelineIds" class="pipeline-icon" name="hashtag" size="12" />
      <div v-if="showPipelineIds" class="pipeline-id">{{ pipeline.id }}</div>
      <div class="jobs">
        <job-view v-for="job in jobs" :key="job.id" :job="job" :project="project" />
      </div>
      <gitlab-icon v-if="showDurations && duration !== null" class="clock-icon" name="clock" size="10" />
      <span v-if="showDurations && duration !== null" class="duration">{{ durationString }}</span>
      <gitlab-icon v-if="showUsers && duration !== null" class="user-icon" name="user" size="10" />
      <span v-if="showUsers" class="user">{{ pipeline.user.name }}</span>
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
      createdAt: null
    }),
    computed: {
      showPipelineIds() {
        return getQueryParameter('showPipelineIds') !== null ? !!getQueryParameter('showPipelineIds') : true;
      },
      showDurations() {
        return getQueryParameter('showDurations') !== null ? !!getQueryParameter('showDurations') : true;
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

      this.$data.duration = this.$props.pipeline.duration || (new Date() - new Date(this.$props.pipeline.created_at)) / 1000;
      this.$data.createdAt = this.$props.pipeline.created_at;
      this.setupDurationCounter();
    },
    watch: {
      pipeline(pipeline) {
        this.fetchJobs();
        this.setupDurationCounter();

        const createdAtDiffSeconds = (new Date() - new Date(this.$props.pipeline.created_at)) / 1000;

        if (pipeline.duration && Math.abs(pipeline.duration - this.$data.duration) > 5) {
          this.$data.duration = pipeline.duration;
        } else if (pipeline.created_at !== this.$data.createdAt || Math.abs(createdAtDiffSeconds - this.$data.createdAt) > 5) {
          // Update the duration if the created_at property changed or the timer is >5 seconds off
          this.$data.duration = createdAtDiffSeconds;
          this.$data.createdAt = pipeline.created_at;
        }
      }
    },
    methods: {
      async fetchJobs() {
        this.$data.jobs = await this.$api(`/projects/${this.$props.project.id}/pipelines/${this.$props.pipeline.id}/jobs`);
        this.$data.loading = false;
      },
      setupDurationCounter() {
        if (this.$props.pipeline && this.$props.pipeline.status === 'running') {
          if (!this.durationCounterIntervalId) {
            this.durationCounterIntervalId = setInterval(() => {
              this.$data.duration++;
            }, 1000);
          }
        } else {
          if (this.durationCounterIntervalId) clearInterval(this.durationCounterIntervalId);
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

    .pipeline {
      display: flex;
      align-items: center;
      color: white;

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
