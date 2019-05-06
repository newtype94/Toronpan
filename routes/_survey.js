const express = require('express');
const router = express.Router();

const TodaySurvey = require('../models/todaySurvey');
let SurveyDone = require('../models/surveyDone');

//사용자 설문 제출 알고리즘
router.post('/survey', function(req, res) {
  const sessionUser = req.user;
  let todaySurvey = new TodaySurvey();
  const degree = req.body.degree; // 1,2,3,4,5 셋 중 하나 반환
  let now = new Date();
  now = now.toLocaleDateString();
  let case1 = {};

  case1["idK"] = sessionUser.idK;
  case1["genderJ"] = sessionUser.genderJ;
  case1["ageJ"] = sessionUser.ageJ;
  case1["sideJ"] = sessionUser.sideJ;
  case1["degree"] = degree;

    if (sessionUser != null) {
    SurveyDone.findOne({
      done_people: sessionUser.idK,
      date: now
    }, function(err, done) {
      if (err) {
        console.log(err);
        req.flash('message', '에러 발생');
        res.redirect("/home");
      } else if (done) { //오늘 이미 설문에 참여함
        req.flash('message', '오늘은 이미 설문에 참여했습니다');
        res.redirect("/home");
      } else { //오늘 설문에 참여하지 않음
        SurveyDone.findOneAndUpdate({
            date: now
          }, {
            $push: {
              done_people: sessionUser.idK
            }
          }, {
            new: true
          },
          function(err, db) {
            if (err) {
              req.flash('message', '설문 참여중 오류가 발생했습니다');
              res.redirect("/home");
            } else if (db&&(degree != null)) {
              TodaySurvey.findOneAndUpdate({
                  _id: req.body.firstID,
                }, {
                  $push: {
                    case1: case1
                  }
                },
                function(err, db) {
                  if (!err && db) {
                    req.flash('message', '설문에 참여해주셔서 감사합니다');
                    res.redirect("/home");
                  } else {
                    console.log(err);
                    req.flash('message', '설문 참여중 오류가 발생했습니다');
                    res.redirect("/home");
                  }
                }
              );
            } else {
              req.flash('message', '설문 참여중 오류가 발생했습니다');
              res.redirect("/home");
            }
          });
      }
    });
  }
});

module.exports = router;
