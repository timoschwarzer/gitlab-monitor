#!/bin/sh

if [ ! -z "${GITLAB_MONITOR_CONFIG}" ]; then
    echo "${GITLAB_MONITOR_CONFIG}" > /usr/share/nginx/html/config.json
fi
nginx -g "daemon off;"


    
