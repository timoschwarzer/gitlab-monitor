FROM node:alpine
ADD . /
RUN yarn install
EXPOSE 8080
CMD yarn run dev
