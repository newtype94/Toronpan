var express = require('express');
var router = express.Router();

var Board = require('../models/board');

//최신글 페이징
router.get('/page/:field/new/:page', function(req, res, next) {
  var login = 0;
  if (req.user != null) {
    login = 1;
  }
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

  var skipSize = (page - 1) * 3;
  var limitSize = 3;
  var pageNum = 1;

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
        login: login,
        panArr: panArr,
        pagination: pageNum,
        page: page,
        field: field,
        title: "최신글"
      });
    });
  });
});

//인기글 페이징
router.get('/page/:field/hot/:page', function(req, res, next) {
  var login = 0;
  if (req.user != null) {
    login = 1;
  }

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
        login: login,
        panArr: panArr,
        pagination: pageNum,
        page: page,
        field: field,
        title: "인기글"
      });
    });
  });
});

module.exports = router;
