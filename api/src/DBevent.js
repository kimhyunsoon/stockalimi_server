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


//전화번호 중복체크
const DuplicatePhoneNumberCheck = async (number, app) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      "SELECT COUNT(*) as cnt FROM user_information WHERE phone='" + number + "' AND app_code= '" + app + "'"
    );
    if (res[0].cnt == 0){
      log(number + "/" + app+", 등록되어있지않음")
    } else {
      log(number + "/" + app+", 등록되어있음")
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
      "INSERT INTO user_information (name, phone, join_date, app_name) VALUE('"+user.name+"', '"+user.phone+"', NOW(), '"+user.app_name+"')"
    );
    log(user.name+', '+user.phone+' 등록완료');
    return await true; //성공시 true
  } catch (e) {
    console.log(e);
    err('DBevent : CreateUser');
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
      "UPDATE user_information SET name='"+user.name+"', phone='"+user.phone+"', join_date=NOW() WHERE phone='"+user.phone+"' AND app_name='"+user.app_name+"'"
    );
    log(user.name+', '+user.phone+' 등록완료');
    return await true; //성공시 true
  } catch (e) {
    console.log(e);
    err('DBevent : UpdateUser');
    return await 'err'; // 실패시 'err'
  } finally {
    if (conn) conn.release();
  }
}

//만료일 조회
const UserExpirationCheck = async (app_code, date, phone) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      "SELECT expiration_date FROM user_information WHERE phone='" + phone + "' AND app_code='" + app_code + "'"
    );
    if (res[0] === undefined){
      log(app_code + "/" + phone+", 등록되어있지않음");
      return await 'unregist';
    } else {
      const now = moment();
      const expDate = moment(res[0].expiration_date);
      const expTest = expDate.isAfter(now);

      log(expTest);
      return await expTest; //만료일이 남아있으면 true 아니면 false 반환;
    }
  } catch (e) {
    err(`DBevent : 만료일 조회(${app_code}/${date}/${phone})`);
    console.log(e);
    return await "err"; // 실패시 'err'
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  DuplicatePhoneNumberCheck : DuplicatePhoneNumberCheck,
  CreateUser : CreateUser,
  UpdateUser : UpdateUser,
  UserExpirationCheck : UserExpirationCheck
}