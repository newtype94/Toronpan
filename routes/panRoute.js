var express = require('express');
var router = express.Router();
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;
var multer = require('multer');
var uploadSetting = multer({
  dest: "./tmp",
  limits: {
    fileSize: 6 * 1024 * 1024
  }
});
var fs = require('fs');
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

//+++++++++++++++login++++++++++++++
// localhost:3000/login/kakao로 들어오면(get으로 들어오면) passport.authenticate를 실행(여기서는 임의로 login-kakao로 이름을 줌)
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

//+++++라우팅+++++
router.get('/', function(req, res, next) {
  res.redirect('/home');
});

router.post('/idcheck/:check', function(req, res) {
  var sending = {};
  var forCheck = req.params.check;
  User.count({
    nameJ: forCheck
  }, function(err, count) {
    if (err) throw err;
    sending["count"] = count;
    var sendingString = JSON.stringify(sending);
    res.json(sendingString);
  });
});

//회원가입 알고리즘
router.post('/joinDB', function(req, res) {

  var newUser = new User();
  var idK = req.user.idK;

  var nameJ = req.body.nameJ;
  var genderJ = req.body.genderJ;
  var yearJ = req.body.yearJ;
  var sideJ = req.body.sideJ;
  var ageJ = 20;

  User.count({
    nameJ: nameJ
  }, function(err, count) {
    if (err) throw err;
    if (count == 0) { //닉네임 중복체크
      if (((genderJ == "m") || (genderJ == "f")) &&
        ((yearJ >= 1905) && (yearJ <= 2019)) &&
        ((sideJ == "left") || (sideJ == "right"))) { //나머지 정보 한번더 검증
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

//home 렌더링(설문 포함)
router.get('/home', function(req, res, next) {
  var sessionUser = req.user;
  var now = new Date();
  now = now.toLocaleDateString();

  var poliNew;
  var poliHot;
  var sociNew;
  var sociHot;
  var freeNew;
  var freeHot;

  Board.find({
    field: 1
  }).sort({
    board_date: -1
  }).limit(10).exec(function(err, data) {
    if (err) throw err;
    poliNew = data;

    Board.find({
      field: 1,
      like_number: {
        $gte: 50
      }
    }).sort({
      board_date: -1
    }).limit(10).exec(function(err, data) {
      if (err) throw err;
      poliHot = data;

      Board.find({
        field: 2
      }).sort({
        board_date: -1
      }).limit(10).exec(function(err, data) {
        if (err) throw err;
        sociNew = data;

        Board.find({
          field: 2,
          like_number: {
            $gte: 50
          }
        }).sort({
          board_date: -1
        }).limit(10).exec(function(err, data) {
          if (err) throw err;
          sociHot = data;

          Board.find({
            field: 3
          }).sort({
            board_date: -1
          }).limit(10).exec(function(err, data) {
            if (err) throw err;
            freeNew = data;

            Board.find({
              field: 3,
              like_number: {
                $gte: 50
              }
            }).sort({
              board_date: -1
            }).limit(10).exec(function(err, data) {
              if (err) throw err;
              freeHot = data;

              if (checkLogin(sessionUser) == 2) {
                SurveyDone.findOne({
                  done_people: sessionUser.idK,
                  date: now
                }, function(err, what) {
                  if (err) throw err;
                  if (what) { //SurveyDone에 있다 = 오늘 설문에 참여했다
                    res.render('panHome', {
                      message: req.flash('message'),
                      login: 2,
                      survey: null,
                      poliNew: poliNew,
                      poliHot: poliHot,
                      sociNew: sociNew,
                      sociHot: sociHot,
                      freeNew: freeNew,
                      freeHot: freeHot
                    });
                  } else { //SurveyDone에 없다 = TodaySurvey에서 오늘 것 찾아준다
                    TodaySurvey.findOne({
                      date: now
                    }, function(err, surveyDB) {
                      if (err) {
                        console.log(err);
                        res.render("error");
                      } else if (surveyDB) { //
                        survey = {};
                        survey["q"] = surveyDB.firstQ;
                        survey["id"] = surveyDB._id;
                        res.render('panHome', {
                          message: req.flash('message'),
                          login: 2,
                          survey: survey,
                          poliNew: poliNew,
                          poliHot: poliHot,
                          sociNew: sociNew,
                          sociHot: sociHot,
                          freeNew: freeNew,
                          freeHot: freeHot
                        });
                      } else {
                        req.flash('message', '오늘 설문이 아직 안 올라왔습니다.');
                        res.render('panHome', {
                          message: req.flash('message'),
                          login: 2,
                          survey: null,
                          poliNew: poliNew,
                          poliHot: poliHot,
                          sociNew: sociNew,
                          sociHot: sociHot,
                          freeNew: freeNew,
                          freeHot: freeHot
                        });
                      }
                    });
                  }
                });
              } else {
                res.render('panHome', {
                  message: req.flash('message'),
                  login: checkLogin(sessionUser),
                  survey: null,
                  poliNew: poliNew,
                  poliHot: poliHot,
                  sociNew: sociNew,
                  sociHot: sociHot,
                  freeNew: freeNew,
                  freeHot: freeHot
                });
              }

            });
          });
        });
      });
    });
  });
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

//경험치 정산 알고리즘
router.get('/user/expup/:panid', function(req, res, next) {
  var howmuch = 0;
  var sessionUser = req.user;

  if (sessionUser == null) {
    req.flash('message', '로그인이 안되었습니다.');
    res.redirect("/home");
  } else if (req.params.panid != null) {
    Board.findOne({
      _id: req.params.panid,
      writer_id: sessionUser._id,
      exp_done: false
    }).exec(
      function(err, panDB) {
        if (err) throw err;
        if (panDB) {
          howmuch = panDB.like_number;
          User.findOneAndUpdate({
            _id: sessionUser._id
          }, {
            $inc: {
              exp: howmuch
            }
          }, function() {
            Board.findOneAndUpdate({
              _id: req.params.panid,
              writer_id: sessionUser._id,
              exp_done: false
            }, {
              $set: {
                exp_done: true,
                exp_done_howmuch: howmuch
              }
            }, function() {
              req.flash('message', '정산완료.. 경험치 획득');
              res.redirect("/home");
            });
          });
        } else {
          req.flash('message', '정산 실패..');
          res.redirect("/home");
        }
      }
    );
  } else {
    req.flash('message', '정산 실패..');
    res.redirect("/home");
  }
});

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
      res.render('panPage', {
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
      res.render('panPage', {
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

//search 알고리즘
router.post('/pan/search/:page', function(req, res) {
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
          res.render('searchPage', {
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
          res.render('searchPage', {
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
          res.render('searchPage', {
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
          res.render('searchPage', {
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
          res.render('searchPage', {
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
          res.render('searchPage', {
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

//글쓰기 렌더링
router.get('/write', function(req, res, next) {
  var now = new Date();
  now = now.toLocaleDateString();
  var sessionUser = req.user;

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
        res.render('panWrite', {
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

//글쓰기 DB 적용
router.post('/pan/write', function(req, res) {
  var now = new Date();
  now = now.toLocaleDateString();
  var sessionUser = req.user;
  if (checkLogin(sessionUser) == 0) {
    req.flash('message', '로그인 먼저 해주세요');
    res.redirect("/home");
  } else if (checkLogin(sessionUser) == 1) {
    req.flash('message', '메인 화면에서 회원가입 먼저 해주세요');
    res.redirect("/home");
  } else {
    var board = new Board();
    if (req.body.title == "") {
      board.title = "제목 없음";
    } else {
      board.title = req.body.title;
    }

    board.contents = req.body.contents;
    board.field = req.body.field;
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
      var deleteMatch = new DeleteMatch();
      deleteMatch.pan_id = board._id;
      deleteMatch.idK = sessionUser.idK;
      deleteMatch.delete_code = req.body.deleteCode;
      deleteMatch.save();
      req.flash('message', '성공적으로 등록되었습니다..');
      res.redirect("/home");
    });
  }
});


//사진 업로드 알고리즘
router.post('/upload', uploadSetting.single('file'), function(req, res) {

  var tmpPath = req.file.path;
  var fileName = req.file.filename;

  var deleteCode = JSON.stringify(req.body);
  deleteCode = deleteCode.substring(15, deleteCode.length - 2);
  console.log(deleteCode);

  //폴더 없으면 생성
  !fs.existsSync("./public/images/" + deleteCode) && fs.mkdirSync("./public/images/" + deleteCode);

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

//마이페이지
router.get('/mypage/:page', function(req, res) {
  var sessionUser = req.user;

  //마이페이지 페이징
  var page = req.params.page;
  if (page == null)
    page = 1;
  var skipSize = (page - 1) * 1;
  var limitSize = 1;
  var pageNum = 1;

  if (checkLogin(sessionUser) == 0) {
    req.flash('message', '로그인 해주세요');
    res.redirect("/home");
  } else if (checkLogin(sessionUser) == 1) {
    req.flash('message', '가입을 완료해주세요');
    res.redirect("/home");
  } else {
    User.findOne({
      _id: sessionUser._id
    }, function(err, userDB) {
      User.findOneAndUpdate({
        _id: sessionUser._id
      }, {
        $set: {
          level: parseInt((userDB.exp) / 50) + 1
        }
      }, function() {
        console.log("Level Up Complete..");
      });
    });

    Board.count({
      writer_id: sessionUser._id
    }, function(err, totalCount) {
      if (err) throw err;
      pageNum = Math.ceil(totalCount / limitSize);
      Board.find({
        writer_id: sessionUser._id
      }).sort({
        board_date: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        console.log(sessionUser);
        console.log(err);
        console.log(panArr);
        res.render('myPage', {
          login: 2,
          panArr: panArr,
          pagination: pageNum,
          page: page,
          title: "마이페이지",
          me: sessionUser
        });
      });
    });

  }
});


//글 수정 페이지
router.get('/pan/update/:id', function(req, res) {
  var sessionUser = req.user;
  if (sessionUser == null) {
    return res.status(500).json({
      error: "수정할수없음 로그인문제"
    });
  } else {
    Board.findOne({
      _id: req.params.id,
      writer: sessionUser.nameJ
    }, function(err, panDB) {
      if (err) return res.status(500).json({
        error: "database failure"
      });

      DeleteMatch.findOne({
        pan_id: req.params.id,
        idK: sessionUser.idK
      }, function(err, dmDB) {
        res.render('panUpdate', {
          pan: panDB,
          sessionUser: sessionUser,
          login: 2,
          deleteCode: dmDB.delete_code
        });
      });
    });
  }
});

//글 수정 DB 적용
router.post('/pan/updating/:id', function(req, res) {
  var title = "제목없음"
  if (req.body.title)
    title = req.body.title;
  var contents = req.body.contents;

  Board.updateOne({
    _id: req.params.id,
    writer: req.user.nameJ
  }, {
    $set: {
      title: title,
      contents: contents
    }
  }, function(err) {
    if (err) return res.status(500).json({
      error: "database failure"
    });
  });
  req.flash('message', '글 수정 완료하였습니다.');
  res.redirect('/home');
});


/* 글 삭제 */
router.get('/pan/remove/:id', function(req, res) {
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
      res.redirect("/mypage/1");
    }
  });

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
    }, function(err, board) {
      if ((!err) && board) {
        resultJson["error"] = "이미 참여했습니다";
        res.json(resultJson);
      }
    });
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
    }, function(err, board) {
      if ((!err) && board) {
        resultJson["error"] = "이미 참여함";
        console.log(resultJson);
        res.json(resultJson);
      }
    });
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
          console.log(resultJson);
          res.json(resultJson);
        }
      }
    );
  } else {
    resultJson["error"] = "로그인 안함";
    console.log(resultJson);
    res.json(resultJson);
  }
});

module.exports = router;
