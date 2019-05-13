var express = require('express');
var router = express.Router();

var Board = require('../models/board');
var DeleteMatch = require('../models/deleteMatch');

var fs = require('fs');

router.get('/remove/:id', function(req, res) {
  var sessionUser = req.user;

  DeleteMatch.findOne({
    pan_id: req.params.id,
    idK: sessionUser.idK
  }, function(err, data) {
    var deleteFolderRecursive = function(path) {
      //existsSync: 파일이나 폴더가 존재하는 파악
      if (fs.existsSync(path)) {
        //readdirSync(path): 디렉토리 안의 파일의 이름을 배열로 반환
        fs.readdirSync(path).forEach(function(file, index){
          var curPath = path + "/" + file;
          //lstatSync: stat값을 반환함, isDirectory(): 디렉토리인지 파악
          if (fs.lstatSync(curPath).isDirectory()) {
            deleteFolderRecursive(curPath); //재귀(reCurse)
          } else { //delete file
            fs.unlinkSync(curPath); //unlinkSync : 파일 삭제
          }
        });
        fs.rmdirSync(path);  //rmdirSync : 폴더 삭제
      }
    };
    deleteFolderRecursive("./public/images/" + data.delete_code);
    DeleteMatch.remove({
      pan_id: req.params.id,
      idK: sessionUser.idK
    }, function(err,data){
      if(err){
        console.log(err);
      }
    });
  });

  Board.remove({
    _id: req.params.id,
    writer_id: sessionUser._id
  }, function(err, output) {
    if (err) {
      console.log(err);
      req.flash('message', '삭제하는데 에러가 발생하였습니다.');
      res.redirect('/home');
    } else {
      res.redirect("/mypage/view/board/1");
    }
  });

});

module.exports = router;
