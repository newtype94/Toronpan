const express = require('express');
const router = express.Router();

const Board = require('../models/board');
const Notice = require('../models/notice');
const SurveyDone = require('../models/surveyDone');
const TodaySurvey = require('../models/todaySurvey');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

router.get('/home', function(req, res, next) {
  const sessionUser = req.user;
  let now = new Date();
  now = now.toLocaleDateString();

  let noticeDB; //noticeFind에서 값 할당
  let poliNewDB; //poliNewFind에서 값 할당
  let poliHotDB; //poliHotFind에서 값 할당
  let login; //surveyDoneFind에서 값 할당

  function noticeFind() {
    return new Promise((resolve, reject) => {
      Notice.find({}).sort({
        date: -1
      }).limit(5).exec((err, notice) => {
        if (err)
          reject(new Error(err));
        else {
          noticeDB = notice;
          resolve();
        }
      });
    });
  }
  function poliNewFind() {
    return new Promise((resolve, reject) => {
      Board.find({
        field: 1
      }).sort({
        board_date: -1
      }).limit(7).exec((err, poliNew) => {
        if (err)
          reject(new Error(err));
        else {
          poliNewDB = poliNew;
          resolve();
        }
      });
    });
  }
  function poliHotFind() {
    return new Promise((resolve, reject) => {
      Board.find({
        field: 1,
        like_number: {
          $gte: 50
        }
      }).sort({
        board_date: -1
      }).limit(7).exec((err, poliHot) => {
        if (err)
          reject(new Error(err));
        else {
          poliHotDB = poliHot;
          resolve();
        }
      });
    });
  }
  function surveyDoneFind() {
    return new Promise((resolve, reject) => {
      if (checkLogin(sessionUser) == 2) {
        login=2;
        SurveyDone.findOne({
          done_people: sessionUser.idK,
          date: now
        }, (err, what) => {
          if (err)
            reject(new Error(err));
          else {
            if (what) { //SurveyDone에 있다 = 오늘 설문에 참여했다
              resolve(true);
            } else { //SurveyDone에 없다 = TodaySurvey에서 오늘 것 찾아준다
              resolve(false);
            }
          }
        });
      } else {
        login = checkLogin(sessionUser);
        resolve(true); //login==2가 아니라면 설문을 줄 필요가 없으므로
      }
    });
  }
  //survey find + res.render
  function surveyFind(surveydone) {
    if (surveydone) {
      res.render('home', {
        message: req.flash('message'),
        login: login,
        survey: null,
        poliNew: poliNewDB,
        poliHot: poliHotDB,
        notice: noticeDB
      });
    } else {
      TodaySurvey.findOne({
        date: now
      }, (err, surveyDB) => {
        if (err) {
          console.log(err);
          res.render("error");
        } else if (surveyDB) { //설문 있음
          let survey = {};
          survey["firstQ"] = surveyDB.firstQ;
          survey["_id"] = surveyDB._id;
          res.render('home', {
            message: req.flash('message'),
            login: login,
            survey: survey,
            poliNew: poliNewDB,
            poliHot: poliHotDB,
            notice: noticeDB
          });
        } else { //설문이 있음
          req.flash('message', '오늘 설문이 아직 안 올라왔습니다.');
          res.render('home', {
            message: req.flash('message'),
            login: login,
            survey: null,
            poliNew: poliNewDB,
            poliHot: poliHotDB,
            notice: noticeDB
          });
        }
      });
    }
  }

  noticeFind()
    .catch(err=> {console.log(err);})
    .then(poliNewFind)
    .catch(err=> {console.log(err);})
    .then(poliHotFind)
    .catch(err=> {console.log(err);})
    .then(surveyDoneFind)
    .catch(err=> {console.log(err);})
    .then(surveyFind)
    .catch(err=> {console.log(err);});

});

module.exports = router;
