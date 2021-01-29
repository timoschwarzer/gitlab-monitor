<template>
  <div class="test-report">
      <a
          class="pipeline-id-link"
          target="_blank"
          rel="noopener noreferrer"
          :href="pipeline.web_url + '/test_report'"
      >
        <span class="test-summary">Test Report:</span>
        <gitlab-icon class="test-icon" name="monitor" size="12" />
        <span class="test-summary">{{ pipeline.test_report.total_count }}</span>
        <gitlab-icon v-if="pipeline.test_report.success_count > 0" class="test-icon" name="status-success" size="12" />
        <span v-if="pipeline.test_report.success_count > 0" class="test-summary">{{ pipeline.test_report.success_count }}</span>
        <gitlab-icon v-if="pipeline.test_report.failed_count > 0" class="test-icon" name="status-failed" size="12" />
        <span v-if="pipeline.test_report.failed_count > 0" class="test-summary">{{ pipeline.test_report.failed_count }}</span>
        <gitlab-icon v-if="pipeline.test_report.skipped_count > 0" class="test-icon" name="status_skipped_borderless" size="12" />
        <span v-if="pipeline.test_report.skipped_count > 0" class="test-summary">{{ pipeline.test_report.skipped_count }}</span>
        <gitlab-icon v-if="pipeline.test_report.error_count > 0" class="test-icon" name="error" size="12" />
        <span v-if="pipeline.test_report.error_count > 0" class="test-summary">{{ pipeline.test_report.error_count }}</span>
      </a>
  </div>
</template>


<script>
import GitlabIcon from './gitlab-icon'

export default {
    components: {
      GitlabIcon
    },
    name: 'test-report',
    props: ['pipeline']
};
</script>

<style lang="scss" scoped>
    .test-report {
      padding: 1px;
      display: flex;
      align-items: center;
      color: white;
      height: 30px;
      
      a {
        text-decoration: none;
      }

      .test-icon {
        margin-right: 3px;
        color: var(--pipeline-chart-icon, rgba(255, 255, 255, 0.5));
      }

      .test-summary {
        color: var(--pipeline-duration, rgba(255, 255, 255, 0.5));
        line-height: 1;
        margin-right: 3px;
        font-size: 12px;
      }

    }
</style>