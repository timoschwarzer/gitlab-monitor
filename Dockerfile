# Stage 1
FROM node:11-alpine as build

WORKDIR /usr/src/app
COPY . ./
RUN yarn install \
 && yarn build

# Stage 2
FROM twalter/openshift-nginx:stable
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY scripts/wrapper.sh /wrapper.sh
CMD ["/wrapper.sh"]
