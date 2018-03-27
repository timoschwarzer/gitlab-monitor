# GitLab Monitor

![Logo](/logo.svg)

> A browser-based monitor dashboard for GitLab CI

## Use & Download

If you don't want to setup your own server, you can always
use the latest version of GitLab Monitor I upload here:

<https://timoschwarzer.com/gitlab-monitor>

Don't worry, I don't save access tokens or anything else.
Additionally, this version has a manifest.json attached which
makes it easy to pin it to your Android home screen and open
it as a full screen app.

[Go to releases](https://github.com/timoschwarzer/gitlab-monitor/releases)

## Screenshots

![Screenshot 1](/../resources/screenshots/screenshot1.png?raw=true)
![Screenshot 2](/../resources/screenshots/screenshot2.png?raw=true)

## Build Setup

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:8080
yarn run dev

# build for production with minification
yarn run build
```

## Usage

`
http://gitlab-monitor.local/<params>
`

## Available params

Name                            | Description
--------------------------------|--------------------------------------------
`gitlabApi` (required)          | URL to your GitLab API. (e.g. `https://gitlab.example.com/api/v4`)
`privateToken` (required)       | Private token to access the GitLab API
`maxAge`                        | In hours. Projects with last activity older than this age won't be displayed. If set to 0, no filter will be applied. Default: 168 (i.e. 7 days)
`fetchCount`                    | How many projects will be fetched from GitLab. If set to greater than 100, then all available projects will be retrieved (in batches of 100). Default: 20
`pipelinesOnly`                 | Show only projects with recent pipelines. Default: `false`
`autoZoom`                      | Zooms the dashboard to fill the screen with all displayed projects. [Not compatible](https://caniuse.com/#feat=css-zoom) with all browsers! Default: `false`
`showPipelineIds`               | Don't show pipeline IDs. Default: `true`
`showJobNames`                  | Show job names instead of status icons. Default: `false`
`showDurations`                 | Show pipeline durations. Default: `true`
`showUsers`                     | Show user that invoked a pipeline. Default: `false`
`projectVisibility`             | Limit projects by visibility. Default: `any`, Can be: `any`, `public`, `internal` or `private`
`groups`                        | List of project groups that are included. Multiple groups can be provided comma-separated or in multiple `groups` values. Note that `groups` and `projects` are combined together if both are provided.
`projects`                      | List of projects that are included. Multiple projects can be provided comma-separated or in multiple `projects` values. Note that `groups` and `projects` are combined together if both are provided.

## Minimal example

`http://gitlab-monitor.local/?gitlabApi=https://gitlab.example.com/api/v4&privateToken=ABCDEF1234ABCDEF`

## Used libraries

- [Vue](https://vuejs.org)
- [vue-timeago](https://github.com/egoist/vue-timeago)
- [vue-octicon](https://github.com/Justineo/vue-octicon)
- [GitLab SVG icons](https://gitlab.com/gitlab-org/gitlab-svgs)

### Visit my [website](https://timoschwarzer.com)!
