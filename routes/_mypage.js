const express = require('express');
var router = express.Router();

const Board = require('../models/board');
const User = require('../models/user');
const Comment = require('../models/comment');
const CommentPoli = require('../models/commentPoli');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

//렌더링
router.get('/mypage/view/:what/:page', function(req, res, next) {
  const sessionUser = req.user;

  let page = req.params.page;
  const what = req.params.what;

  if (page == null)
    page = 1;
  const skipSize = (page - 1) * 1;
  const limitSize = 1;
  let pageNum = 1;

  if (checkLogin(sessionUser) == 0) {
    req.flash('message', '로그인 해주세요');
    res.redirect("/home");
  } else if (checkLogin(sessionUser) == 1) {
    req.flash('message', '가입을 완료해주세요');
    res.redirect("/home");
  } else {
    User.findOne({
      _id: sessionUser._id
    }, function(err, userDB) {
      User.findOneAndUpdate({
        _id: sessionUser._id
      }, {
        $set: {
          level: parseInt((userDB.exp) / 50) + 1
        }
      }, function() {
      });
    });

    if (what == "board") {
      Board.count({
        writer_id: sessionUser._id
      }, function(err, totalCount) {
        if (err) throw err;
        pageNum = Math.ceil(totalCount / limitSize);
        Board.find({
          writer_id: sessionUser._id
        }).sort({
          board_date: -1
        }).skip(skipSize).limit(limitSize).exec(function(err, data) {
          if (err) throw err;
          res.render('myPage', {
            login: 2,
            pan: data,
            comment: null,
            commentPoli:null,
            pagination: pageNum,
            page: page,
            title: "마이페이지",
            me: sessionUser
          });
        });
      });
    }else if(what=="comment"){
      Comment.count({
        writer: sessionUser.nameJ
      }, function(err, totalCount) {
        if (err) throw err;
        pageNum = Math.ceil(totalCount / limitSize);
        Comment.find({
          writer: sessionUser.nameJ
        }).sort({
          board_date: -1
        }).skip(skipSize).limit(limitSize).exec(function(err, data) {
          if (err) throw err;
          res.render('myPage', {
            login: 2,
            pan: null,
            comment: data,
            commentPoli: null,
            pagination: pageNum,
            page: page,
            title: "마이페이지",
            me: sessionUser
          });
        });
      });
    }else if(what=="commentpoli"){
      CommentPoli.count({
        writer: sessionUser.nameJ
      }, function(err, totalCount) {
        if (err) throw err;
        pageNum = Math.ceil(totalCount / limitSize);
        CommentPoli.find({
          writer: sessionUser.nameJ
        }).sort({
          board_date: -1
        }).skip(skipSize).limit(limitSize).exec(function(err, data) {
          if (err) throw err;
          res.render('myPage', {
            login: 2,
            pan: null,
            comment: null,
            commentPoli: data,
            pagination: pageNum,
            page: page,
            title: "마이페이지",
            me: sessionUser
          });
        });
      });
    }
  }
});

//경험치 정산
router.get('/mypage/expup/:id', function(req, res, next) {
  const sessionUser = req.user;
  const id = req.params.id
  let howmuch = 0;

  console.log('hi');
  if (!sessionUser) {
    req.flash('message', '로그인이 안되었습니다.');
    res.redirect("/home");
  } else if (id) {
    CommentPoli.findOne({
      _id: id,
      writer: sessionUser.nameJ,
      exp_done: false
    }).exec(
      function(err, panDB) {
        if (err) throw err;
        if (panDB) {
          howmuch = panDB.like_number;
          User.findOneAndUpdate({
            _id: sessionUser._id
          }, {
            $inc: {
              exp: howmuch
            }
          }, function() {
            CommentPoli.findOneAndUpdate({
              _id: id,
              writer: sessionUser.nameJ,
              exp_done: false
            }, {
              $set: {
                exp_done: true,
                exp_done_howmuch: howmuch
              }
            }, function() {
              req.flash('message', '정산완료.. 경험치 획득');
              res.redirect("/home");
            });
          });
        } else {
          req.flash('message', '정산 실패..');
          res.redirect("/home");
        }
      }
    );
  } else {
    req.flash('message', '정산 실패..');
    res.redirect("/home");
  }
});

module.exports = router;
