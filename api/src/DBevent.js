const moment = require('moment');
const mariadb = require('mariadb');

const DBinfo = require('./DBinfo.js');

const log = require("./Tale.js").log;
const err = require("./Tale.js").err;

const pool = mariadb.createPool({
  host: DBinfo.stockalimi.host, 
  port:DBinfo.stockalimi.port,
  user: DBinfo.stockalimi.user, 
  password: DBinfo.stockalimi.password,
  database: DBinfo.stockalimi.database,
  connectionLimit: 5
});

//엡 등록 여부 검사
const validAppCheck = async (app_code, api_key) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `SELECT COUNT(*) as cnt FROM app_list WHERE app_code='${app_code}' AND api_key='${api_key}'`
    );
    return await res[0].cnt == 1; 
    //유효한 앱이면 true, 아니면 false 반환
  } catch (e) {
    err('DBevent ERROR : validAppCheck');
    console.log(e);
    return '400'; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}


//전화번호 중복 검사
const duplicatePhoneNumberCheck = async (number, app_code) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `SELECT COUNT(*) as cnt FROM user_information WHERE phone='${number}' AND app_code= '${app_code}'`
    );
    return await res[0].cnt == 0;
    //전화번호 중복 검사 후 없으면 true 있으면 false 반환
  } catch (e) {
    err('DBevent ERROR : duplicatePhoneNumberCheck');
    console.log(e);
    return '400'; // 실패시 400 반환
  } finally {
    if (conn) conn.release();
  }
}

//사용자 등록
const createUser = async (user, app_code) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `INSERT INTO user_information (name, phone, join_date, expiration_date, app_code, app_token) VALUE('${user.name}', '${user.phone}', NOW(), DATE_FORMAT(DATE_ADD(NOW(), INTERVAL ${user.app_valid} DAY), '%Y-%m-%d 23:59:59'), '${app_code}', '${user.app_token}')`
    );
    return res.affectedRows == 1?true:'400'; //성공시 true
  } catch (e) {
    err('DBevent ERROR : createUser');
    console.log(e);
    return '400'; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}

//사용자 가망 여부 갱신
const updateUserProspective = async (phone, app_code, bool) => {
  let conn;
  const prospective_user = bool?1:0;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `UPDATE user_information SET prospective_user='${prospective_user}' WHERE phone='${phone}' AND app_code='${app_code}'`
    );
    return res.affectedRows == 1?true:'400'; //성공시 true
  } catch (e) {
    console.log(e);
    err('DBevent ERROR : updateUserProspective');
    return '400'; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}

//사용자 만료일 갱신
const updateUserExpDate = async (phone, app_code, date) => {
  let conn;
  const expDate = `${date.subtract(1, 'days').format('YYYY-MM-DD')} 23:59:59`;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `UPDATE user_information SET expiration_date='${expDate}' WHERE phone='${phone}' AND app_code='${app_code}'`
    );
    return res.affectedRows == 1?true:'400'; //성공시 true
  } catch (e) {
    console.log(e);
    err('DBevent ERROR : updateUserExpDate');
    return '400'; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}

//사용자 만료 검사
const userExpirationCheck = async (app_code, date, phone) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `SELECT expiration_date FROM user_information WHERE phone='${phone}' AND app_code='${app_code}'`
    );
    if (res[0] === undefined){
      return "400";
    } else {
      const now = moment(); 
      const exp = moment(res[0].expiration_date);

      const nowYMD = moment(now.format('YYYY-MM-DD'));
      const expYMD = moment(exp.add(1, 'days').format('YYYY-MM-DD'));

      let dDayCnt = 0;
      if(exp.isAfter(now)){
        remaining_date = expYMD.diff(nowYMD, 'days');
        //남은일자 계산
      }
      const reData = {
        result : exp.isAfter(now), // 만료일이 남아있으면 true 아니면 false
        expDate : expYMD, // 만료일자 ('YYYY-MM-DD')
        dDayCnt : dDayCnt, // 남은일자
      }
      return reData;
    }
  } catch (e) {
    err(`DBevent ERROR : userExpirationCheck(${app_code}/${date}/${phone})`);
    console.log(e);
    return "400"; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}

//사용자 목록 조회 (앱 별)
const userList = async (app_code) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `SELECT seq, name, phone, join_date, expiration_date, prospective_user FROM user_information WHERE app_code='${app_code}'`
    );
    return res;
  } catch (e) {
    err(`DBevent ERROR : userList(${app_code})`);
    console.log(e);
    return "400"; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}

//알림 발송 기록 저장
const createNotificationHistory = async (title, body, app_code) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `INSERT INTO notification_history (title, body, push_date, app_code) VALUE('${title}', ${body}, NOW(), ${app_code})`
    );
    return 'SUCCESS'; //성공시 SUCCESS
  } catch (e) {
    err('DBevent ERROR : createNotificationHistory');
    console.log(e);
    return 'ERROR'; // 실패시 ERROR
  } finally {
    if (conn) conn.release();
  }
}

//문의 요청 등록
const createContactList = async (name, phone, app_code) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `INSERT INTO contact_list (app_code, name, phone, contact_date) VALUE('${app_code}', ${name}, ${phone} ,NOW())`
    );
    return res.affectedRows == 1?true:'400'; //성공시 true
  } catch (e) {
    err('DBevent ERROR : createContactList');
    console.log(e);
    return '400'; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}

//문의 메모 갱신
const updateContactMemo = async (seq, memo) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `UPDATE contact_list SET memo='${memo}' WHERE seq='${seq}'`
    );
    return res.affectedRows == 1?true:'400'; //성공시 true
  } catch (e) {
    console.log(e);
    err('DBevent ERROR : updateContactMemo');
    return '400'; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}

//문의 답변 여부 갱신
const updateContactAnswer = async (seq) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `UPDATE contact_list SET answer_flag=1 WHERE seq='${seq}'`
    );
    return res.affectedRows == 1?true:'400'; //성공시 true
  } catch (e) {
    console.log(e);
    err('DBevent ERROR : updateContactAnswer');
    return '400'; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}

//문의 목록 조회 (앱 별)
const contactList = async (app_code) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      `SELECT seq, user_name, user_phone, contact_date, answer_flag, memo FROM contact_list WHERE app_code='${app_code}'`
    );
    return res;
  } catch (e) {
    err(`DBevent ERROR : contactList(${app_code})`);
    console.log(e);
    return "400"; // 실패시 400
  } finally {
    if (conn) conn.release();
  }
}



module.exports = {
  validAppCheck : validAppCheck,
  duplicatePhoneNumberCheck : duplicatePhoneNumberCheck,
  createUser : createUser,
  userExpirationCheck : userExpirationCheck,
  createNotificationHistory : createNotificationHistory,
  createContactList : createContactList,
  updateContactMemo : updateContactMemo,
  updateUserProspective : updateUserProspective,
  updateUserExpDate : updateUserExpDate,
  userList : userList,
  updateContactAnswer : updateContactAnswer,
  contactList : contactList,
}