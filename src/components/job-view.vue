<template>
  <a
    class="job-view"
    target="_blank"
    :title="job.name"
    rel="noopener noreferrer"
    :href="urlForJob"
  >
    <div :class="['job-circle', job.status === 'failed' ? (job.allow_failure ? 'warning' : 'failed') : job.status, {square: !showJobNames, hasIcon: showJobIcons}]">
      <transition name="fade" mode="out-in">
        <svg v-if="showJobIcons" :key="statusIconName">
          <use
            v-bind="{
            'href': require('../assets/icons.svg') + '#' + statusIconName,
            'xlink:href': require('../assets/icons.svg') + '#' + statusIconName
          }"
          >
          </use>
        </svg>
      </transition>

      <span v-if="showJobNames" class="job-name" :key="job.name">
        {{ job.name }}
      </span>
    </div>
    <div class="pipe"></div>
  </a>
</template>

<script>
  import Config from '../Config'

  export default {
    name: 'job-view',
    props: ['job', 'project'],
    computed: {
      statusIconName() {
        switch (this.job.status) {
          case 'canceled':
            return 'status_canceled_borderless'
          case 'failed':
            return this.job.allow_failure ?
              'status_warning_borderless' :
              'status_failed_borderless'
          case 'pending':
            return 'status_pending_borderless'
          case 'running':
            return 'status_running_borderless'
          case 'skipped':
            return 'status_skipped_borderless'
          case 'manual':
            return 'status_manual_borderless'
          case 'success':
            return 'status_success_borderless'
          default:
            return 'status_not_found_borderless'
        }
      },
      showJobNames() {
        let showJobName =  Config.root.showJobs == "name" || Config.root.showJobs == "iconAndName"
        const showJobsNameOnlyOn = Config.root.showJobsNameOnlyOn
        if (showJobsNameOnlyOn && showJobsNameOnlyOn.length) {
            showJobName = showJobsNameOnlyOn.indexOf(this.job.status) > -1
        }
        return showJobName
      },
      showJobIcons() {
        return Config.root.showJobs === 'icon' || Config.root.showJobs === 'iconAndName'
      },
      urlForJob() {
        return this.job.downstream_pipeline
          ? this.job.downstream_pipeline.web_url
          : this.job.web_url
      }
    }
  }
</script>

<style lang="scss" scoped>
  .job-view {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.8);

    &:last-child {
      .pipe {
        display: none;
      }
    }

    .job-circle {
      --job-status-color: inherit;

      width: auto;
      display: inline-flex;
      height: var(--jop-icon-size, 24px);
      border: 2px solid var(--job-border-color, rgba(255, 255, 255, 0.8));
      background-color: var(--job-status-color);
      border-radius: 999px;
      line-height: var(--jop-icon-size, 24px);
      font-size: 12px;
      transition: background-color 200ms;

      .job-name {
        margin-left: 9px;
        margin-right: 9px;
      }

      &.hasIcon {
        .job-name {
          margin-left: 1px;
        }
      }

      &.square {
        width: var(--jop-icon-size, 24px);
      }

      &.created {
        --job-status-color: var(--job-created, inherit);
      }

      &.success {
        --job-status-color: var(--job-success, #2E7D32);
      }

      &.running {
        --job-status-color: var(--job-running, #1565C0);
      }

      &.pending {
        --job-status-color: var(--job-pending, #EF6C00);
      }

      &.warning {
        --job-status-color: var(--job-warning, #EF6C00);
      }

      &.failed {
        --job-status-color: var(--job-failed, #C62828);
      }

      &.canceled {
        --job-status-color: var(--job-canceled, #010101);
      }

      &.skipped {
        --job-status-color: var(--job-skipped, #4b4b4b);
      }

      &.manual {
        --job-status-color: var(--job-manual, #4b4b4b);
      }

      svg {
        width: var(--jop-icon-size, 24px);
        height: var(--jop-icon-size, 24px);
        fill: var(--job-icon-fill-color, rgba(255, 255, 255, 0.8));
      }
    }

    .pipe {
      height: 2px;
      background-color: var(--job-connector-color, rgba(255, 255, 255, 0.8));
      width: 6px;
    }
  }
</style>
