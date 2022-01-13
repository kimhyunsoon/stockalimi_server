const moment = require("moment");

let log = (msg)=>{
  let date = moment(new Date()).format('YYYY-MM-DD, HH:mm:ss');
  console.log('#log'+'::'+date+"  [  "+msg+ "  ]  ");
}
let err = (msg)=>{
  let date = moment(new Date()).format('YYYY-MM-DD, HH:mm:ss');
  console.error('#err'+'::'+date+"   "+"  [  "+msg+ "  ]  ");
}

module.exports = {
  log : log,
  err : err 
}