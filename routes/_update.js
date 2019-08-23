var express = require("express");
var router = express.Router();

var multer = require("multer");
var uploadSetting = multer({
  dest: "./tmp",
  limits: {
    fileSize: 6 * 1024 * 1024
  }
});

var fs = require("fs");

var Board = require("../models/board");
var DeleteMatch = require("../models/deleteMatch");

//글 수정 페이지
router.get("/update/render/:id", function(req, res) {
  var sessionUser = req.user;
  if (sessionUser == null) {
    return res.status(500).json({
      error: "수정할수없음 로그인문제"
    });
  } else {
    Board.findOne(
      {
        _id: req.params.id,
        writer: sessionUser.nameJ
      },
      function(err, panDB) {
        if (err)
          return res.status(500).json({
            error: "database failure"
          });

        DeleteMatch.findOne(
          {
            pan_id: req.params.id,
            idK: sessionUser.idK
          },
          function(err, dmDB) {
            res.render("update", {
              pan: panDB,
              sessionUser: sessionUser,
              login: 2,
              deleteCode: dmDB.delete_code
            });
          }
        );
      }
    );
  }
});

//글 수정 DB 적용
router.post("/update/db/:id", function(req, res) {
  var title = "제목없음";
  if (req.body.title) title = req.body.title;
  var contents = req.body.contents;

  Board.updateOne(
    {
      _id: req.params.id,
      writer: req.user.nameJ
    },
    {
      $set: {
        title: title,
        contents: contents
      }
    },
    function(err) {
      if (err)
        return res.status(500).json({
          error: "database failure"
        });
    }
  );
  req.flash("message", "글 수정 완료하였습니다.");
  res.redirect("/home");
});

//사진 업로드 알고리즘
router.post("/update/upload", uploadSetting.single("file"), function(req, res) {
  var tmpPath = req.file.path;
  var fileName = req.file.filename;

  var deleteCode = JSON.stringify(req.body);
  deleteCode = deleteCode.substring(15, deleteCode.length - 2);

  //폴더 없으면 생성
  !fs.existsSync("./public/images/" + deleteCode) &&
    fs.mkdirSync("./public/images/" + deleteCode);

  var newPath = "./public/images/" + deleteCode + "/" + fileName;

  fs.rename(tmpPath, newPath, function(err) {
    var sending = {};
    if (err) {
      console.log(err);
      sending["err"] = err;
    }
    sending["path"] = newPath.substring(8, newPath.length);
    var sendingString = JSON.stringify(sending);
    res.json(sendingString);
  });
});

module.exports = router;
