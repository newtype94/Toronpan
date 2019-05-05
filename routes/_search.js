var express = require('express');
var router = express.Router();

var Board = require('../models/board');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

//렌더링
router.post('/search/:page', function(req, res) {
  var field = req.body.field;
  var where = req.body.where;
  var how = req.body.how;
  var what = req.body.what;

  if (what == null) {
    console.log('flag');
  }

  var formBack = [];
  formBack['field'] = field;
  formBack['where'] = where;
  formBack['how'] = how;
  formBack['what'] = what;

  console.log(formBack);

  var page = req.params.page;
  if (page == "") {
    page = 1;
  }
  var skipSize = (page - 1) * 7;
  var limitSize = 7;
  var pageNum = 1;

  if (where == "최신") { //최신
    if (how == "제목") { //최신 -> 제목
      Board.find({
        field: field
      }).count({
        title: {
          $regex: ".*" + what + ".*"
        }
      }, function(err, totalCount) {
        if (err) throw err;
        pageNum = Math.ceil(totalCount / limitSize);
        Board.find({
          title: {
            $regex: ".*" + what + ".*"
          }
        }).sort({
          board_date: -1
        }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
          if (err) throw err;
          res.render('search', {
            login: checkLogin(req.user),
            panArr: panArr,
            pagination: pageNum,
            page: page,
            formBack: formBack
          });
        });
      });
    } else if (how == "내용") { //최신 -> 내용
      Board.find({
        field: field
      }).count({
        contents: {
          $regex: ".*" + what + ".*"
        }
      }, function(err, totalCount) {
        if (err) throw err;
        pageNum = Math.ceil(totalCount / limitSize);
        Board.find({
          contents: {
            $regex: ".*" + what + ".*"
          }
        }).sort({
          board_date: -1
        }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
          if (err) throw err;
          res.render('search', {
            login: checkLogin(req.user),
            panArr: panArr,
            pagination: pageNum,
            page: page,
            formBack: formBack
          });
        });
      });
    } else { //최신 -> 내용+내용
      Board.find({
        field: field
      }).count({
        $or: [{
          title: {
            $regex: ".*" + what + ".*"
          }
        }, {
          contents: {
            $regex: ".*" + what + ".*"
          }
        }]
      }, function(err, totalCount) {
        if (err) throw err;
        pageNum = Math.ceil(totalCount / limitSize);
        Board.find({
          $or: [{
            title: {
              $regex: ".*" + what + ".*"
            }
          }, {
            contents: {
              $regex: ".*" + what + ".*"
            }
          }]
        }).sort({
          board_date: -1
        }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
          if (err) throw err;
          res.render('search', {
            login: checkLogin(req.user),
            panArr: panArr,
            pagination: pageNum,
            page: page,
            formBack: formBack
          });
        });
      });
    }
  } else if (where == "인기") { //인기
    if (how == "제목") { //인기 -> 제목
      Board.find({
        field: field
      }).count({
        like_number: {
          $gte: 50
        },
        title: {
          $regex: ".*" + what + ".*"
        }
      }, function(err, totalCount) {
        if (err) throw err;
        pageNum = Math.ceil(totalCount / limitSize);
        Board.find({
          like_number: {
            $gte: 50
          },
          title: {
            $regex: ".*" + what + ".*"
          }
        }).sort({
          board_date: -1
        }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
          if (err) throw err;
          res.render('search', {
            login: checkLogin(req.user),
            panArr: panArr,
            pagination: pageNum,
            page: page,
            formBack: formBack
          });
        });
      });
    } else if (how == "내용") { //인기 -> 내용
      Board.find({
        field: field
      }).count({
        like_number: {
          $gte: 50
        },
        contents: {
          $regex: ".*" + what + ".*"
        }
      }, function(err, totalCount) {
        if (err) throw err;
        pageNum = Math.ceil(totalCount / limitSize);
        Board.find({
          like_number: {
            $gte: 50
          },
          contents: {
            $regex: ".*" + what + ".*"
          }
        }).sort({
          board_date: -1
        }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
          if (err) throw err;
          res.render('search', {
            login: checkLogin(req.user),
            panArr: panArr,
            pagination: pageNum,
            page: page,
            formBack: formBack
          });
        });
      });
    } else { //인기 -> 제목+내용
      Board.find({
        field: field
      }).count({
        like_number: {
          $gte: 50
        },
        $or: [{
          title: {
            $regex: ".*" + what + ".*"
          }
        }, {
          contents: {
            $regex: ".*" + what + ".*"
          }
        }]
      }, function(err, totalCount) {
        if (err) throw err;
        pageNum = Math.ceil(totalCount / limitSize);
        Board.find({
          like_number: {
            $gte: 50
          },
          $or: [{
            title: {
              $regex: ".*" + what + ".*"
            }
          }, {
            contents: {
              $regex: ".*" + what + ".*"
            }
          }]
        }).sort({
          board_date: -1
        }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
          if (err) throw err;
          res.render('search', {
            login: checkLogin(req.user),
            panArr: panArr,
            pagination: pageNum,
            page: page,
            formBack: formBack
          });
        });
      });
    }
  }
});

module.exports = router;
