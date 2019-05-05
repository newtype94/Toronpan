var express = require('express');
var router = express.Router();

var Board = require('../models/board');
var User = require('../models/user');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

//렌더링
router.get('/mypage/:page', function(req, res) {
  var sessionUser = req.user;

  var page = req.params.page;
  if (page == null)
    page = 1;
  var skipSize = (page - 1) * 1;
  var limitSize = 1;
  var pageNum = 1;

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
        console.log("Level Up Complete..");
      });
    });

    Board.count({
      writer_id: sessionUser._id
    }, function(err, totalCount) {
      if (err) throw err;
      pageNum = Math.ceil(totalCount / limitSize);
      Board.find({
        writer_id: sessionUser._id
      }).sort({
        board_date: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        res.render('myPage', {
          login: 2,
          panArr: panArr,
          pagination: pageNum,
          page: page,
          title: "마이페이지",
          me: sessionUser
        });
      });
    });
  }
});

//경험치 정산
router.get('/mypage/expup/:panid', function(req, res, next) {
  var howmuch = 0;
  var sessionUser = req.user;

  if (sessionUser == null) {
    req.flash('message', '로그인이 안되었습니다.');
    res.redirect("/home");
  } else if (req.params.panid != null) {
    Board.findOne({
      _id: req.params.panid,
      writer_id: sessionUser._id,
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
            Board.findOneAndUpdate({
              _id: req.params.panid,
              writer_id: sessionUser._id,
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
