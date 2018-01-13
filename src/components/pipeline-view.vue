<template>
  <div>
    <octicon v-if="loading" name="sync" scale="1.4" spin />
    <div v-else>
      <job-view v-for="job in jobs" :key="job.id" :job="job" />
    </div>
  </div>
</template>

<script>
  import Octicon from 'vue-octicon/components/Octicon';
  import JobView from './job-view';
  import 'vue-octicon/icons/sync';

  export default {
    components: {
      Octicon,
      JobView
    },
    name: 'pipeline-view',
    props: ['pipeline', 'project-id'],
    data: () => ({
      jobs: [],
      loading: true
    }),
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

</style>
