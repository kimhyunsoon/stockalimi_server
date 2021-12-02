'use strict'; // 엄격

const express = require('express');
const PORT = 4040;
//const HOST = '0.0.0.0';
const app = express();

//cors
const cors = require('cors');
// let corsOption = {
//   origin: 'http://139.150.73.190:80',
//   credential: true,
// }
app.use(cors());

//json
app.use(express.json());

//로그용
const log = require("./src/Tale.js").log;
const err = require("./src/Tale.js").err;

//crud 이벤트들
const DBevent = require('./src/DBevent.js');

//크롤링 이벤트들
const CrowlingEvent = require('./src/CrowlingEvent.js')

//파이어베이스
const admin = require('firebase-admin');
const serAccount = require('./src/firebase/barunalim-75403-firebase-adminsdk-oyik9-6c046c078d.json');



admin.initializeApp({
  credential: admin.credential.cert(serAccount),
})

const registrationToken = "c4PiV5YZTdaSKlJqbHGOKE:APA91bEd9XHtfqJ6PHcLBpp5uzgo5CYY5Nlr8km7bN9dnwcH2IogHKx-D3rMkhk1s2A4Rg1yoreLxD_Mny6Ql6y7nSE4lfjV1ELF2Vjy9dhaybSBDIy72Rxwv9Z3U7kAWVklZD_ltCdi";





let message = {
  notification: {
    title: 'wtet',
    body: 'asdf'
  }
};


//사용자 정보 저장
app.post('/joinUser', async (req, res) => {
  const tokenCheck = {
    data: {
      message: "check"
    },
    token: req.headers.appToken,
  };

  //사용자 정보 저장은 클라이언트 앱 토큰 검증 후 처리함
  admin.messaging().send(tokenCheck)
    .then(result => { //토큰으로 푸쉬알림 발송시도가 성공하면 (앱에서 수신하지는 않음)
      let r = await DBevent.CreateUser(req.body);
      res.send(r); //성공시 true 실패시 false 반환
    })
    .catch(e => {
      err(e);
    })
  
})

//전화번호 중복체크
app.post('/phoneNumberCheck', async (req, res)=>{
  let phone = req.body.phone;
  let r = await DBevent.DuplicatePhoneNumberCheck(phone)
  res.send(r); //없으면 true 실패시 false 반환
})


//크롤링 데이터 요청
app.get('/getStockInfo', (req, res) =>{

  //크롤링 데이터 요청의 경우는 간단히 앱-서버 간 약속된 문자열 확인 후 처리함
  if (req.headers.appinformation == 'barunStockPushApp') {
    res.send(CrowlingEvent.totalData)
  } else {
    res.send('err')
  } 
})

app.get('/pushTest', (req, res) =>{
  admin.messaging().sendToTopic('test', message)
  .then(r => {
    console.log("Successfully sent message:", r);
    res.send("Successfully sent message:");
  })
  .catch(e => {
    console.log("Error sending message:", e);
    res.send("Error sending message:");
  });
})





app.listen(PORT, ()=>{
  log('API 서버 동작중...');
});
