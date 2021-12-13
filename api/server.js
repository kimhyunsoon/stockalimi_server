'use strict'; // 엄격

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });
const cors = require('cors');

//cors
app.use(cors());
//json
app.use(express.json());

//로그용
const log = require("./src/Tale.js").log;
const err = require("./src/Tale.js").err;
//crud
const DBevent = require('./src/DBevent.js');
//크롤링
const CrowlingEvent = require('./src/CrowlingEvent.js')

//firebase
const admin = require('firebase-admin');
const serAccount = require('./src/firebase/stockalimi.json');
admin.initializeApp({
  credential: admin.credential.cert(serAccount),
})

//푸쉬알림발송
app.put('/notification', (req, res) =>{
  const title = req.body.title;
  const body = req.body.body;

  //푸쉬알림발송은 약속된 문자열 확인 후 처리함
  if (req.headers.appinformation == 'barunStockPushApp') {
    log('푸쉬알림발송 : 제목:'+title+', 내용:'+body);

    //stockTopic 구독중인 앱에 firebase 알림 발송 (background)
    const topic = '\'stockTopic\' in topics';
    const msg = {
      notification: {
        title: title,
        body: body
      },
      condition: topic 
    }
    admin.messaging().send(msg)
      .then(result => {
        log('fcm : ' + result);
        res.send('fcm success');
      })
      .catch(err =>{
        err(err);
        res.send(r);
      })
  
    //앱에 socket 알림 발송 (foreground)
    io.emit('stockPush', msg.notification);
    log('socket : complete');
  } else {
    res.send('err');
  }
})

//사용자 정보 저장
app.post('/user', async (req, res) => {
  log('post : /user');
  const tokenCheck = {
    data: {
      message: "check" //푸쉬할 메시지
    },
    token: req.headers.apptoken,
  };

  //사용자 정보 저장은 클라이언트 앱 토큰 검증 후 처리함
  admin.messaging().send(tokenCheck)
    .then( async result => { //토큰으로 푸쉬알림 발송시도가 성공하면 (앱에서 수신하지는 않음)
      log('apptoken check: '+ req.headers.apptoken);
      let r = await DBevent.CreateUser(req.body);
      res.send(r); //성공시 true 실패시 'err' 반환
    })
    .catch(e => {
      err(e);
      res.send('err');
    })
  
})

//사용자 정보 업데이트
app.put('/user', async (req, res) => {
  log('put : /user');
  const tokenCheck = {
    data: {
      message: "check" //푸쉬할 메시지
    },
    token: req.headers.apptoken,
  };

  //사용자 정보 저장은 클라이언트 앱 토큰 검증 후 처리함
  admin.messaging().send(tokenCheck)
    .then( async result => { //토큰으로 푸쉬알림 발송시도가 성공하면 (앱에서 수신하지는 않음)
      let r = await DBevent.UpdateUser(req.body);
      res.send(r); //성공시 true 실패시 'err' 반환
    })
    .catch(e => {
      err(e);
      res.send('err');
    })
})

//전화번호 중복체크
app.get('/phone/:number/:app', async (req, res)=>{
  const number = req.params.number;
  const app = decodeURI(req.params.app);
  log(app);

  log('get : /phone/'+number+'/'+app);
  //전화번호 중복체크는 약속된 문자열 확인 후 처리함
  if (req.headers.appinformation == 'stockalimi') {
    let r = await DBevent.DuplicatePhoneNumberCheck(number, app)
    res.send(r); //없으면 true 있으면 false, 에러시 'err' 반환
  } else {
    res.send('err'); //약속어가 다르면 err 반환
  }
})

//크롤링 데이터 요청
app.get('/stock', (req, res) =>{
  log('get : /stockData');
  //크롤링 데이터 요청의 경우는 약속된 문자열 확인 후 처리함
  if (req.headers.appinformation == 'stockalimi') {
    res.send(CrowlingEvent.totalData);
  } else {
    res.send('err'); //약속어가 다르면 'err' 반환
  } 
})

server.listen(4040, ()=>{
  log('API 서버 동작중...');
});
