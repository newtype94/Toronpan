const express = require('express');
const router = express.Router();

const multer = require('multer');
const uploadSetting = multer({
  dest: "./tmp",
  limits: {
    fileSize: 6 * 1024 * 1024
  }
});

const fs = require('fs');

const Board = require('../models/board');
const User = require('../models/user');
const SurveyDone = require('../models/surveyDone');
const DeleteMatch = require('../models/deleteMatch');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

//렌더링
router.get('/write/render', function(req, res, next) {
  let now = new Date();
  now = now.toLocaleDateString();
  const sessionUser = req.user;

  if (checkLogin(req.user) == 0) {
    req.flash('message', '로그인 후에 글을 작성할 수 있습니다');
    res.redirect("/home");
  } else if (checkLogin(req.user) == 1) {
    req.flash('message', '회원가입(10초 정도 소요) 후에 글을 작성할 수 있습니다');
    res.redirect("/home");
  } else {
    SurveyDone.findOne({
      done_people: sessionUser.idK,
      date: now
    }, function(err, what) {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else if (what) {
        res.render('write', {
          login: 2,
          sessionUser: sessionUser
        });
      } else {
        req.flash('message', '설문을 먼저 해주세요..');
        res.redirect("/home");
      }
    });
  }
});

//DB
router.post('/write/db', function(req, res) {
  let now = new Date();
  now = now.toLocaleDateString();
  const sessionUser = req.user;

  if (checkLogin(sessionUser) == 0) {
    req.flash('message', '로그인 먼저 해주세요');
    res.redirect("/home");
  } else if (checkLogin(sessionUser) == 1) {
    req.flash('message', '메인 화면에서 회원가입 먼저 해주세요');
    res.redirect("/home");
  } else {
    let board = new Board();
    if (req.body.title == "") {
      board.title = "제목 없음";
    } else {
      board.title = req.body.title;
    }

    board.contents = req.body.contents;
    board.field = req.body.field;
    board.fieldText = req.body.fieldText;
    board.writer = sessionUser.nameJ;
    board.writer_id = sessionUser._id;
    board.board_date = Date.now();
    board.like_number = 0;
    board.exp_done = false;
    board.exp_done_howmuch = 0;
    board.hit = 0;

    board.save(function(err) {
      if (err) {
        console.log(err);
        res.redirect('/');
      }
      DeleteMatch.findOne({
        delete_code : req.body.deleteCode //우연히 deleteCode가 중복될경우 혹은 사용자가 장난질 한 경우
      },function(err, data){
        if(err){
          console.log(err);
        }else if(data){
          console.log(sessionUser+"deleteCode 중복");
        }else{
          let deleteMatch = new DeleteMatch();
          deleteMatch.pan_id = board._id;
          deleteMatch.idK = sessionUser.idK;
          deleteMatch.delete_code = req.body.deleteCode;
          deleteMatch.save();
        }
      });

      req.flash('message', '성공적으로 등록되었습니다..');
      res.redirect("/home");
    });
  }
});

//사진 업로드
router.post('/write/upload', uploadSetting.single('file'), function(req, res) {
  const tmpPath = req.file.path;
  const fileName = req.file.filename;

  let deleteCode = JSON.stringify(req.body);
  deleteCode = deleteCode.substring(15, deleteCode.length - 2);

  //폴더 없으면 생성
  !fs.existsSync("./public/images/" + deleteCode) && fs.mkdirSync("./public/images/" + deleteCode);

  const newPath = "./public/images/" + deleteCode + "/" + fileName;

  fs.rename(tmpPath, newPath, function(err) {
    let sending = {};
    if (err) {
      console.log(err);
      sending["err"] = err;
    }
    sending["path"] = newPath.substring(8, newPath.length);
    const sendingString = JSON.stringify(sending);
    res.json(sendingString);
  });
});

module.exports = router;
