const express = require('express');
const router = express.Router();

const Board = require('../models/board');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

// 글 좋아요
router.post('/vote/likes/:id', function(req, res) {

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
              like_number: 100
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
router.post('/vote/dislikes/:id', function(req, res) {
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
              like_number: -100
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
