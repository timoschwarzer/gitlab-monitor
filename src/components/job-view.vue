<template>
  <div class="job-view">
    <div :class="['job-circle', job.status]">
      <transition name="fade" mode="out-in">
        <svg :key="statusIconName">
          <use
            v-bind="{
            'href': require('../assets/icons.svg') + '#' + statusIconName,
            'xlink:href': require('../assets/icons.svg') + '#' + statusIconName
          }">
          </use>
        </svg>
      </transition>
    </div>
    <div class="pipe"></div>
  </div>
</template>

<script>
  export default {
    name: 'job-view',
    props: ['job'],
    computed: {
      statusIconName() {
        switch (this.$props.job.status) {
          case 'canceled':
            return 'status_canceled_borderless';
          case 'failed':
            return 'status_failed_borderless';
          case 'pending':
            return 'status_pending_borderless';
          case 'running':
            return 'status_running_borderless';
          case 'skipped':
            return 'status_skipped_borderless';
          case 'success':
            return 'status_success_borderless';
          default:
            return 'status_not_found_borderless';
        }
      }
    }
  };
</script>

<style lang="scss" scoped>
  .job-view {
    display: inline-flex;
    align-items: center;

    &:last-child {
      .pipe {
        display: none;
      }
    }

    .job-circle {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      transition: background-color 200ms;

      &.success {
        background-color: #2E7D32;
      }

      &.running {
        background-color: #1565C0;
      }

      &.pending {
        background-color: #EF6C00;
      }

      &.failed {
        background-color: #C62828;
      }

      &.canceled {
        background-color: #010101;
      }

      svg {
        width: 100%;
        height: 100%;
        fill: rgba(255, 255, 255, 0.8);
      }
    }

    .pipe {
      height: 2px;
      background-color: rgba(255, 255, 255, 0.8);
      width: 6px;
    }
  }
</style>
