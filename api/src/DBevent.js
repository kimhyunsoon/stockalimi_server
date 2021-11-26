const moment = require('moment');
const mariadb = require('mariadb');

const DBinfo = require('./DBinfo.js');

const pool = mariadb.createPool({
  host: DBinfo.barunalim.host, 
  port:DBinfo.barunalim.port,
  user: DBinfo.barunalim.user, 
  password: DBinfo.barunalim.password,
  database: DBinfo.barunalim.database,
  connectionLimit: 5
});

let nowDate = moment(new Date()).format("YYYY-MM-DD, HH:mm:ss");
const errTag = '=============== DB에러 '+nowDate+' ===============';

//전화번호 중복체크
const DuplicatePhoneNumberCheck = async number => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(
      "SELECT COUNT(*) as cnt FROM user_information WHERE phone='" + number + "'"
    );
    return await res[0].cnt == 0; // 있으면 fale, 없으면 true 반환
  } catch (err) {
    console.log(errTag);
    console.log(err);
    console.log(errTag);
    return await false; // 실패시 false
  } finally {
    if (conn) conn.release();
  }
}

//사용자 정보 저장
const CreateUser = async user => {
  if(!user.name || user.phone){
    return false; // 필수값이 없을경우 false
  } else {
    let conn;
    try {
      conn = await pool.getConnection();
      const res = await conn.query(
        "INSERT INTO user_information VALUE('"+user.name+"', '"+user.phone+"', NOW())"
      );
      return await true; //성공시 true
    } catch (err) {
      console.log(errTag);
      console.log(err);
      console.log(errTag);
  
      return await false; // 실패시 false
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = {
  DuplicatePhoneNumberCheck : DuplicatePhoneNumberCheck,
  CreateUser : CreateUser,
}