<template>
  <div class="app" @click="autoZoom()">
    <div :style="{zoom}">
      <div class="projects">
        <project-card v-for="project in sortedProjects" :key="project.id" :project-id="project.id" v-model="project.last_activity_at" />
      </div>
    </div>
    <div v-if="initialLoading" class="loader">
      <octicon name="sync" spin scale="3" />
    </div>
  </div>
</template>

<script>
  import Octicon             from 'vue-octicon/components/Octicon';
  import {getQueryParameter} from '../util';
  import ProjectCard         from './project-card';

  export default {
    components: {
      Octicon,
      ProjectCard
    },
    name: 'app',
    data: () => ({
      projects: [],
      zoom: 1,
      initialLoading: true
    }),
    computed: {
      sortedProjects() {
        return this.$data.projects.sort((a, b) => a.last_activity_at < b.last_activity_at);
      }
    },
    mounted() {
      this.fetchProjects();

      if (getQueryParameter('autoZoom')) {
        setInterval(() => {
          this.autoZoom();
        }, 5000);
      }

      this.refreshIntervalId = setInterval(async () => {
        if (!this.$data.loading) {
          await this.fetchProjects();
        }
      }, 120000);
    },
    beforeDestroy() {
      clearInterval(this.refreshIntervalId);
    },
    methods: {
      async fetchProjects() {
        const projects = await this.$api('/projects', {
          order_by: 'last_activity_at',
          visibility: getQueryParameter('projectVisibility') || 'internal',
          per_page: getQueryParameter('fetchCount') || 20
        });

        // Only show projects that have jobs enabled
        const maxAge = (getQueryParameter('maxAge') !== null ? getQueryParameter('maxAge') : 24 * 7);

        this.$data.projects = projects.filter((project) => {
          return project.jobs_enabled &&
            maxAge === 0 || ((new Date() - new Date(project.last_activity_at)) / 1000 / 60 / 60 <= maxAge);
        });

        if (getQueryParameter('autoZoom')) {
          this.$nextTick(() => this.autoZoom());
        }

        this.$data.initialLoading = false;
      },
      async autoZoom() {
        let step = 0.1;

        if (this.$el.clientHeight > window.innerHeight) {
          step = -0.1;
        }

        while (
          (step > 0 && this.$el.clientHeight <= window.innerHeight) ||
          (step < 0 && this.$el.clientHeight > window.innerHeight)
        ) {
          this.$data.zoom += step;
          await this.$nextTick();

          if (this.$data.zoom > 20 || this.$data.zoom < 0) {
            // The browser likely doesn't support CSS zoom
            this.$data.zoom = 0;
            return;
          }
        }

        if (step > 0) this.$data.zoom -= step;
      }
    }
  };
</script>

<style lang="scss">
  html {
    background-color: #212121;
    color: #dddddd;
    font-family: Roboto, sans-serif;
  }

  body {
    margin: 0;
    padding: 4px;
    overflow-y: hidden;
  }

  svg {
    overflow: visible;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.15s
  }

  .fade-enter, .fade-leave-to {
    opacity: 0
  }
</style>

<style lang="scss" scoped>
  .app {
    .projects {
      display: flex;
      flex-wrap: wrap;
      justify-content: left;
    }

    .loader {
      display: flex;
      justify-content: center;
      align-items: center;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: transparentize(#212121, 0.5);
    }
  }
</style>
