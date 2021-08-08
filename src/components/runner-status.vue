<template>
  <div>
    <div
      class="container"
      v-if="(runnersOnline.length + runnersActive.length + runnersPaused.length + runnersOffline.length) > 0"
    >
      <div class="entry">Runner status:</div>
      <div class="entry" v-if="runnersOnline.length > 0" :title="runnersOnline.join(', ')">
        <div class="icon icon-online"/>
        {{ runnersOnline.length }} online
      </div>
      <div class="entry" v-if="runnersActive.length > 0" :title="runnersActive.join(', ')">
        <div class="icon icon-active"/>
        {{ runnersActive.length }} active
      </div>
      <div class="entry" v-if="runnersPaused.length > 0" :title="runnersPaused.join(', ')">
        <div class="icon icon-paused"/>
        {{ runnersPaused.length }} paused
      </div>
      <div class="entry" v-if="runnersOffline.length > 0" :title="runnersOffline.join(', ')">
        <div class="icon icon-offline"/>
        {{ runnersOffline.length }} offline
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'runner-status',
    props: [],
    data: () => ({
      runnersOnline: [],
      runnersActive: [],
      runnersPaused: [],
      runnersOffline: [],
      refreshIntervalId: null,
      fetchAllRunners: true,
    }),
    computed: {},
    mounted() {
      this.fetchRunners()
      this.setupRefreshInterval()
    },
    beforeDestroy() {
      if (this.refreshIntervalId) {
        clearInterval(this.refreshIntervalId)
      }
    },
    methods: {
      async fetchRunners() {
        const runners = await this.$api('/runners')

        try {
          const allRunners = await this.$api('/runners/all')

          for (const runner of allRunners) {
            if (!runners.some(r => r.id === runner.id)) {
              runners.push(runner)
            }
          }
        } catch (e) {
          this.fetchAllRunners = false
          console.warn('Could not fetch all instance runners and won\'t try again.')
        }

        this.runnersOnline = runners.filter(runner => runner.status === 'online').map(runner => runner.description)
        this.runnersActive = runners.filter(runner => runner.status === 'active').map(runner => runner.description)
        this.runnersOffline = runners.filter(runner => runner.status === 'offline').map(runner => runner.description)
        this.runnersPaused = runners.filter(runner => runner.status === 'paused').map(runner => runner.description)
      },
      setupRefreshInterval() {
        if (this.refreshIntervalId) {
          clearInterval((this.refreshIntervalId))
        }
        this.refreshIntervalId = setInterval(this.fetchRunners, 10000)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .container {
    background-color: var(--background-color, rgba(255, 255, 255, 0.5));
    padding: 4px 8px;
  }

  .entry {
    display: inline-block;
    margin-right: 1em;
  }

  .icon {
    display: inline-block;
    width: 0.8em;
    height: 0.8em;
    transform: translateY(-10%);
    vertical-align: middle;
    border-radius: 50%;

    &.icon-online {
      background-color: var(--job-success, #2E7D32);
    }

    &.icon-active {
      background-color: var(--job-running, #1565C0);
    }

    &.icon-paused {
      background-color: var(--job-pending, #EF6C00);
    }

    &.icon-offline {
      background-color: var(--job-failed, #C62828);
    }
  }
</style>
