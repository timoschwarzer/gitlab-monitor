<template>
  <div v-if="showPipelinesOnly ? (pipelines !== null && pipelines.length > 0) : true" :class="['project-card', status]">
    <div class="content">
      <div class="title small">{{ project !== null ? project.namespace.name : '...' }} /</div>
      <a class="title" target="_blank" rel="noopener noreferrer" :href="project !== null ? project.web_url : '#'">
        {{ project !== null ? project.name : 'Loading project...' }}
      </a>
      <div class="pipeline-container">
        <em v-if="pipelines !== null && pipelines.length === 0" class="no-pipelines">
          No recent pipelines
        </em>
        <div v-else-if="pipelines !== null && pipelines.length > 0">
          <div v-for="pipeline in pipelines">
            <pipeline-view :pipeline="pipeline" :project="project" />
          </div>
        </div>
        <octicon v-else name="sync" scale="1.4" spin />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="info">
      <div class="spacer"></div>
      <gitlab-icon class="calendar-icon" name="calendar" size="12" />
      <timeago v-if="project !== null" :since="project.last_activity_at" :auto-update="1"></timeago>
      <time v-else>...</time>
    </div>
  </div>
</template>

<script>
  import Octicon             from 'vue-octicon/components/Octicon';
  import {getQueryParameter} from '../util';
  import GitlabIcon          from './gitlab-icon';
  import PipelineView        from './pipeline-view';
  import 'vue-octicon/icons/git-branch';
  import 'vue-octicon/icons/clock';
  import 'vue-octicon/icons/sync';

  export default {
    components: {
      GitlabIcon,
      PipelineView,
      Octicon
    },
    name: 'project-card',
    props: ['project-id'],
    data: () => ({
      project: null,
      pipelines: null,
      status: '',
      loading: false,
      refreshInterval: null
    }),
    computed: {
      showPipelinesOnly() {
        return getQueryParameter('pipelinesOnly') !== null ? getQueryParameter('pipelinesOnly') : false;
      }
    },
    mounted() {
      this.fetchProject();
    },
    beforeDestroy() {
      if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
    },
    watch: {
      project() {
        this.fetchPipelines();
      },
      pipelines(pipelines) {
        if (pipelines && pipelines.length > 0) {
          this.status = pipelines[0].status;

          switch (pipelines[0].status) {
            case 'pending':
            case 'running':
              this.refreshInterval = 5000;
              break;
            default:
              this.refreshInterval = 15000;
          }
        } else {
          this.status = '';
          this.refreshInterval = 60000;
        }
      },
      refreshInterval(newInterval, oldInterval) {
        if (newInterval !== oldInterval) {
          if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
          this.refreshIntervalId = setInterval(() => {
            if (!this.loading) {
              this.fetchProject();
            }
          }, newInterval);
        }
      }
    },
    methods: {
      async fetchProject() {
        this.loading = true;

        this.project = await this.$api(`/projects/${this.projectId}`);
        this.$emit('input', this.project.last_activity_at);

        this.loading = false;
      },
      async fetchPipelines() {
        this.loading = true;

        const pipelines = await this.$api(`/projects/${this.projectId}/pipelines`);

        const resolvedPipelines = [];

        if (pipelines.length === 0) {
          this.pipelines = [];
        } else {
            const filteredPipelines = [];

            for (const pipeline of pipelines) {
                if (pipeline.status === 'pending' || pipeline.status === 'running') {
                    filteredPipelines.push(pipeline);
                }
            }

            for (const pipeline of filteredPipelines) {
              const resolvedPipeline = await this.$api(`/projects/${this.projectId}/pipelines/${pipeline.id}`);
              resolvedPipelines.push(resolvedPipeline);
            }

            if (pipelines.length >= 1 && filteredPipelines.length === 0) {
                const resolvedPipeline = await this.$api(`/projects/${this.projectId}/pipelines/${pipelines[0].id}`);
                this.pipelines = [resolvedPipeline];
            } else {
                this.pipelines = resolvedPipelines;
            }
        }

        this.loading = false;
      }
    }
  };
</script>

<style lang="scss" scoped>
  .project-card {
    margin: 4px;
    border-radius: 3px;
    background-color: #424242;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    transition: background-color 200ms;

    &.success {
      background-color: #2E7D32;
    }

    &.running {
      background-color: #1565C0;
    }

    &.pending {
      background-color: #A93F00;
    }

    &.failed {
      background-color: #C62828;
    }

    &.canceled {
      background-color: #010101;
    }

    &.skipped {
      background-color: #4b4b4b;
    }

    .content {
      padding: 12px;

      .title {
        white-space: nowrap;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 1.5px 1.5px rgba(0, 0, 0, 0.4);
        text-decoration: none;
        color: inherit;

        &.small {
          font-size: 12px;
          line-height: 0.6;
        }
      }

      .pipeline-container {
        padding: 8px 0 0 0;
      }

      .no-pipelines {
        color: rgba(255, 255, 255, 0.5);
        font-size: 10px;
      }
    }

    .spacer {
      flex-grow: 1;
    }

    .info {
      padding: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.3);

      time {
        line-height: 1;
      }

      .calendar-icon {
        margin-right: 4px;
      }
    }
  }
</style>
