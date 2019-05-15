const express = require('express');
const router = express.Router();

const Board = require('../models/board');
const Comment = require('../models/comment');
const LittleComment = require('../models/littleComment');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

//댓글 페이징 AJAX
router.get('/comment/page/:sort/:page/:panid', function(req, res, next) {
  var page = req.params.page;
  if (page == "") {
    page = 1;
  }
  var skipSize = (page - 1) * 5;
  var limitSize = 5;
  var pageNum = 1;

  Comment.count({
    whatBoard: req.params.panid
  }, function(err, totalCount) {
    if (err) throw err;
    pageNum = Math.ceil(totalCount / limitSize);
    if (req.params.sort == "new") {
      Comment.find({
        whatBoard: req.params.panid
      }).sort({
        comment_date: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        var pageJson = {};
        pageJson["pageNum"] = pageNum;
        panArr.push(pageJson); //panArr에 페이지 개수만 꼽사리..
        var intoString = JSON.stringify(panArr); // panArr은 객체이고, 객체를 string으로 바꾸고
        res.json(intoString); //json으로써 보내면 json의 배열로 인식해준다.
      });
    } else if (req.params.sort == "hot") {
      Comment.find({
        whatBoard: req.params.panid
      }).sort({
        like_number: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        var pageJson = {};
        pageJson["pageNum"] = pageNum;
        panArr.push(pageJson); //panArr에 페이지 개수만 꼽사리..
        var intoString = JSON.stringify(panArr); // panArr은 객체이고, 객체를 string으로 바꾸고
        res.json(intoString); //json으로써 보내면 json의 배열로 인식해준다.
      });
    }
  });
});

//댓글 달기
router.post('/comment/write', function(req, res) {
  let comment = new Comment();

  const sessionUser = req.user;

  if (checkLogin(sessionUser)==2) {
    comment.whatBoard = req.body.id;
    comment.contents = req.body.contents;
    comment.writer = sessionUser.nameJ;
    comment.sideJ = "";
    comment.like_number = 0;
    comment.comment_date = Date.now();
    console.log(Date.now());

    comment.save(function(err) {
      if (err)
        console.log(err);
      res.redirect('back');
    });
  }else if (checkLogin(sessionUser)==1){
    req.flash('message', '회원가입을 완료해주세요');
    res.redirect('/home');
  }else{
    req.flash('message', '로그인이 안 되었습니다');
    res.redirect('/home');
  }
});

//댓글 삭제
router.get('/comment/remove/:id', function(req, res) {
  const sessionUser = req.user;
  Comment.remove({
    _id: req.params.id,
    writer : sessionUser.nameJ
  }, function(err, output) {
    if (err) {
      console.log(err);
      req.flash('message', '삭제하는데 에러가 발생하였습니다.');
      res.redirect('/home');
    } else {
      res.redirect("/mypage/view/comment/1");
    }
  });
});

//대댓글 달기
router.post('/comment/little/write', function(req, res) {

  var littleComment = new LittleComment();
  littleComment.contents = req.body.contents;
  littleComment.writer = req.user.nameJ;
  littleComment.comment_date = Date.now();

  Comment.findOne({
    _id: req.body.id
  }, function(err, comment) {
    if (err) {
      console.log(err);
      req.flash('message', '대댓글 작성 중 오류가 발생하였습니다.');
      res.redirect('/home');
    } else{
      Comment.findOneAndUpdate({
        _id: req.body.id
      }, {
        $push: {
          littleComment: littleComment
        }
      }, function(err, board) {
        if (err)
          console.log(err);
        res.redirect('back');
      });
    }
  });
});


//댓글 좋아요
router.post('/comment/likes/:id', function(req, res) {
  const sessionUser = req.user;
  let resultJson = {};
  if (sessionUser) {
    Comment.findOne({
      _id: req.params.id
    },function(err, comment){
      if(comment.writer==sessionUser.nameJ){
        resultJson["error"] = "자기 자신의 댓글엔 참여할 수 없습니다.";
        res.json(resultJson);
      }else{
        Comment.findOne({
          _id: req.params.id,
          likes: sessionUser.nameJ
        }, function(err, comment) {
          if (err) {
            console.log(err)
            resultJson["error"] = "오류";
            res.json(resultJson);
          } else if (comment) {
            resultJson["error"] = "이미 참여했습니다";
            res.json(resultJson);
          } else {
            Comment.findOneAndUpdate({
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
              function(err, comment) {
                if ((!err) && comment) {
                  resultJson["result"] = comment.like_number;
                  res.json(resultJson);
                }
              }
            );
          }
        });
      }
    });
  } else {
    resultJson["error"] = "로그인 해주세요";
    res.json(resultJson);
  }
});

//댓글 싫어요
router.post('/comment/dislikes/:id', function(req, res) {
  const sessionUser = req.user;
  let resultJson = {};
  if (sessionUser) {
    Comment.findOne({
      _id: req.params.id
    },function(err, comment){
      if(comment.writer==sessionUser.nameJ){
        resultJson["error"] = "자기 자신의 댓글엔 참여할 수 없습니다.";
        res.json(resultJson);
      }else{
        Comment.findOne({
          _id: req.params.id,
          likes: sessionUser.nameJ
        }, function(err, comment) {
          if (err) {
            console.log(err)
            resultJson["error"] = "오류";
            res.json(resultJson);
          } else if (comment) {
            resultJson["error"] = "이미 참여했습니다";
            res.json(resultJson);
          } else {
            Comment.findOneAndUpdate({
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
              function(err, comment) {
                if ((!err) && comment) {
                  resultJson["result"] = comment.like_number;
                  res.json(resultJson);
                }
              }
            );
          }
        });
      }
    });
  } else {
    resultJson["error"] = "로그인 해주세요";
    res.json(resultJson);
  }
});

module.exports = router;
