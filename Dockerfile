#Stage 1
FROM node:10.8-alpine as yarnbuild

WORKDIR /usr/src/app
COPY . ./
RUN yarn install
RUN yarn build

# Stage 2
FROM nginx:1.14-alpine
COPY --from=yarnbuild /usr/src/app/dist /usr/share/nginx/html
COPY scripts/wrapper.sh /wrapper.sh
CMD ["/wrapper.sh"]
EXPOSE 80
