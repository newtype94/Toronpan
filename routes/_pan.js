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
router.get('/pan/:field/:id', function(req, res) {
  const sessionUser = req.user;
  var now = new Date();
  now = now.toLocaleDateString();

  const field = req.params.field;

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
          if (field == 1) {
            res.render('panPoli', {
              login: 2,
              pan: panDB,
              sessionUser: sessionUser
            });
          } else {
            res.render('pan', {
              login: 2,
              pan: panDB,
              sessionUser: sessionUser
            });
          }
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
      if (req.params.field == 1) {
        res.render('panPoli', {
          login: 0,
          pan: panDB,
          sessionUser: sessionUser
        });
      } else {
        res.render('pan', {
          login: 0,
          pan: panDB,
          sessionUser: sessionUser
        });
      }
    });
  }
});


// 글 좋아요
router.post('/pan/likes/:id', function(req, res) {

  var sessionUser = req.user;
  var resultJson = {};
  if (sessionUser) {
    Board.findOne({
      _id: req.params.id,
      likes: sessionUser.nameJ
    }, function(err, data) {
      if(err){
        console.log(err);
        req.flash('message', '참여 중 오류가 발생하였습니다.');
        res.redirect('/home');
      }else if(data) {
        resultJson["error"] = "이미 참여했습니다";
        res.json(resultJson);
      }else if(!data){
        Board.findOneAndUpdate({
            _id: req.params.id,
            likes: {
              $nin: [sessionUser.nameJ]
            }
          }, {
            $inc: {
              like_number: 1
            },
            $push: {
              likes: sessionUser.nameJ
            }
          }, {
            new: true
          },
          function(err, board) {
            if ((!err) && board) {
              resultJson["result"] = board.like_number;
              res.json(resultJson);
            }
          }
        );
      }
    });
  } else {
    resultJson["error"] = "로그인 해주세요";
    res.json(resultJson);
  }
});


// 글 싫어요
router.post('/pan/dislikes/:id', function(req, res) {
  var sessionUser = req.user;
  var resultJson = {};
  if (sessionUser) {
    Board.findOne({
      _id: req.params.id,
      likes: sessionUser.nameJ
    }, function(err, data) {
      if(err){
        console.log(err);
        req.flash('message', '참여 중 오류가 발생하였습니다.');
        res.redirect('/home');
      }else if(data) {
        resultJson["error"] = "이미 참여했습니다";
        res.json(resultJson);
      }else if(!data){
        Board.findOneAndUpdate({
            _id: req.params.id,
            likes: {
              $nin: [sessionUser.nameJ]
            }
          }, {
            $inc: {
              like_number: -1
            },
            $push: {
              likes: sessionUser.nameJ
            }
          }, {
            new: true
          },
          function(err, board) {
            if ((!err) && board) {
              resultJson["result"] = board.like_number;
              res.json(resultJson);
            }
          }
        );
      }
    });
  } else {
    resultJson["error"] = "로그인 해주세요";
    res.json(resultJson);
  }
});


module.exports = router;
