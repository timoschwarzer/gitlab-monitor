FROM node:alpine
ADD . /
RUN yarn install
RUN yarn build
EXPOSE 8080
CMD yarn run serve
