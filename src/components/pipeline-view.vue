<template>
  <div class="pipeline-view">
    <octicon v-if="loading" name="sync" scale="1.4" spin />
    <div class="jobs" v-else>
      <gitlab-icon v-if="!hidePipelineIds" class="pipeline-icon" name="hashtag" size="12" />
      <div v-if="!hidePipelineIds" class="pipeline-id">{{ pipeline.id }}</div>
      <job-view v-for="job in jobs" :key="job.id" :job="job" />
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
    props: ['pipeline', 'project-id'],
    data: () => ({
      jobs: [],
      loading: true
    }),
    computed: {
      hidePipelineIds() {
        return !!getQueryParameter('hidePipelineIds')
      }
    },
    mounted() {
      this.fetchJobs();
    },
    watch: {
      pipeline() {
        this.fetchJobs();
      }
    },
    methods: {
      async fetchJobs() {
        this.$data.jobs = await this.$api(`/projects/${this.$props.projectId}/pipelines/${this.$props.pipeline.id}/jobs`);
        this.$data.loading = false;
      }
    }
  };
</script>

<style lang="scss" scoped>
  .pipeline-view {
    &:not(:last-child) {
      margin-bottom: 4px;
    }

    .jobs {
      display: flex;
      align-items: center;
      color: white;

      .pipeline-icon {
        fill: white;
        width: 16px;
        height: 16px;
        margin-right: 1px;
      }

      .pipeline-id {
        margin-right: 8px;
      }
    }
  }
</style>
