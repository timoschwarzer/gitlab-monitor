# GitLab Monitor

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=SiarheiFrunchak_gitlab-monitor)](https://sonarcloud.io/dashboard?id=SiarheiFrunchak_gitlab-monitor)

> A browser-based monitor dashboard for GitLab CI

## Use & Download

### Hosted version

**Note: I recently changed the address from timoschwarzer.com/gitlab-monitor to
gitlab-monitor.timoschwarzer.com! Please update your config if you still use the
old address. Sorry for the inconvenience!**

If you don't want to setup your own server, you can always
use the latest version of GitLab Monitor I upload here:

<https://gitlab-monitor.timoschwarzer.com/>

Don't worry, I don't save access tokens or anything else.
Additionally, this version has a manifest.json attached which
makes it easy to pin it to your Android home screen and open
it as a full screen app.

[**Support me on Patreon**](https://www.patreon.com/timoschwarzer)

### Docker

[![dockeri.co](https://dockeri.co/image/timoschwarzer/gitlab-monitor)](https://hub.docker.com/r/timoschwarzer/gitlab-monitor)

There's an official docker image available on [Dockerhub](https://hub.docker.com/r/timoschwarzer/gitlab-monitor/):
```
docker pull timoschwarzer/gitlab-monitor
```

### Host it yourself

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

## Configuration
See [configuration](./CONFIGURATION.md).

## Used libraries

- [Vue](https://vuejs.org)
- [vue-timeago](https://github.com/egoist/vue-timeago)
- [vue-octicon](https://github.com/Justineo/vue-octicon)
- [GitLab SVG icons](https://gitlab.com/gitlab-org/gitlab-svgs)

### Visit my [website](https://timoschwarzer.com)!
