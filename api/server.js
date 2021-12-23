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

//@푸쉬알림 발송
app.put('/notification', async (req, res) =>{
  const title = req.body.title;
  const body = req.body.body;
  const app = req.headers.appcode;
  const key = req.headers.apikey;

  log(`put : /notification, ${app}`);

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    //앱에 firebase 알림 발송 (background)
    const topicString = "'"+app+"' in topics";
    const msg = {
      notification: {
        title: title,
        body: body
      },
      condition: topicString 
    }
    admin.messaging().send(msg)
      .then(result => {
        log(`FCM SUCCESS`);
        res.send(`FCM SUCCESS`);
      })
      .catch(err =>{
        err(`FCM ERROR`);
        console.log(err);
        res.send(`FCM ERROR`);
      })
  
    //앱에 socket 알림 발송 (foreground)
    io.emit(app, msg.notification);
    log(`SOCKET SUCCESS`);

    //알림 발송 기록 저장
    let historyResult = await DBevent.createNotificationHistory(title, body, app);
    log(`${historyResult}`);
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 err 반환
  }
})

//@사용자 만료 검사
app.get('/expiration/:date/:phone', async (req, res) => {
  const date = req.params.date;
  const phone = req.params.phone;
  const app = req.headers.appcode;
  const key = req.headers.apikey;

  log(`get : /expiration/${app}/${date}/${phone}`);

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if (checkResult === true) {
    let r = await DBevent.userExpirationCheck(app, date, phone);
    res.send(r); //json 객체 반환
    /*
    {
      result : 만료일이 남아있으면 true 아니면 false
      expDate : 만료일자 ('YYYY-MM-DD')
      dDayCnt : 남은일자
    }
    */
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@사용자 정보 등록
app.post('/user', async (req, res) => {
  /* req.body
  {
    "name":사용자이름,
    "phone":사용자전화번호,
    "app_valid":만료일수,
    "app_token":앱토큰
  }
 */
  const app = req.headers.appcode;
  const key = req.headers.apikey;

  log('post : /user');

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    let r = await DBevent.createUser(req.body, app);
    res.send(r); 
    //사용자 정보 등록 후 성공시 true 실패시 400 반환
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@전화번호 중복 검사
app.get('/phone/:number', async (req, res)=>{
  const number = req.params.number;
  const app = req.headers.appcode;
  const key = req.headers.apikey;

  log(`get : /user/${number}`);

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    let r = await DBevent.duplicatePhoneNumberCheck(number, app);
    res.send(r); 
    //전화번호 중복 검사 후 없으면 true 있으면 false, 실패시 400 반환
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@크롤링 데이터 요청
app.get('/stock', async (req, res) =>{
  const app = req.headers.appcode;
  const key = req.headers.apikey;

  log('get : /stock');

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    res.send(CrowlingEvent.totalData);
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@사용자 만료일 갱신
app.put('/user/expiration', async (req, res) => {
  const app = req.headers.appcode;
  const key = req.headers.apikey;
  const phone = req.body.phone;
  const date = req.body.date;

  log('put : /user/prospective');

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    let r = await DBevent.updateUserExpDate(phone, app, date);
    res.send(r);
    //사용자 만료일 갱신 후 성공시 true 실패시 400 반환
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@사용자 가망여부 갱신
app.put('/user/prospective', async (req, res) => {
  const app = req.headers.appcode;
  const key = req.headers.apikey;
  const phone = req.body.phone;
  const bool = req.body.bool == 'true' ? true : false;

  log('put : /user/prospective');

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    let r = await DBevent.updateUserProspective(phone, app, bool);
    res.send(r);
    //사용자 가망여부 갱신 후 성공시 true 실패시 400 반환
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@사용자 목록 조회 (앱 별)
app.get('/user/list', async (req, res) => {
  const app = req.headers.appcode;
  const key = req.headers.apikey;

  log('get : /user/list');

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    let r = await DBevent.userList(app);
    res.send(r); //조회목록 반환
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@문의 요청 등록
app.post('/contact', async (req, res) => {
  const app = req.headers.appcode;
  const key = req.headers.apikey;
  const name = req.body.name;
  const phone = req.body.phone;

  log('post : /contact');

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    let r = await DBevent.createContactList(name, phone, app);
    res.send(r); 
    //문의요청 등록 후 성공시 true 실패시 400 반환
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@문의 메모 갱신
app.put('/contact/memo/:seq', async (req, res) => {
  const app = req.headers.appcode;
  const key = req.headers.apikey;
  const seq = req.params.seq;
  const memo = req.body.memo;

  log('put : /contact/memo');

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    let r = await DBevent.updateContactMemo(seq, memo);
    res.send(r); 
    //문의 메모 갱신 후 성공시 true 실패시 400 반환
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@문의 답변 여부 갱신
app.put('/contact/answer/:seq', async (req, res) => {
  const app = req.headers.appcode;
  const key = req.headers.apikey;
  const seq = req.params.seq;

  log('put : /contact/answer');

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    let r = await DBevent.updateContactAnswer(seq);
    res.send(r); 
    //문의 답변 여부 갱신 후 성공시 true 실패시 400 반환
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

//@문의 목록 조회 (앱 별)
app.get('/contact/list', async (req, res) => {
  const app = req.headers.appcode;
  const key = req.headers.apikey;

  log('get : /contact/list');

  //앱 등록 여부 검사
  let checkResult = await DBevent.validAppCheck(app, key);
  if(checkResult === true) {
    let r = await DBevent.contactList(app);
    res.send(r); //조회목록 반환
  } else {
    log(`등록되지 않은 앱 : ${app}/${key}`);
    res.send('403'); //등록된 앱이 아니면 403 반환
  }
})

server.listen(4040, ()=>{
  log('API 서버 동작중...');
});
