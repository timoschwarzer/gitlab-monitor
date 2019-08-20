# Stage 1
FROM node:12-alpine as build

WORKDIR /usr/src/app
COPY . ./
RUN yarn install \
 && yarn build

# Stage 2
FROM nginx:1.17-alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY scripts/wrapper.sh /wrapper.sh
CMD ["/wrapper.sh"]
EXPOSE 80
