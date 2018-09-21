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
  
  // Limit projects by visibility
  // Can be: 'any', 'public', 'internal' or 'private'
  "projectVisibility": "any",
  
  // Filter projects
  // The filter is applied to the path with namespace
  // (e.g. 'my-group/my-project'
  "filter": {
  
    // Include projects that match this RegExp
    "include": ".*",
    
    // Exclude projects of included projects that match this RegExp
    "exclude": null
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
      "showTags": true
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
