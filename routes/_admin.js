const express = require('express');
const router = express.Router();

const TodaySurvey = require('../models/todaySurvey');
const SurveyDone = require('../models/surveyDone');
const Notice = require('../models/notice');
const User = require('../models/user');

function checkAdmin(user) {
  if (user) {
    //if ((user.idK="1080190732")&&(user.nameJ="토론판운영자")) //for web
    if ((user.idK = "1084559821") && (user.nameJ = "토론판운영자")) //for test
      return true;
    else
      return false;
  } else {
    return false;
  }
}

//설문 관리자 페이지(임시) 렌더링
router.get('/admin/rendering', function(req, res, next) {
  if (checkAdmin(req.user))
    res.render('admin', {});
  else
    res.redirect('/');
});

//관리자 설문 등록 DB
router.post('/admin/survey', function(req, res, next) {
  if (checkAdmin(req.user)) {
    let todaySurvey = new TodaySurvey();
    let surveyDone = new SurveyDone();

    var firstQ = req.body.firstQ;

    let now = new Date();
    now = now.toLocaleDateString();

    if (checkAdmin(req.user))
      if (firstQ != null) {
        todaySurvey.firstQ = firstQ;
        todaySurvey.date = now;
        todaySurvey.save(function(err) {
          if (err) {
            res.redirect('/');
            console.log(err);
          }
          surveyDone.date = now;
          surveyDone.save(function(err) {
            if (err)
              console.log(err);
            res.redirect("/");
          });
        });
      }
  } else {
    res.redirect("/");
  }
});

//관리자 공지 등록 DB
router.post('/admin/notice', function(req, res, next) {
  if (checkAdmin(req.user)) {
    let notice = new Notice();
    notice.title = req.body.title;
    notice.contents = req.body.contents;
    notice.date = Date.now();

    notice.save(function(err) {
      if (err)
        console.log(err);
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
});

module.exports = router;
