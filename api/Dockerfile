FROM node:16.13

COPY . /api
WORKDIR /api

RUN apt-get update &&
RUN apt-get install lsof -y

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Seoul
RUN apt-get install -y tzdata

RUN npm install

CMD [ "nodemon", "-L", "server.js" ]

EXPOSE 4040
