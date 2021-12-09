FROM node:16.13

RUN apk add --no-cache tzdata
ENV TZ Asia/Seoul

RUN apt-get update
RUN apt-get install lsof

# 앱 디렉터리 생성
WORKDIR /api

# 앱 소스 추가
COPY . .
COPY package.json .
COPY package-lock.json .

# 앱 의존성 설치
RUN npm install

CMD [ "nodemon", "-L", "server.js", ">", "server.log" ]

EXPOSE 4040