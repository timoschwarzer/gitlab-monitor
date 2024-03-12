# Gitlab Monitor Helm Chart

## Prerequisites

1. Have a running [Kubernetes](https://kubernetes.io/docs/setup/) environment
2. Setup [Helm](https://github.com/kubernetes/helm)

## Install

### From File
Clone gitlab-monitor and change directory
```bash
$ git clone https://github.com/timoschwarzer/gitlab-monitor
$ cd gitlab-monitor/charts/gitlab-monitor/
```
Helm install monitor
> note name and namespace can be customized.
```bash
$ helm install . -n gitlab-monitor --namespace default
```

## Configure

Edit the `values.yaml` and set the config yaml string accordingly.

```yaml
config: |
  {
    "gitlabApi": "https://gitlab.example.com/api/v4",
    "privateToken": "ABCDEF123456",
    "maxAge": 168,
    "fetchCount": 20,
    "pipelinesOnly": false,
    "includeArchived": false,
    "autoZoom": false,
    "showPipelineIds": true,
    "showJobs": "iconAndName",
    "showDurations": true,
    "showUsers": false,
    "projectVisibility": "any",
    "linkToFailureSound": null ,
    "title": null,
    "pollingIntervalMultiplier": 10,
    "filter": {
      "include": ".*",
      "includeTags": ".*",
      "exclude": null,
      "excludeTags": null
    },
    "projectFilter": {
      "*": {
        "include": ".*",
        "exclude": null,
        "default": null,
        "showMerged": false,
        "showTags": true,
        "showLatestTagOnly": false,
        "showDetached": false,
        "showLabels": true,
        "maxPipelines": 10,
        "notifyFailureOn": null
      }
    }
  }
```
