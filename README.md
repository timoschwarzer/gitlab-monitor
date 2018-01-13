# gitlab-monitor

> A browser-based monitor dashboard for GitLab CI

## Screenshot
![Screenshot](/../resources/screenshots/screenshot.png?raw=true)

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
`maxAge`                        | In hours. Projects with last activity older than this age won't be displayed. Default: 7 days
`fetchCount`                    | How many projects will be fetched from GitLab. Default: 20, Max: 100
`pipelinesOnly`                 | Show only projects with recent pipelines. Default: `false`
`autoZoom`                      | Zooms the dashboard to fill the screen with all displayed projects. Default: `false`
`showPipelineIds`               | Don't show pipeline IDs. Default: `true`
`showJobNames`                  | Show job names instead of status icons. Default: `false`
`showDurations`                 | Show pipeline durations. Default: `true`

## Minimal example:

`http://gitlab-monitor.local/?gitlabApi=https://gitlab.example.com/api/v4&privateToken=ABCDEF1234ABCDEF`

## Used libraries
- [Vue](https://vuejs.org)
- [vue-timeago](https://github.com/egoist/vue-timeago)
- [vue-octicon](https://github.com/Justineo/vue-octicon)
- [GitLab SVG icons](https://gitlab.com/gitlab-org/gitlab-svgs)

### Visit my [website](https://timoschwarzer.com)!
