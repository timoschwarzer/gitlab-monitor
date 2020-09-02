<template>
  <div :class="['stage-view', {'with-name': showStagesNames}]">
    <div class="jobs-queue">
      <div class="pipe before"></div>
      <div class="jobs">
        <job-view v-for="job in stage.jobs" :key="job.id" :job="job" :project="project" />
      </div>
      <div class="pipe after"></div>
    </div>
    <div class="stage-title">{{ stage.name }}</div>
  </div>
</template>

<script>
  import Config from '../Config'
  import JobView from './job-view'

  export default {
    components: {
      JobView
    },
    name: 'stage-view',
    props: ['stage', 'project'],
    computed: {
      showStagesNames() {
        return Config.root.showStagesNames;
      }
    }
  }
</script>

<style lang="scss" scoped>
  .stage-view {
    display: inline-block;
    color: var(--job-stage-names-color ,rgba(255, 255, 255, 0.8));

    &:not(.with-name) {
      .pipe.before {
        display: none;
      }
      .pipe.after {
        min-width: auto;
      }
      .stage-title {
        display: none;
      }
      padding-bottom: 0;
    }

    &:first-child {
      .pipe.before {
        display: none;
      }
      .stage-title {
        padding-left: 0;
        text-align: left;
      }
    }

    &:last-child {
      .pipe.after {
        display: none;
      }
      .stage-title {
        padding-right: 0;
        text-align: right;
      }
    }

    .stage-title {
      padding: 3px 9px 3px 9px;
      line-height: 12px;
      box-sizing: border-box;
      font-size: 12px;
      text-align: center;
    }

    .jobs-queue {
      display: flex;
      align-items: center;
    }

    .pipe {
      height: 2px;
      background-color: var(--job-connector-color, rgba(255, 255, 255, 0.8));
      width: 6px;
      flex-grow: 1;
      min-width: 18px;
    }
  }
</style>
