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
  const field = req.body.field;
  const how = req.body.how;
  const what = req.body.what;

  let formBack = new Object();
  let findQuery = new Object();
  let sortQuery = new Object();

  formBack.field = field;
  formBack.how = how;
  formBack.what = what;

  //findQuery 제작 start - 제목, 내용, 제목+내용
  if (how == "title") {
    findQuery = {
      title: {
        $regex: ".*" + what + ".*"
      }
    };
  } else if (how == "contents") {
    findQuery = {
      contents: {
        $regex: ".*" + what + ".*"
      }
    };
  } else if (how == "ticon") {
    findQuery = {
      $or: [{
        title: {
          $regex: ".*" + what + ".*"
        }
      }, {
        contents: {
          $regex: ".*" + what + ".*"
        }
      }]
    }
  }

  //findQuery 추가 - 토론 글, 기타 글
  if ((field == 1) || (field == 2)) {
    formBack.newhot = req.body.newhot;
    findQuery.field = Number(field);
    if (req.body.newhot == "hot") {
      findQuery.like_number = {
        $gte: 50
      };
    }
  } else if (field == 3) {
    formBack.fieldText = req.body.fieldText;
    findQuery.fieldText = req.body.fieldText;
  } else if (field == 4) {
    formBack.fieldText = "free";
    findQuery.fieldText = "free";
  } else if (field == 5) {
    formBack.fieldText = "ask";
    findQuery.fieldText = "ask";
  }

  let page = req.params.page;
  if (page == "") {
    page = 1;
  }
  const skipSize = (page - 1) * 7;
  const limitSize = 7;
  let pageNum = 1;

  Board.count(
    findQuery,
    function(err, totalCount) {
      if (err) throw err;
      pageNum = Math.ceil(totalCount / limitSize);
      Board.find(findQuery).sort({
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

});

module.exports = router;
