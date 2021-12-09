FROM node:16.13

RUN apt-get update -y
RUN apt-get install lsof -y

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Seoul
RUN apt-get install -y tzdata

COPY . /api
WORKDIR /api

# 앱 의존성 설치
RUN npm install

CMD [ "nodemon", "-L", "server.js", ">", "server.log" ]

EXPOSE 4040