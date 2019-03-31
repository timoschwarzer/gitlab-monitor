# Configuration

GitLab is configured with a JSON-encoded configuration file.
Your configuration overrides the default configuration, which can be found
[here](./src/config.default.json)

**To change the existing configuration, hover the bottom left corner of the viewport!**

```json5
{
  // Required
  "gitlabApi": "https://gitlab.example.com/api/v4",
  
  // Required
  "privateToken": "ABCDEF123456",
  
  // In hours. Projects with last activity older than this age won't be displayed.
  // If set to 0, no filter will be applied
  "maxAge": 168,
  
  // How many projects will be fetched from GitLab.
  // If set to greater than 100, then all available projects will be retrieved (in batches of 100)
  "fetchCount": 20,
  
  // Show only projects with recent pipelines
  "pipelinesOnly": false,
  
  // Zooms the dashboard to fill the screen with all displayed projects.
  // Not compatible with all browsers! See https://caniuse.com/#feat=css-zoom
  "autoZoom": false,
  
  // Whether to show pipeline IDs or not
  "showPipelineIds": true,
  
  // Control how to show job names and icons
  // Can be: 'icon', 'name', 'iconAndName'
  "showJobs": "icon",

  // Whether to show pipeline durations or not
  "showDurations": true,
  
  // Whether to show the user that invoked the pipeline or not
  "showUsers": false,
  
  // The page title, or null to hide
  "title": null,
  
  // Multiply all polling intervals by this amount
  // (e.g. 0.5 will make gitlab-monitor poll twice as often)
  "pollingIntervalMultiplier": 1.0,
  
  // Limit projects by visibility
  // Can be: 'any', 'public', 'internal' or 'private'
  "projectVisibility": "any",
  
  // Play sound notification when default pipeline fails.
  // Replace null with URL to sound file.
  // IMPORTANT! Due to Chromes autoplay policy you need to set Autoplay
  // chrome://flags to "No user gesture is required" otherwise
  // autoplaying sound will be blocked without user input.
  "linkToFailureSound": null,
  
  // Limit by projects that the current user is a member of
  // Can be: true, false
  "membership": false,
  
  // Show all badges by project
  // Can be: true, false
  "badges": false,
  
  // Filter projects
  // The filter is applied to the path with namespace
  // (e.g. 'my-group/my-project'
  "filter": {
  
    // Include projects that match this RegExp
    "include": ".*",
    
    // Include projects that have tags matching this RegExp
    "includeTags": ".*",
    
    // Exclude projects of included projects that match this RegExp
    "exclude": null,
    
    // Exclude projects of included projects that have tags matching this RegExp
    "excludeTags": null
  },
  
  // Filter project branches
  "projectFilter": {
  
    // The asterisk selects all projects that
    // don't have their own configuration
    "*": {
    
      // Include branches that match this RegExp
      "include": ".*",
      
      // Exclude branches of included branches that match this RegExp
      "exclude": null,
      
      // Override default branch (used for the card background color)
      // If null, it uses the default branch of the project
      "default": null,

      // Whether to show pipelines of merged branches
      "showMerged": true,

      // Whether to show pipelines of tags
      "showTags": true,
      
      // Maximum number of pipelines to display for this filter.
      // 0 for infinite
      "maxPipelines": 0,
    },
    
    // Specific per-project filters
    "my-project/my-group": {
      // see above...
    }
  }
}
```

## Headless configuration
If you can't access the browser directly for some reason, you can pass
your configuration JSON encoded with base64url as `rawConfig` query parameter.

## Injecting configuration when starting the container
You can also inject your configuration at runtime by setting an environment variable, `GITLAB_MONITOR_CONFIG`.
