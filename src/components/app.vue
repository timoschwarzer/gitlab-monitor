<template>
  <div ref="app" class="app" @click="autoZoom()">
    <div ref="zoomContainer" :style="{zoom}">
      <div class="projects">
        <project-card v-for="project in projects" :key="project.id" :project="project" @status-changed="fetchProjects()" />
      </div>
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
      ProjectCard},
    name: 'app',
    data: () => ({
      projects: [],
      zoom: 1
    }),
    mounted() {
      this.fetchProjects();

      if (getQueryParameter('autoZoom')) {
        setInterval(() => {
          this.autoZoom();
        }, 5000)
      }

      setTimeout(() => {
        this.refreshIntervalId = setInterval(async () => {
          if (!this.$data.loading) {
            await this.fetchProjects();
          }
        }, 10000);
      }, Math.random() * 10000);
    },
    beforeDestroy() {
      clearInterval(this.refreshIntervalId);
    },
    methods: {
      async fetchProjects() {
        const projects = await this.$api('/projects', {
          order_by: 'last_activity_at',
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
      },
      async autoZoom() {
        await this.$nextTick();

        let step = 0.1;

        if (this.$refs.app.clientHeight > window.innerHeight) {
          step = -0.1;
        }

        while (
          (step > 0 && this.$refs.app.clientHeight <= window.innerHeight) ||
          (step < 0 && this.$refs.app.clientHeight > window.innerHeight)
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
  }
</style>

<style lang="scss" scoped>
  .app {
    .projects {
      display: flex;
      flex-wrap: wrap;
      justify-content: left;
    }
  }
</style>
