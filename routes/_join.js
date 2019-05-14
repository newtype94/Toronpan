var express = require('express');
var router = express.Router();

var User = require('../models/user');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

//회원가입 DB
router.post('/join/db', function(req, res) {
  var sessionUser = req.user;
  var newUser = new User();
  var idK = req.user.idK;
  var nameJ = req.body.nameJ;
  var genderJ = req.body.genderJ;
  var yearJ = req.body.yearJ;
  var sideJ = req.body.sideJ;
  var ageJ = 20;

  if(checkLogin(sessionUser)==1){
    User.count({
      nameJ: nameJ
    }, function(err, count) {
      if (err)
      console.log(err);
      else if (count == 0) { //닉네임 중복 여부
        if (((genderJ == "m") || (genderJ == "f")) && //성별 유효 여부
          ((yearJ >= 1905) && (yearJ <= 2019)) && //출생연도 유효 여부
          ((sideJ == "left") || (sideJ == "right"))) { //진영 유효 여부

          ageJ = Math.floor((2019 - yearJ + 1) / 10) * 10;
          if (ageJ == 0)
            ageJ = 10;
          else if (ageJ > 70)
            ageJ = 70;

          User.findOneAndUpdate({
            idK: idK
          }, {
            $set: {
              nameJ: nameJ,
              genderJ: genderJ,
              sideJ: sideJ,
              yearJ: yearJ,
              ageJ: ageJ,
              level: 1,
              exp: 0
            }
          }, function(err, board) {
            if (err) {
              console.log(err);
              req.flash('message', '오류가 발생하여 회원가입이 실패했습니다');
              res.redirect('/home');
            }
            req.flash('message', '회원가입이 성공적으로 이루어졌습니다');
            res.redirect('/home');
          });
        } else {
          req.flash('message', '오류가 발생하여 회원가입이 실패했습니다');
          res.redirect('/home');
        }
      } else {
        req.flash('message', '오류가 발생하여 회원가입이 실패했습니다');
        res.redirect('/home');
      }
    });
  }else{
    req.flash('에러발생')
    res.redirect('/home');
  }
});

router.post('/join/idcheck/:check', function(req, res) {
  let sending = {};
  let sendingString = "";
  var forCheck = req.params.check;
  console.log(forCheck.length);

  if((forCheck.length>3)&&(forCheck.length<7)){
    User.count({
      nameJ: forCheck
    }, function(err, count) {
      if (err)
        console.log(err);
      else{
        if(count==0)
          sending["success"] = 0;
        else
          sending["success"] = 1;
        sendingString = JSON.stringify(sending);
        res.json(sendingString);
      }
    });
  }else{
    sending["success"] = 2;
    sendingString = JSON.stringify(sending);
    res.json(sendingString);
  }
});


module.exports = router;
