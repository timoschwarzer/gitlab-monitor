<template>
  <div :class="['project-card', status]">
    <div class="content">
      <div class="title small">{{ project.namespace.name }} /</div>
      <div class="title">{{ project.name }}</div>
      <div class="branch">
        <octicon name="git-branch" scale="0.9" />
        {{ project.default_branch }}
      </div>
      <div class="pipeline-container">
        <em v-if="pipelines !== null && pipelines.length === 0" class="no-pipelines">
          No recent pipelines
        </em>
        <div v-else-if="pipelines !== null && pipelines.length > 0">
          <div v-for="pipeline in pipelines">
            <pipeline-view :pipeline="pipeline" :project-id="project.id" />
          </div>
        </div>
        <octicon v-else name="sync" scale="1.4" spin />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="info">
      <div class="spacer"></div>
      <gitlab-icon class="calendar-icon" name="calendar" size="12" />
      <timeago :since="project.last_activity_at" :auto-update="1"></timeago>
    </div>
  </div>
</template>

<script>
  import Octicon      from 'vue-octicon/components/Octicon';
  import GitlabIcon   from './gitlab-icon';
  import PipelineView from './pipeline-view';
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
    props: ['project'],
    data: () => ({
      pipelines: null,
      status: '',
      loading: false,
      refreshInterval: null
    }),
    mounted() {
      this.fetchPipelines();
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
          this.$data.status = pipelines[0].status;

          switch (pipelines[0].status) {
            case 'pending':
            case 'running':
              this.$data.refreshInterval = 5000;
              break;
            default:
              this.$data.refreshInterval = 15000;
          }
        } else {
          this.$data.status = '';
          this.$data.refreshInterval = 60000;
        }
      },
      refreshInterval(newInterval, oldInterval) {
        if (newInterval !== oldInterval) {
          if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
          this.refreshIntervalId = setInterval(() => {
            if (!this.$data.loading) {
              this.fetchPipelines();
            }
          }, newInterval);
        }
      }
    },
    methods: {
      async fetchPipelines() {
        this.$data.loading = true;

        const pipelines = await this.$api(`/projects/${this.$props.project.id}/pipelines`);

        const resolvedPipelines = [];

        if (pipelines.length === 0) {
          this.$data.pipelines = [];
        } else {
          if (pipelines[0].status === 'pending') {
            const filteredPipelines = [];

            for (const pipeline of pipelines) {
              filteredPipelines.push(pipeline);
              if (pipeline.status !== 'pending') {
                break;
              }
            }

            for (const pipeline of filteredPipelines) {
              const resolvedPipeline = await this.$api(`/projects/${this.$props.project.id}/pipelines/${pipeline.id}`);
              resolvedPipelines.push(resolvedPipeline);
            }

            this.$data.pipelines = resolvedPipelines;
          } else {
            const resolvedPipeline = await this.$api(`/projects/${this.$props.project.id}/pipelines/${pipelines[0].id}`);
            this.$data.pipelines = [resolvedPipeline];
          }
        }

        this.$data.loading = false;
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

    .content {
      padding: 12px;

      .title {
        white-space: nowrap;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 1.5px 1.5px rgba(0, 0, 0, 0.4);

        &.small {
          font-size: 12px;
          line-height: 0.6;
        }
      }

      .branch {
        color: rgba(255, 255, 255, 0.5);
        display: flex;
        align-items: center;
        font-size: 14px;

        .octicon {
          margin-right: 4px;
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
        margin-bottom: 2px;
      }
    }
  }
</style>
