var express = require('express');
var router = express.Router();
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;

var $ = require('jquery');

var Board = require('../models/board');
var Comment = require('../models/comment');
var LittleComment = require('../models/littleComment');
var User = require('../models/user');
var WriteLimit = require('../models/writeLimit');
var TodaySurvey = require('../models/todaySurvey');
var SurveyDone = require('../models/surveyDone');
var DeleteMatch = require('../models/deleteMatch');

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

//설문 관리자 페이지(임시) 렌더링
router.get('/survey/admin', function(req, res, next) {
  var sessionUser = req.user;
  if (checkLogin(sessionUser) == 2) {
    res.render('panSurveyAdmin', {
      login: 2
    });
  } else {
    req.flash('message', '로그인이 안되었습니다.');
    res.redirect("/home");
  }
});

//관리자 설문 등록 알고리즘
router.post('/survey/new', function(req, res) {
  var sessionUser = req.user;
  var todaySurvey = new TodaySurvey();
  var surveyDone = new SurveyDone();
  var firstQ = req.body.firstQ;
  console.log(firstQ);
  var now = new Date();
  now = now.toLocaleDateString();
  if ((firstQ != null) && (sessionUser != null)) {
    todaySurvey.firstQ = firstQ;
    todaySurvey.date = now;

    todaySurvey.save(function(err) {
      if (err) {
        console.log(err);
        res.redirect('/');
      }
      surveyDone.date = now;
      surveyDone.save(function(err) {
        if (err) {
          console.log(err);
          res.redirect('/');
        }
        req.flash('message', '관리자님! 설문등록 잘되었습니다.');
        res.redirect("/home");
      });
    });
  }
});

//사용자 설문 제출 알고리즘
router.post('/survey/do', function(req, res) {
  var sessionUser = req.user;
  var todaySurvey = new TodaySurvey();
  var degree = req.body.degree; // 1,2,3,4,5 셋 중 하나 반환
  var now = new Date();
  now = now.toLocaleDateString();
  var case1 = {};


  case1["idK"] = sessionUser.idK;
  case1["genderJ"] = sessionUser.genderJ;
  case1["ageJ"] = sessionUser.ageJ;
  case1["sideJ"] = sessionUser.sideJ;
  case1["degree"] = degree;


  if (sessionUser != null) {
    SurveyDone.findOne({
      done_people: sessionUser.idK,
      date: now
    }, function(err, what) {
      if (err) {
        console.log(err);
        res.redirect("/home");
      } else if (what) { //오늘 이미 설문에 참여함
        req.flash('message', '오늘은 이미 설문에 참여했습니다');
        res.redirect("/home");
      } else { //오늘 설문에 참여하지 않음
        SurveyDone.findOneAndUpdate({
            date: now
          }, {
            $push: {
              done_people: sessionUser.idK
            }
          }, {
            new: true
          },
          function(err, db) {
            if (err || !db) {
              req.flash('message', '설문 참여중 오류가 발생했습니다');
              res.redirect("/home");
            } else if (degree != null) {
              TodaySurvey.findOneAndUpdate({
                  _id: req.body.firstID,
                }, {
                  $push: {
                    case1: case1
                  }
                },
                function(err, db) {
                  if (!err && db) {
                    req.flash('message', '설문에 참여해주셔서 감사합니다');
                    res.redirect("/home");
                  } else {
                    req.flash('message', '설문 참여중 오류가 발생했습니다');
                    res.redirect("/home");
                  }
                }
              );
            } else {
              req.flash('message', '설문 참여중 오류가 발생했습니다');
              res.redirect("/home");
            }
          });
      }
    });
  }
});

// 글 읽기
router.get('/pan/:id', function(req, res) {
  var sessionUser = req.user;
  var now = new Date();
  now = now.toLocaleDateString();

  if (checkLogin(sessionUser) == 2) {
    SurveyDone.findOne({
      done_people: sessionUser.idK,
      date: now
    }, function(err, what) {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else if (what) {
        Board.findOneAndUpdate({
          _id: req.params.id
        }, {
          $inc: {
            hit: 1
          }
        }, {
          new: true
        }, function(err, panDB) {
          res.render('pan', {
            login: 2,
            pan: panDB,
            sessionUser: sessionUser
          });
        });
      } else {
        req.flash('message', '설문을 먼저 해주세요..');
        res.redirect("/home");
      }
    });
  } else if (checkLogin(sessionUser) == 1) {
    req.flash('message', '자신의 정보를 입력하여 가입을 마무리해주세요..');
    res.redirect("/home");
  } else {
    Board.findOneAndUpdate({
      _id: req.params.id
    }, {
      $inc: {
        hit: 1
      }
    }, {
      new: true
    }, function(err, panDB) {
      res.render('pan', {
        login: checkLogin(sessionUser),
        pan: panDB,
        sessionUser: sessionUser
      });
    });
  }
});

//댓글 페이징 AJAX
router.get('/commentpage/:sort/:page/:panid/:side', function(req, res, next) {
  var page = req.params.page;
  if (page == "") {
    page = 1;
  }
  var skipSize = (page - 1) * 5;
  var limitSize = 5;
  var pageNum = 1;

  Comment.count({
    whatBoard: req.params.panid,
    sideJ: req.params.side
  }, function(err, totalCount) {
    if (err) throw err;
    pageNum = Math.ceil(totalCount / limitSize);
    if (req.params.sort == "new") {
      Comment.find({
        whatBoard: req.params.panid,
        sideJ: req.params.side
      }).sort({
        comment_date: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        var pageJson = {};
        pageJson["pageNum"] = pageNum;
        panArr.push(pageJson); //panArr에 페이지 개수만 꼽사리..
        var intoString = JSON.stringify(panArr); // panArr은 객체이고, 객체를 string으로 바꾸고
        res.json(intoString); //json으로써 보내면 json의 배열로 인식해준다.
      });
    } else if (req.params.sort == "hot") {
      Comment.find({
        whatBoard: req.params.panid,
        sideJ: req.params.side
      }).sort({
        like_number: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        var pageJson = {};
        pageJson["pageNum"] = pageNum;
        panArr.push(pageJson); //panArr에 페이지 개수만 꼽사리..
        var intoString = JSON.stringify(panArr); // panArr은 객체이고, 객체를 string으로 바꾸고
        res.json(intoString); //json으로써 보내면 json의 배열로 인식해준다.
      });
    }
  });
});


//대댓글 달기
router.post('/littlecomment/write', function(req, res) {

  var littleComment = new LittleComment();
  littleComment.contents = req.body.contents;
  littleComment.writer = req.user.nameJ;
  littleComment.comment_date = Date.now();

  console.log(req.body);

  Comment.findOne({
    _id: req.body.id
  }, function(err, comment) {
    if (err) {
      console.log(err);
      req.flash('message', '대댓글 작성 중 오류가 발생하였습니다.');
      res.redirect('/home');
    } else if (comment.sideJ == req.user.sideJ) {
      Comment.findOneAndUpdate({
        _id: req.body.id
      }, {
        $push: {
          littleComment: littleComment
        }
      }, function(err, board) {
        if (err) {
          console.log(err);
          res.redirect('back');
        }
        res.redirect('back');
      });
    } else {
      res.redirect('back');
    }
  });
});

//댓글 달기
router.post('/comment/write', function(req, res) {
  var comment = new Comment();
  comment.whatBoard = req.body.id;
  comment.contents = req.body.contents;
  comment.writer = req.user.nameJ;
  comment.sideJ = req.user.sideJ;
  comment.like_number = 0;
  comment.comment_date = Date.now();

  comment.save(function(err) {
    if (err) {
      console.log(err);
      res.redirect('back');
    }
    res.redirect('back');
  });
});

//댓글 좋아요
router.post('/comment/likes/:id', function(req, res) {
  var sessionUser = req.user;
  var resultJson = {};
  if (sessionUser) {
    Comment.findOne({
      _id: req.params.id,
      likes: sessionUser.nameJ
    }, function(err, comment) {
      console.log(comment);
      if ((!err) && comment) {
        resultJson["error"] = "이미 참여했습니다";
        console.log(resultJson);
        res.json(resultJson);
      }
    });
    Comment.findOneAndUpdate({
        _id: req.params.id,
        likes: {
          $nin: [sessionUser.nameJ]
        }
      }, {
        $inc: {
          like_number: 1
        },
        $push: {
          likes: sessionUser.nameJ
        }
      }, {
        new: true
      },
      function(err, comment) {
        console.log(comment);
        if ((!err) && comment) {
          resultJson["result"] = comment.like_number;
          console.log(resultJson);
          res.json(resultJson);
        }
      }
    );
  } else {
    resultJson["error"] = "로그인 해주세요";
    console.log(resultJson);
    res.json(resultJson);
  }
});

//댓글 싫어요
router.post('/comment/dislikes/:id', function(req, res) {
  var sessionUser = req.user;
  var resultJson = {};
  if (sessionUser) {
    Comment.findOne({
      _id: req.params.id,
      likes: sessionUser.nameJ
    }, function(err, comment) {
      console.log(comment);
      if ((!err) && comment) {
        resultJson["error"] = "이미 참여했습니다";
        console.log(resultJson);
        res.json(resultJson);
      }
    });
    Comment.findOneAndUpdate({
        _id: req.params.id,
        likes: {
          $nin: [sessionUser.nameJ]
        }
      }, {
        $inc: {
          like_number: -1
        },
        $push: {
          likes: sessionUser.nameJ
        }
      }, {
        new: true
      },
      function(err, comment) {
        console.log(comment);
        if ((!err) && comment) {
          resultJson["result"] = comment.like_number;
          console.log(resultJson);
          res.json(resultJson);
        }
      }
    );
  } else {
    resultJson["error"] = "로그인 해주세요";
    console.log(resultJson);
    res.json(resultJson);
  }
});


// 글 좋아요
router.post('/pan/likes/:id', function(req, res) {

  var sessionUser = req.user;
  var resultJson = {};
  if (sessionUser) {
    Board.findOne({
      _id: req.params.id,
      likes: sessionUser.nameJ
    }, function(err, data) {
      if(err){
        console.log(err);
        req.flash('message', '참여 중 오류가 발생하였습니다.');
        res.redirect('/home');
      }else if(data) {
        resultJson["error"] = "이미 참여했습니다";
        res.json(resultJson);
      }else if(!data){
        Board.findOneAndUpdate({
            _id: req.params.id,
            likes: {
              $nin: [sessionUser.nameJ]
            }
          }, {
            $inc: {
              like_number: 100
            },
            $push: {
              likes: sessionUser.nameJ
            }
          }, {
            new: true
          },
          function(err, board) {
            if ((!err) && board) {
              resultJson["result"] = board.like_number;
              res.json(resultJson);
            }
          }
        );
      }
    });
  } else {
    resultJson["error"] = "로그인 해주세요";
    res.json(resultJson);
  }
});


// 글 싫어요
router.post('/pan/dislikes/:id', function(req, res) {
  var sessionUser = req.user;
  var resultJson = {};
  if (sessionUser) {
    Board.findOne({
      _id: req.params.id,
      likes: sessionUser.nameJ
    }, function(err, data) {
      if(err){
        console.log(err);
        req.flash('message', '참여 중 오류가 발생하였습니다.');
        res.redirect('/home');
      }else if(data) {
        resultJson["error"] = "이미 참여했습니다";
        res.json(resultJson);
      }else if(!data){
        Board.findOneAndUpdate({
            _id: req.params.id,
            likes: {
              $nin: [sessionUser.nameJ]
            }
          }, {
            $inc: {
              like_number: -100
            },
            $push: {
              likes: sessionUser.nameJ
            }
          }, {
            new: true
          },
          function(err, board) {
            if ((!err) && board) {
              resultJson["result"] = board.like_number;
              res.json(resultJson);
            }
          }
        );
      }
    });
  } else {
    resultJson["error"] = "로그인 해주세요";
    res.json(resultJson);
  }
});

module.exports = router;
