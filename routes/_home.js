var express = require('express');
var router = express.Router();

var Board = require('../models/board');
var SurveyDone = require('../models/surveyDone');
var TodaySurvey = require('../models/todaySurvey');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

router.get('/home', function(req, res, next) {
  var sessionUser = req.user;
  var now = new Date();
  now = now.toLocaleDateString();

  Board.find({
    field: 1
  }).sort({
    board_date: -1
  }).limit(10).exec(function(err, poliNew) {
    if (err) throw err;

    Board.find({
      field: 1,
      like_number: {
        $gte: 50
      }
    }).sort({
      board_date: -1
    }).limit(10).exec(function(err, poliHot) {
      if (err) throw err;
      if (checkLogin(sessionUser) == 2) {
        SurveyDone.findOne({
          done_people: sessionUser.idK,
          date: now
        }, function(err, what) {
          if (err) throw err;
          if (what) { //SurveyDone에 있다 = 오늘 설문에 참여했다
            res.render('home', {
              message: req.flash('message'),
              login: 2,
              survey: null,
              poliNew: poliNew,
              poliHot: poliHot
            });
          } else { //SurveyDone에 없다 = TodaySurvey에서 오늘 것 찾아준다
            TodaySurvey.findOne({
              date: now
            }, function(err, surveyDB) {
              if (err) {
                console.log(err);
                res.render("error");
              } else if (surveyDB) { //
                survey = {};
                survey["q"] = surveyDB.firstQ;
                survey["id"] = surveyDB._id;
                res.render('home', {
                  message: req.flash('message'),
                  login: 2,
                  survey: survey,
                  poliNew: poliNew,
                  poliHot: poliHot
                });
              } else {
                req.flash('message', '오늘 설문이 아직 안 올라왔습니다.');
                res.render('home', {
                  message: req.flash('message'),
                  login: 2,
                  survey: null,
                  poliNew: poliNew,
                  poliHot: poliHot
                });
              }
            });
          }
        });
      } else {
        res.render('home', {
          message: req.flash('message'),
          login: checkLogin(sessionUser),
          survey: null,
          poliNew: poliNew,
          poliHot: poliHot
        });
      }
    });
  });
});

module.exports = router;
