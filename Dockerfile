FROM node:alpine
ADD . /
RUN yarn install
RUN yarn build
EXPOSE 8080
CMD /node_modules/.bin/http-server
