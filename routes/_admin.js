const express = require('express');
const router = express.Router();

const TodaySurvey = require('../models/todaySurvey');
const SurveyDone = require('../models/surveyDone');
const User = require('../models/user');

function checkAdmin(user) {
  if(user){
    if ((user.idK="1080190732")&&(user.nameJ="토론판운영자")) //for test
    // if ((user.idK="1080196387")&&(user.nameJ="토론판운영자")) //for web
      return true;
    else
      return false;
  }else{
    return false;
  }
}

//설문 관리자 페이지(임시) 렌더링
router.get('/admin/rendering', function(req, res, next) {
  if(checkAdmin(req.user))
    res.render('admin', {});
  else
    res.redirect('/');
});

//관리자 설문 등록 알고리즘
router.post('/admin/db', function(req, res, next) {
  if(checkAdmin(req.user)){
    let todaySurvey = new TodaySurvey();
    let surveyDone = new SurveyDone();

    var firstQ = req.body.firstQ;

    let now = new Date();
    now = now.toLocaleDateString();

    if(checkAdmin(req.user))

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
  }else{
    res.redirect("/");
  }
});

module.exports = router;
