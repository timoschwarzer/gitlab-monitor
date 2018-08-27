<template>
  <div v-if="showPipelinesOnly ? (pipelineCount > 0) : true" :class="['project-card', status]">
    <div class="content">
      <div class="title small">{{ project !== null ? project.namespace.name : '...' }} /</div>
      <a class="title" target="_blank" rel="noopener noreferrer" :href="project !== null ? project.web_url : '#'">
        {{ project !== null ? project.name : 'Loading project...' }}
      </a>
      <div class="pipeline-container">
        <em v-if="pipelines !== null && pipelineCount === 0" class="no-pipelines">
          No recent pipelines
        </em>
        <div v-else-if="pipelines !== null">
          <template v-for="branchName in branchNames">
            <div v-for="(pipeline, index) in pipelines[branchName]" :key="pipeline.id">
              <pipeline-view :pipeline="pipeline" :project="project" :show-branch="index === 0" />
            </div>
          </template>
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
  import Octicon      from 'vue-octicon/components/Octicon';
  import 'vue-octicon/icons/clock';
  import 'vue-octicon/icons/git-branch';
  import 'vue-octicon/icons/sync';
  import Config       from '../Config';
  import GitlabIcon   from './gitlab-icon';
  import PipelineView from './pipeline-view';

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
      pipelineCount: 0,
      branchNames: [],
      status: '',
      loading: false,
      refreshInterval: null
    }),
    computed: {
      showPipelinesOnly() {
        return Config.root.pipelinesOnly;
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
      pipelines: {
        deep: true,
        handler(pipelines) {
          if (!this.project) {
            this.status = '';
            this.refreshInterval = 60000;
            return;
          }

          let configuredDefaultBranch = Config.root.projectFilter['*'].default || this.project.default_branch;

          if (Config.root.projectFilter.hasOwnProperty(this.project.path_with_namespace)) {
            configuredDefaultBranch = Config.root.projectFilter[this.project.path_with_namespace].default || this.project.default_branch;
          }

          if (
            pipelines &&
            this.project &&
            !!pipelines[configuredDefaultBranch] &&
            pipelines[configuredDefaultBranch].length > 0
          ) {
            this.status = pipelines[configuredDefaultBranch][0].status;

            switch (pipelines[configuredDefaultBranch][0].status) {
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

        const maxAge = Config.root.maxAge;
        const showMerged = Config.root.showMerged;

        const branches = await this.$api(`/projects/${this.projectId}/repository/branches`);
        const branchNames = branches.filter(branch => showMerged ? true : !branch.merged)
                                    .sort((a, b) => new Date(b.commit.committed_date).getTime() - new Date(a.commit.committed_date).getTime()).reverse()
                                    .map(branch => branch.name)
                                    .filter(branchName => {
          let filter = Config.root.projectFilter['*'];

          if (Config.root.projectFilter.hasOwnProperty(this.project.path_with_namespace)) {
            filter = Config.root.projectFilter[this.project.path_with_namespace];
          }

          return !!branchName.match(new RegExp(filter.include)) &&
            (!filter.exclude || !branchName.match(new RegExp(filter.exclude)));
        });
        const newPipelines = {};
        let count = 0;

        for (const branchName of branchNames) {
          const pipelines = await this.$api(`/projects/${this.projectId}/pipelines`, {
            ref: branchName
          });

          const resolvedPipelines = [];

          if (pipelines.length > 0) {
            const filteredPipelines = [];

            for (const pipeline of pipelines) {
              if (pipeline.status === 'pending' || pipeline.status === 'running') {
                filteredPipelines.push(pipeline);
              }
            }

            for (const pipeline of filteredPipelines) {
              const resolvedPipeline = await this.$api(`/projects/${this.projectId}/pipelines/${pipeline.id}`);
              if ((maxAge === 0 || ((new Date() - new Date(resolvedPipeline.updated_at)) / 1000 / 60 / 60 <= maxAge))) {
                resolvedPipelines.push(resolvedPipeline);
              }
            }

            if (pipelines.length >= 1 && filteredPipelines.length === 0) {
              const resolvedPipeline = await this.$api(`/projects/${this.projectId}/pipelines/${pipelines[0].id}`);
              if ((maxAge === 0 || ((new Date() - new Date(resolvedPipeline.updated_at)) / 1000 / 60 / 60 <= maxAge))) {
                newPipelines[branchName] = [resolvedPipeline];
                count++;
              }
            } else {
              newPipelines[branchName] = resolvedPipelines;
              count += resolvedPipelines.length;
            }
          }
        }

        this.pipelines = newPipelines;
        this.branchNames = branchNames;
        this.pipelineCount = count;
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
