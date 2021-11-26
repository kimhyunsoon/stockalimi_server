FROM node:16.13

# 앱 디렉터리 생성
WORKDIR /api

# 앱 의존성 설치
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

# 앱 소스 추가
COPY . .

RUN npm install -g nodemon

CMD [ "nodemon", "-L", "server.js" ]

EXPOSE 4040