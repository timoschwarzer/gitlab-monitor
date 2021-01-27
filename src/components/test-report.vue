<template>
  <div v-if="showTestReport && pipeline.test_report !== null">
    <div class="test-report">
        <a
            class="pipeline-id-link"
            target="_blank"
            rel="noopener noreferrer"
            :href="pipeline.web_url + '/test_report'"
        >
          <span class="test-summary">Total ({{ pipeline.test_report.total_count }})</span>
          <span class="test-summary">Sucess ({{ pipeline.test_report.success_count }})</span>
          <span class="test-summary">Failed ({{ pipeline.test_report.failed_count }})</span>
          <span class="test-summary">Skipped ({{ pipeline.test_report.skipped_count }})</span>
          <span class="test-summary">Error ({{ pipeline.test_report.error_count }})</span>
        </a>
    </div>
  </div>
</template>


<script>
import Config from '../Config'

export default {
    name: 'test-report',
    props: ['pipeline'],
    computed: {
        showTestReport() {
            return Config.root.showTestReport
        },  
    }
};
</script>

<style lang="scss" scoped>
    .test-report {
      padding: 1px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      color: white;
      height: 30px;
      
      a {
        text-decoration: none;
      }

      .test-summary {
        color: var(--pipeline-duration, rgba(255, 255, 255, 0.5));
        line-height: 1;
        margin-right: 3px;
        font-size: 12px;
      }

    }
</style>