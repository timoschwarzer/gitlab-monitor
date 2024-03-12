# Configuration

GitLab Monitor is configured with a YAML-encoded configuration file.

Your configuration overrides the default configuration, which can be here: [/src/config.default.json](./src/config.default.json)

The configuration can be loaded statically or dynamically.


## Dynamic configuration

- Start the server in dev or production mode (see [README.md](./README.md)).
- Open the application URL
- On the home page, you'll be asked to enter your configuration (basically you gitlab API endpoint and your private token)
- Once configured, to change the existing configuration, hover the bottom left corner of the viewport!


## Static configuration

To add your configuration, copy [/src/config.template.json](./src/config.template.json) file into `/public/config.json` and update value.

```json
{
  "gitlabApi": "https://gitlab.example.com/api/v4",
  "privateToken": "ABCDEF1234"
}
```

Your can also use "Headless configuration" or "Environment variable configuration" ask detailed below:

### Headless configuration
If you can't access the browser directly for some reason, you can pass
your configuration YAML encoded with base64url as `rawConfig` query parameter.

### Injecting configuration when starting the container
You can also inject your configuration at runtime by setting an environment variable, `GITLAB_MONITOR_CONFIG`.

## Configuration options

Here you'll find documentation about each configration option:

```yaml
# Required
gitlabApi: https://gitlab.example.com/api/v4

# Required
# Can be generated here: https://gitlab.example.com/profile/personal_access_tokens
# At least api_read scope is needed
privateToken: ABCDEF123456

# In hours. Projects with last activity older than this age won't be displayed.
# If set to 0, no filter will be applied
maxAge: 168

# How many projects will be fetched from GitLab.
# If set to greater than 100, then all available projects will be retrieved (in batches of 100)
fetchCount: 20

# Show only projects with recent pipelines
pipelinesOnly: false

# Whether to include archived projects
includeArchived: false

# Zooms the dashboard to fill the screen with all displayed projects.
# Not compatible with all browsers! See https://caniuse.com/#feat=css-zoom
autoZoom: false

# Whether to show pipeline IDs or not
showPipelineIds: true

# Only show project for specific job statuses.
# Valid values are: 'created', 'pending', 'running', 'failed', 'success', 'canceled', 'skipped' or 'manual'.
showProjectOnlyOn:
  - canceled
  - failed
  - pending
  - running
  - skipped
  - manual

# Control how to show job names and icons
# Can be: 'icon', 'name', 'iconAndName'
showJobs: icon

# Only show job names for specific job statuses.
# Valid values are: 'created', 'pending', 'running', 'failed', 'success', 'canceled', 'skipped' or 'manual'.
# This is an example that shows job names only for jobs with a non-success status:
showJobsNameOnlyOn:
  - canceled
  - failed
  - pending
  - running
  - skipped
  - manual

# Whether to show jobs that was restarted
showRestartedJobs: true

# Whether to show stages names
showStagesNames: false

# Whether to show pipeline durations or not
showDurations: true

# Whether to show the pipelines test coverage if available
showCoverage: false

# Whether to show the pipelines test report if available
showTestReport: true

# Whether to show the user that invoked the pipeline or not
showUsers: false

# Whether to show a button to rerun pipelines
showRerunButton: false

# The page title, or null to hide
title: null

# Project display order. Possible values: lastActivity, created, name, nameWithNamespace
# Note that this only changes the displayed order and not the order in which they will be fetched.
orderBy: lastActivity

# Display projects in descending order
orderByDesc: false

# Multiply all polling intervals by this amount
# (e.g. 0.5 will make gitlab-monitor poll twice as often)
pollingIntervalMultiplier: 1.0

# Disable to prevent refreshes while the browser tab is inactive.
backgroundRefresh: true

# Limit projects by visibility
# Can be: 'any', 'public', 'internal' or 'private'
projectVisibility: any

# Limit by projects that the current user is a member of
membership: false

# Whether to show project badges or not
badges: true

# Whether to show the amount and availability of runners
showRunnerStatus: true

# Filter projects
# The filter is applied to the path with namespace
# (e.g. 'my-group/my-project'
filter:

  # Include projects that match this RegExp
  include: .*

  # Include projects that have tags matching this RegExp
  includeTags: .*

  # Exclude projects of included projects that match this RegExp
  exclude: null

  # Exclude projects of included projects that have tags matching this RegExp
  excludeTags: null

  # Exclude projects of included projects that don't have any tags
  excludeUntagged: false

# Configure projects
projectConfig:

  # The asterisk selects all projects that
  # don't have their own configuration
  '*':

    # Include branches that match this RegExp
    include: .*

    # Exclude branches of included branches that match this RegExp
    exclude: null

    # Override default branch (used for the card background color)
    # If null, it uses the default branch of the project
    default: null

    # Whether to show pipelines of merged branches
    showMerged: true

    # Whether to show pipelines of tags
    showTags: true

    # Whether to show only the latest tag
    showLatestTagOnly: false

    # Whether to show detached pipelines of merge requests
    showDetached: false

    # Whether to show the labels of the merge request for detached pipelines
    showLabels: true

    # Minimum number of pipelines to display for this filter
    historyCount: 1

    # Hide skipped pipelines
    hideSkippedPipelines: false

    # Hide successful pipelines
    hideSuccessfulPipelines: false

    soundAlerts:
      # If set to a non-null value, sound alerts will be enabled.
      # Replace null with URL to sound file.
      # IMPORTANT: Due to some browsers blocking autoplaying audio
      #            you may have to enable audio autoplay first!
      #  Firefox:  https://support.mozilla.org/en-US/kb/block-autoplay
      soundUrl: null

      # Play alert sounds for all branches matching this regex
      include: .*

      # Play alert sounds for all included branches except for branches
      # matching this regex. Set to null to exclude none.
      exclude: null

  # Specific per-project filters
  my-project/my-group":
    # see above...

# Search projects from given API route.
# Allowed values "groups" and "users"
projectScope: null

# ID or IDs to use in query with "projectScope" parameter
# For example 123 with "projectScope": "groups" would query /groups/123/projects
# Specify an array if you with to include multiple scope IDs.
projectScopeId: null

# If projectScope is "groups" you might be interested in using includeSubgroups to include
# projects from all subgroups within the group specified in projectScopeId.
includeSubgroups:  false

# Predefined theme to use. If null, the default theme will be used.
# Available themes: nord-dark, nord-light
# You can override styles in the settings or submit your own theme here: https://git.io/JUOFb
theme: null
```
