var express = require('express');
var router = express.Router();
var passport = require('passport');
var KakaoStrategy = require('passport-kakao').Strategy;
var multer = require('multer');
var uploadSetting = multer({
  dest: "./tmp"
});
var fs = require('fs');
var $ = require('jquery');

var Board = require('../models/board');
var Comment = require('../models/comment');
var LittleComment = require('../models/littleComment');
var User = require('../models/user');
var WriteLimit = require('../models/writeLimit');



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
  successRedirect: '/join', // 성공하면 /main으로 가도록
  failureRedirect: '/'
}));

passport.use('login-kakao', new KakaoStrategy({
    clientID: '9f5501a5d47b1972524194b4bca7420e',
    clientSecret: 'obFC84IQrZ1mYVGx6ogpeEvdsRWO5d0R',
    callbackURL: 'http://localhost:3000/oauth'
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
  res.redirect('/page/new/1');
});

//회원가입
router.get('/join', function(req, res, next) {
  var sessionUser = req.user;
  if (sessionUser.nameJ != null)
    res.redirect('/');
  else
    res.render('join', {
      sessionUser: sessionUser
    });
});

//회원가입 알고리즘
router.post('/joinDB/:idK', function(req, res) {
  var newUser = new User();
  var idK = req.params.idK;
  var nameJ = req.body.nameJ;
  var genderJ = req.body.genderJ;
  var ageJ = req.body.ageJ;
  var sideJ = req.body.sideJ;

  User.findOneAndUpdate({
    idK: idK
  }, {
    $set: {
      nameJ: nameJ,
      genderJ: genderJ,
      ageJ: ageJ,
      sideJ: sideJ,
      level: 1,
      exp: 0
    }
  }, function(err, board) {
    if (err) {
      console.log(err);
      res.redirect('/join');
    }
    res.redirect('/');
  });
});

router.get('/user/expup', function(req, res, next){

});

//최신글 페이징
router.get('/page/new/:page', function(req, res, next) {
  var login = 0;
  if (req.user != null) {
    login = 1;
  }
  console.log(login);
  var page = req.params.page;
  if (page == "") {
    page = 1;
  }
  var skipSize = (page - 1) * 7;
  var limitSize = 7;
  var pageNum = 1;

  Board.count({}, function(err, totalCount) {
    if (err) throw err;
    pageNum = Math.ceil(totalCount / limitSize);
    Board.find({}).sort({
      board_date: -1
    }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
      if (err) throw err;
      res.render('panPage', {
        login: login,
        panArr: panArr,
        pagination: pageNum,
        page: page,
        title: "최신글"
      });
    });
  });
});

//인기글 페이징
router.get('/page/hot/:page', function(req, res, next) {
  var login = 0;
  if (req.user != null) {
    login = 1;
  }
  console.log(login);
  var page = req.params.page;
  if (page == "") {
    page = 1;
  }
  var skipSize = (page - 1) * 7;
  var limitSize = 7;
  var pageNum = 1;

  Board.count({
    like_number: {
      $gte: 50
    }
  }, function(err, totalCount) {
    if (err) throw err;
    pageNum = Math.ceil(totalCount / limitSize);
    Board.find({
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
        title: "인기글"
      });
    });
  });
});


//글 작성
router.get('/write', function(req, res, next) {
  var now = new Date();
  now = now.toLocaleDateString();
  console.log(now);
  var sessionUser = req.user;
  if (sessionUser == null) {
    req.flash('joinOrNot', '로그인 후 작성 가능합니다');
    res.render('panHome', {
      joinOrNot: req.flash('joinOrNot'),
      login: 0
    });
  } else if (sessionUser.nameJ == null) {
    req.flash('joinOrNot', '회원등록(10초 소요) 후 작성 가능합니다');
    res.render('panHome', {
      joinOrNot: req.flash('joinOrNot'),
      login: 1
    });
  } else {
    WriteLimit.findOne({
      $and: [{
        writer: sessionUser._id
      }, {
        date: now
      }]
    }, function(err, what) {
      if (!err && !what) { //오늘 글을 쓴적이 없음
        var writeLimit = new WriteLimit();
        writeLimit.writer = sessionUser._id;
        writeLimit.howMany = 0;
        writeLimit.date = now;
        writeLimit.save();
        writeLimit.save(function(err) {
          if (err) {
            console.log(err);
            res.redirect('/');
          }
          res.render('panWrite', {
            sessionUser: sessionUser,
            login: 1
          });
        });
      } else if (!err && what) {
        console.log(what);
        console.log(sessionUser.level);
        if (what.howMany >= sessionUser.level) { //글쓰기 limit 초과
          req.flash('joinOrNot', '오늘의 가능한 글쓰기 수 초과..');
          res.render('panHome', {
            joinOrNot: req.flash('joinOrNot'),
            login: 1
          });
        } else if (what.howMany < sessionUser.level) { //글쓴적은 있는데 limit 초과안함
          res.render('panWrite', {
            sessionUser: sessionUser,
            login: 1
          });
        }
      }
    });
  }
});

//글 작성 알고리즘
router.post('/pan/write', function(req, res) {
  var now = new Date();
  now = now.toLocaleDateString();
  var sessionUser = req.user;
  if (sessionUser == null) {
    req.flash('joinOrNot', '로그인 후 작성 가능합니다');
    res.render('panHome', {
      joinOrNot: req.flash('joinOrNot'),
      login: 0
    });
  } else if (sessionUser.nameJ == null) {
    req.flash('joinOrNot', '회원등록(10초 소요) 후 작성 가능합니다');
    res.render('panHome', {
      joinOrNot: req.flash('joinOrNot'),
      login: 1
    });
  } else {
    WriteLimit.findOne({
      writer: sessionUser._id,
      date: now
    }, function(err, what) {
      if (!err && !what) { //오늘 글을 쓴적이 없음
        var writeLimit = new WriteLimit();
        writeLimit.writer = sessionUser._id;
        writeLimit.howMany = 0;
        writeLimit.date = now;
        writeLimit.save();
        writeLimit.save(function(err) {
          if (err) {
            console.log(err);
            res.redirect('/');
          }
          res.render('panWrite', {
            sessionUser: sessionUser,
            login: 1
          });
        });
      } else if (!err && what) {
        if (what.howMany >= sessionUser.level) { //글쓰기 limit 초과
          req.flash('joinOrNot', '오늘의 가능한 글쓰기 수 초과..');
          res.render('panHome', {
            joinOrNot: req.flash('joinOrNot'),
            login: 1
          });
        } else if (what.howMany < sessionUser.level) { //글쓴적은 있는데 limit 초과안함
          var board = new Board();
          if (req.body.title == "") {
            board.title = "제목 없음";
          } else {
            board.title = req.body.title;
          }
          board.contents = req.body.contents;
          board.writer = req.body.writer;
          board.writer_id = sessionUser._id;
          board.board_date = Date.now();
          board.like_number = 0;
          board.hit = 0;

          board.save(function(err) {
            if (err) {
              console.log(err);
              res.redirect('/');
            }
            WriteLimit.findOneAndUpdate({
              writer: sessionUser._id,
              date: now
            }, {
              $inc: {
                howMany: 1
              }
            }, function() {
              req.flash('joinOrNot', '성공적으로 등록되었습니다..');
              res.render('panHome', {
                joinOrNot: req.flash('joinOrNot'),
                login: 1
              });
            });
          });
        }
      }
    });
  }
});

//사진 업로드 알고리즘
router.post('/upload', uploadSetting.single('upload'), function(req, res) {
  var tmpPath = req.file.path;
  console.log(tmpPath);
  var fileName = req.file.filename;
  console.log(req.file);
  var newPath = "./public/images/" + fileName;
  fs.rename(tmpPath, newPath, function(err) {
    if (err) {
      console.log(err);
    }
    var html;
    html = "";
    html += "<script type='text/javascript'>";
    html += " var funcNum = " + req.query.CKEditorFuncNum + ";";
    html += " var url = \"/images/" + fileName + "\";";
    html += " var message = \"업로드 완료\";";
    html += " window.parent.CKEDITOR.tools.callFunction(funcNum, url);";
    html += "</script>";
    res.send(html);
  });
});

// 글 읽기
router.get('/pan/:id', function(req, res) {
  var sessionUser = req.user;

  if (sessionUser == null) {
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
        login: 0,
        comment: null,
        pan: panDB
      });
    });
  } else if (sessionUser.nameJ == null) {
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
        comment: null,
        sessionUser: sessionUser
      });
    });
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
      Comment.find({
        whatBoard: req.params.id
      }, function(err, commentDB) {
        res.render('pan', {
          login: 1,
          pan: panDB,
          comment: commentDB,
          sessionUser: sessionUser
        });
      });
    });
  }
});

//마이페이지
router.get('/mypage/:page', function(req, res) {
  var sessionUser = req.user;

  var page = req.params.page;
  if (page == null)
    page = 1;

  var skipSize = (page - 1) * 7;
  var limitSize = 7;
  var pageNum = 1;
  if (sessionUser == null) {
    req.flash('joinOrNot', '로그인 후 작성 가능합니다');
    res.render('panHome', {
      joinOrNot: req.flash('joinOrNot'),
      login: 0
    });
  }else{
    Board.count({
      writer_id : sessionUser ._id
    }, function(err, totalCount) {
      if (err) throw err;
      pageNum = Math.ceil(totalCount / limitSize);
      Board.find({
        writer_id: req.user._id
      }).sort({
        board_date: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        res.render('myPage', {
          login: 1,
          panArr: panArr,
          pagination: pageNum,
          page: page,
          title: "마이페이지"
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
      res.render('panUpdate', {
        pan: panDB,
        sessionUser: sessionUser,
        login: 1
      });
    });
  }
});

//글 수정
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

  res.redirect("/");
});


/* 글 삭제 */
router.get('/pan/remove/:id', function(req, res) {
  Board.remove({
    _id: req.params.id
  }, function(err, output) {
    if (err) return res.status(500).json({
      error: "database failure"
    });
    else res.redirect("/");

  });
});

//댓글 페이징 AJAX
router.get('/commentpage/:where/:page/:panid', function(req, res, next) {
  console.log(req.params);
  var page = req.params.page;
  if (page == "") {
    page = 1;
  }
  var skipSize = (page - 1) * 5;
  var limitSize = 5;
  var pageNum = 1;

  Comment.count({
    whatBoard: req.params.panid
  }, function(err, totalCount) {
    if (err) throw err;
    pageNum = Math.ceil(totalCount / limitSize);
    if (req.params.where == "new") {
      Comment.find({
        whatBoard: req.params.panid
      }).sort({
        comment_date: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        var pageJson = {};
        pageJson["pageNum"] = pageNum;
        panArr.push(pageJson); //panArr에 페이지 개수만 꼽사리..
        console.log(panArr)
        var intoString = JSON.stringify(panArr); // panArr은 객체이고, 객체를 string으로 바꾸고
        res.json(intoString); //json으로써 보내면 json의 배열로 인식해준다.
      });
    } else if (req.params.where == "hot") {
      Comment.find({
        whatBoard: req.params.panid
      }).sort({
        like_number: -1
      }).skip(skipSize).limit(limitSize).exec(function(err, panArr) {
        if (err) throw err;
        var pageJson = {};
        pageJson["pageNum"] = pageNum;
        panArr.push(pageJson); //panArr에 페이지 개수만 꼽사리..
        console.log(panArr)
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
});

//댓글 달기
router.post('/comment/write', function(req, res) {
  var comment = new Comment();
  comment.whatBoard = req.body.id;
  comment.contents = req.body.contents;
  comment.writer = req.user.nameJ;
  comment.like_number = 0;
  comment.comment_date = Date.now();
  console.log(comment);

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
        resultJson["error"] = "이미 참여함";
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
    resultJson["error"] = "로그인 안함";
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
        resultJson["error"] = "이미 참여함";
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
    resultJson["error"] = "로그인 안함";
    console.log(resultJson);
    res.json(resultJson);
  }
});

/*좋아요*/
router.post('/pan/likes/:id', function(req, res) {
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

/*싫어요*/
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
