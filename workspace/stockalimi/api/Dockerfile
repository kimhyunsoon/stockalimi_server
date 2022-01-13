FROM node:16.13

WORKDIR /api

RUN apt-get update -y
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Seoul
RUN apt-get install -y tzdata

COPY . .

RUN npm install
RUN npm install -g nodemon
CMD [ "nodemon", "-L", "server.js" ]

EXPOSE 4040
