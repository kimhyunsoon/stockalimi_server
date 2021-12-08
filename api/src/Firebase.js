// const admin = require('firebase-admin');

// let serAccount = require('./firebase/barunalim-75403-firebase-adminsdk-oyik9-6c046c078d.json')

// admin.initializeApp({
//   credential: admin.credential.cert(serAccount),
// })

// const options = {
//   priority: "high",     //메시지 중요도 설정 
//   timeToLive: 60 * 60 * 2 ////메시지 Live Time 설정
// }; 

// var message = {
//   data: {  
//     message : JSON.stringify({
//       type:'10',
//       channel: '10',
//       title: '메시지가 도착했습니다.',
//       content: 'content'
//     })
//   }
// };
// console.log(admin);
    
// admin.messaging().sendToTopic('test', message, options)
//   .then((response) => {
//     console.log("Successfully sent message:", response);
//   })
//   .catch((error) => {
//     console.log("Error sending message:", error);
//   });
module.exports = {
  // firebase : admin,
  // pushMsg : message,
}