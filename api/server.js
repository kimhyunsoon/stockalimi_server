'use strict'; // 엄격

const express = require('express');
const PORT = 4040;
//const HOST = '0.0.0.0';
const app = express();

//cors
const cors = require('cors');
let corsOption = {
  origin: 'http://139.150.73.190:80',
  credential: true,
}
app.use(cors(corsOption));

//json
app.use(express.json());

//로그용
const log = require("./src/Tale.js").log;
const err = require("./src/Tale.js").err;

//crud 이벤트들
const DBevent = require('./src/DBevent.js');

//크롤링 이벤트들
const CrowlingEvent = require('./src/CrowlingEvent.js')

//사용자 정보 저장
app.post('/joinUser', async (req, res) => {
  let r = await DBevent.CreateUser(req.body);
  res.send(r); //성공시 true 실패시 false 반환
})

//전화번호 중복체크
app.post('/phoneNumberCheck', async (req, res)=>{
  let phone = req.body.phone;
  let r = await DBevent.DuplicatePhoneNumberCheck(phone)
  res.send(r); //있으면 true 실패시 false 반환
})

app.get('/getStockInfo', (req, res) =>{
  res.send(CrowlingEvent.totalData)
})

app.listen(PORT, ()=>{
  log('API 서버 동작중...');
});
