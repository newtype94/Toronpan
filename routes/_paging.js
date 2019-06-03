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


//최신글 페이징
router.get('/page/:field/new/:page', function(req, res, next) {
  const sessionUser = req.user;

  let page = req.params.page;
  if (page == "") {
    page = 1;
  }

  const fieldText = req.params.field;
  let field;

  if (fieldText == "poli") {
    field = 1;
  } else if (fieldText == "norm") {
    field = 2;
  } else {
    field = 3;
  }

  const skipSize = (page - 1) * 7;
  const limitSize = 7;
  let pageNum = 1;

  if (field != 3) {
    Board.count({
      field: field
    }, function(err, totalCount) {
      if (err) throw err;
      pageNum = Math.ceil(totalCount / limitSize);
      Board.find({
        field: field
      }).sort({
        board_date: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        res.render('page', {
          login: checkLogin(sessionUser),
          panArr: panArr,
          pagination: pageNum,
          page: page,
          field: field,
          title: "new"
        });
      });
    });
  } else {
    Board.count({
      field_2: fieldText
    }, function(err, totalCount) {
      if (err) throw err;
      pageNum = Math.ceil(totalCount / limitSize);
      Board.find({
        field_2: fieldText
      }).sort({
        board_date: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        res.render('page', {
          login: checkLogin(sessionUser),
          panArr: panArr,
          pagination: pageNum,
          page: page,
          field: field,
          title: "new"
        });
      });
    });
  }
});

//인기글 페이징
router.get('/page/:field/hot/:page', function(req, res, next) {
  const sessionUser = req.user;

  var page = req.params.page;
  var fieldText = req.params.field;
  var field;

  if (fieldText == "poli") {
    field = 1;
  } else if (fieldText == "soci") {
    field = 2;
  } else {
    field = 3;
  }

  if (page == "") {
    page = 1;
  }

  var skipSize = (page - 1) * 7;
  var limitSize = 7;
  var pageNum = 1;

  Board.count({
    field: field,
    like_number: {
      $gte: 50
    }
  }, function(err, totalCount) {
    if (err) throw err;
    pageNum = Math.ceil(totalCount / limitSize);
    Board.find({
      field: field,
      like_number: {
        $gte: 50
      }
    }).sort({
      board_date: -1
    }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
      if (err) throw err;
      res.render('page', {
        login: checkLogin(sessionUser),
        panArr: panArr,
        pagination: pageNum,
        page: page,
        field: field,
        title: "hot"
      });
    });
  });
});

module.exports = router;
