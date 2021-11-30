
const Crawler = require("crawler");
const schedule = require('node-schedule');

const log = require("./Tale.js").log;
const err = require("./Tale.js").err;


//전송할 데이터
let totalData = {
  kospiData:{},
  kosdaqData:{},
  stockList:{},
};

//코스피, 코스닥 데이터
const kosCrawFunc = (dataArr, name) => {
  let c = new Crawler({
    maxConnections : 10,
    callback : function (error, res, done) {
      if(error){
        err('크롤링 실패 : ' + name);
          return false;
      }else{
        let $ = res.$;
        dataArr['graph'] = $('#chart_0 .graph img').attr('src');
        dataArr['price'] = $('#quotient #now_value').text();
        dataArr['daytodayType'] = $('.subtop_sise_detail #quotient').hasClass('dn')?'하락':'상승';
        dataArr['daytodayPrice'] = $('#quotient #change_value_and_rate span').text().replaceAll('상승', '').replaceAll('하락', '').trim();
        dataArr['daytodayPer'] = $('#quotient #change_value_and_rate').text().replaceAll('상승', '').replaceAll('하락', '').trim().substring(5,100);
        log('크롤링 완료 : ' + name);
      }
      done();
    }
  })
  return c;
}

//거래순위 1~10 데이터
const startRank = 1;
const endRank = 10;
const listCrawFunc = () => {
  let c = new Crawler({
    maxConnections : 10,
    callback : function (error, res, done) {
      if(error){
        err('크롤링 실패 : 거래순위');
        return false;
      }else{
        let $ = res.$;
        let tr = '#contentarea .box_type_l table tr';
        for(let i = startRank+1; i<endRank+2; i++){
          let num = i>=7?i+3:i;
          totalData.stockList[i-1] = {
            name: $(tr).eq(num).children('td').eq(1).text(),
            price: $(tr).eq(num).children('td.number').eq(0).text(),
            daytodayType: $(tr).eq(num).children('td.number').eq(1).children('img').attr('alt'),
            daytodayPrice: $(tr).eq(num).children('td.number').eq(1).children('span').text().trim(),
            daytodayPer:$(tr).eq(num).children('td.number').eq(2).children('span').text().trim(),
          };
        }
        log('크롤링 성공 : 거래순위')
      }
      done();
    }
  })
  return c;
}

//크롤링
const getStockData = () =>{
  //거래순위 1~10
  listCrawFunc().queue('https://finance.naver.com/sise/sise_quant.naver')
  //코스피
  kosCrawFunc(totalData.kospiData, 'kospi').queue('https://finance.naver.com/sise/sise_index.naver?code=KOSPI');
  //코스닥
  kosCrawFunc(totalData.kosdaqData, 'kosdaq').queue('https://finance.naver.com/sise/sise_index.naver?code=KOSDAQ');
}
getStockData();

//월~금 9시~16시3분 3분마다 크롤링
const j = schedule.scheduleJob('*/3 9-16 * * 1-5', () => {
  getStockData();
})

module.exports = {
  totalData : totalData,
}