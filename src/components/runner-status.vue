<template>
  <div>
    <div class="container" v-if="(runners_online.length + runners_active.length + runners_paused.length + runners_offline.length) > 0">
      <span class="entry">Runner status:</span>
      <span class="entry" v-if="runners_online.length > 0" :title="runners_online.join(', ')">
        <div class="icon-online"/>
        {{ runners_online.length }} online
      </span>
      <span class="entry" v-if="runners_active.length > 0" :title="runners_active.join(', ')">
        <div class="icon-active"/>
        {{ runners_active.length }} active
      </span>
      <span class="entry" v-if="runners_paused.length > 0" :title="runners_paused.join(', ')">
        <div class="icon-paused"/>
        {{ runners_paused.length}} paused
      </span>
      <span class="entry" v-if="runners_offline.length > 0" :title="runners_offline.join(', ')">
        <div class="icon-offline"/>
        {{ runners_offline.length}} offline
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: "runner-status",
  props: [],
  data: () => ({
    runners_online: [],
    runners_active: [],
    runners_paused: [],
    runners_offline: [],
    refreshIntervalId: null
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
      this.runners_online = runners.filter(runner => runner.status === 'online').map(runner => runner.description)
      this.runners_offline = runners.filter(runner => runner.status === 'offline').map(runner => runner.description)
      this.runners_paused = runners.filter(runner => runner.status === 'paused').map(runner => runner.description)
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
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: var(--background-color, rgba(255,255,255,0.5));
}

.entry {
  margin-left: 15px;
  margin-right: 15px;
}

.icon-online {
  display: inline-flex;
  width: 10px;
  height: 10px;
  background-color: #2E7D32;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 999px;
}

.icon-active {
  display: inline-flex;
  width: 10px;
  height: 10px;
  background-color: #1565C0;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 999px;
}

.icon-paused {
  display: inline-flex;
  width: 10px;
  height: 10px;
  background-color: #EF6C00;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 999px;
}

.icon-offline {
  display: inline-flex;
  width: 10px;
  height: 10px;
  background-color: #C62828;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 999px;
}

</style>
