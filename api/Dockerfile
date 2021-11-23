FROM node:16.13

# 앱 디렉터리 생성
WORKDIR /api

# 앱 의존성 설치
# COPY package*.json ./
# 앱 소스 추가
COPY . .

RUN npm install
# RUN npm install -g nodemon

# CMD [ "nodemon", "-L", "server.js" ]
CMD [ "sleep", "100" ]