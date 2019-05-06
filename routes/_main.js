const express = require('express');
const router = express.Router();
const passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;

var $ = require('jquery');

const User = require('../models/user');

function checkLogin(user) {
  if (user == null) //로그인 X
    return 0;
  else if (user.nameJ == null) //로그인 + 가입 X
    return 1;
  else //로그인 + 가입완료
    return 2;
}

// localhost/kakao => passport.authenticate를 실행(임의로 login-kakao로 이름 설정)
router.get('/kakao', passport.authenticate('login-kakao'));

router.get('/logout', function(req, res, next) {
  req.logout();
  req.session.destroy(); // 세션 삭제
  res.clearCookie('sid'); // 세션 쿠키 삭제
  res.redirect('/');
});

router.get('/oauth', passport.authenticate('login-kakao', {
  successRedirect: '/', // 성공하면 /main으로 가도록
  failureRedirect: '/'
}));

passport.use('login-kakao', new KakaoStrategy({
    clientID: '821e43ce93b80abfa3186378bfa483cf', //for local
    //clientID: '9f5501a5d47b1972524194b4bca7420e', //for web
    clientSecret: 'obFC84IQrZ1mYVGx6ogpeEvdsRWO5d0R',
    callbackURL: '/oauth'
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOne({
      idK: profile.id
    }, function(err, user) {
      if (user) {
        return done(err, user);
      } // 회원 정보가 있으면 로그인
      const newUser = new User({ // 없으면 회원 생성
        idK: profile.id,
        nameK: profile.username
      });
      newUser.save((user) => {
        return done(null, user); // 새로운 회원 생성 후 로그인
      });
    });
  }
));

passport.serializeUser(function(user, done) { // Strategy 성공 시 호출됨
  done(null, user.idK); // 여기의 user.idk가 req.session.passport.user에 저장
});

passport.deserializeUser(function(id, done) { // 매개변수 id는 req.session.passport.user에 저장된 값
  User.findOne({
    idK: id
  }, function(err, user) {
    done(null, user); // 여기의 user가 req.user가 됨
  });
});

router.get('/', function(req, res, next) {
  res.redirect('/home');
});

module.exports = router;
