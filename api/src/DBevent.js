const moment = require('moment');
const mariadb = require('mariadb');

const DBinfo = require('./DBinfo.js');

const log = require("./Tale.js").log;
const err = require("./Tale.js").err;

const pool = mariadb.createPool({
  host: DBinfo.barunalim.host, 
  port:DBinfo.barunalim.port,
  user: DBinfo.barunalim.user, 
  password: DBinfo.barunalim.password,
  database: DBinfo.barunalim.database,
  connectionLimit: 5
});


//전화번호 중복체크
const DuplicatePhoneNumberCheck = async number => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      "SELECT COUNT(*) as cnt FROM user_information WHERE phone='" + number + "'"
    );
    if (res[0].cnt == 0){
      log(number + ", 등록되어있지않음")
    } else {
      log(number + ", 등록되어있음")
    }
    return await res[0].cnt == 0; // 있으면 false, 없으면 true 반환
  } catch (e) {
    err('DBevent : 전화번호 중복확인');
    console.log(e);
    return await "err"; // 실패시 'err'
  } finally {
    if (conn) conn.release();
  }
}

//사용자 정보 저장
const CreateUser = async user => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      "INSERT INTO user_information VALUE('"+user.name+"', '"+user.phone+"', NOW())"
    );
    log(user.name+', '+user.phone+' 등록완료');
    return await true; //성공시 true
  } catch (e) {
    console.log(e);
    err('DBevent : joinUser');
    return await 'err'; // 실패시 'err'
  } finally {
    if (conn) conn.release();
  }
}

//사용자 정보 업데이트
const UpdateUser = async user => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      "UPDATE user_information SET name='"+user.name+"', phone='"+user.phone+"', join_date=NOW() WHERE phone='"+user.phone+"'"
    );
    log(user.name+', '+user.phone+' 등록완료');
    return await true; //성공시 true
  } catch (e) {
    console.log(e);
    err('DBevent : joinUser');
    return await 'err'; // 실패시 'err'
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  DuplicatePhoneNumberCheck : DuplicatePhoneNumberCheck,
  CreateUser : CreateUser,
  UpdateUser : UpdateUser,
}