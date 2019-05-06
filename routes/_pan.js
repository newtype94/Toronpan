const express = require('express');
const router = express.Router();

const Board = require('../models/board');
const SurveyDone = require('../models/surveyDone');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

// 글 읽기
router.get('/pan/:id', function(req, res) {
  const sessionUser = req.user;
  var now = new Date();
  now = now.toLocaleDateString();

  if (checkLogin(sessionUser) == 2) {
    SurveyDone.findOne({
      done_people: sessionUser.idK,
      date: now
    }, function(err, what) {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else if (what) {
        Board.findOneAndUpdate({
          _id: req.params.id
        }, {
          $inc: {
            hit: 1
          }
        }, {
          new: true
        }, function(err, panDB) {
          res.render('pan', {
            login: 2,
            pan: panDB,
            sessionUser: sessionUser
          });
        });
      } else {
        req.flash('message', '설문을 먼저 해주세요..');
        res.redirect("/home");
      }
    });
  } else if (checkLogin(sessionUser) == 1) {
    req.flash('message', '자신의 정보를 입력하여 가입을 마무리해주세요..');
    res.redirect("/home");
  } else {
    Board.findOneAndUpdate({
      _id: req.params.id
    }, {
      $inc: {
        hit: 1
      }
    }, {
      new: true
    }, function(err, panDB) {
      res.render('pan', {
        login: checkLogin(sessionUser),
        pan: panDB,
        sessionUser: sessionUser
      });
    });
  }
});

module.exports = router;
