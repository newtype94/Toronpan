const express = require('express');
const router = express.Router();

const Notice = require('../models/notice');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}



//공지 페이징
router.get('/notice/page/:page', function(req, res, next) {
  const sessionUser = req.user;

  let page = req.params.page;
  if (page == "") {
    page = 1;
  }

  const skipSize = (page - 1) * 7;
  const limitSize = 7;
  let pageNum = 1;

  Notice.count({
  }, function(err, totalCount) {
    if (err) throw err;
    pageNum = Math.ceil(totalCount / limitSize);
    Notice.find({
    }).sort({
      date: -1
    }).skip(skipSize).limit(limitSize).exec(function(err, notice) {
      if (err) throw err;
      res.render('noticePage', {
        login: checkLogin(sessionUser),
        notice : notice,
        pagination: pageNum,
        page: page,
        field: 0,
        title: "notice"
      });
    });
  });
});


// 공지 읽기
router.get('/notice/:id', function(req, res) {
  const sessionUser = req.user;
  Notice.findOne({
      _id: req.params.id
    },
    function(err, notice) {
      res.render('notice', {
        login: checkLogin(sessionUser),
        notice: notice
      });
    }
  );
});



module.exports = router;
