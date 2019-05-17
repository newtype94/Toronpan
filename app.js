var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var flash = require('connect-flash');

//router
var route_admin = require('./routes/_admin');
var route_comment = require('./routes/_comment');
var route_commentpoli = require('./routes/_commentPoli');
var route_home = require('./routes/_home');
var route_join = require('./routes/_join');
var route_main = require('./routes/_main');
var route_mypage = require('./routes/_mypage');
var route_notice = require('./routes/_notice');
var route_paging = require('./routes/_paging');
var route_pan = require('./routes/_pan');
var route_remove = require('./routes/_remove');
var route_search = require('./routes/_search');
var route_survey = require('./routes/_survey');
var route_update = require('./routes/_update');
var route_write = require('./routes/_write');

var app = express();

//mongoDB + mongoose

var promise = mongoose.connect('mongodb://localhost/mydb', {
    useMongoClient: true
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('mongoDB connected successfully');
});


//view 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cookieParser());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//express-session + passport
app.use(session({ key:'sid', secret: 'wM#1@R12#@!@', resave: false, saveUninitialized: true })); // 세션 활성화
app.use(passport.initialize()); // passport 구동
app.use(passport.session()); // 세션 연결

app.use(flash());

//non-www redirects to wwww
app.all(/.*/, function(req, res, next) {
  const host = req.header("host");
  if (host.match(/^www\..*/i)) {
    next();
  } else {
    res.redirect(301, "http://www." + host + req.url);
  }
});

app.all('/admin/*', route_admin); //(렌더링)관리자 페이지 //(DB)설문 등록
app.all('/comment/*', route_comment); //일반 //(DB)댓글 쓰기, 좋아요, 대댓글 쓰기 //(AJAX)댓글 json
app.all('/commentPoli/*', route_commentpoli); //정치 //(DB)댓글 쓰기, 좋아요, 대댓글 쓰기 //(AJAX)댓글 json
app.all('/home', route_home); //(렌더링)홈
app.all('/join/*', route_join); //(DB) 회원가입
app.all('/*', route_main); //(passport)로그인 처리
app.all('/mypage/*', route_mypage); //(렌더링)마이 페이지 //(DB)레벨 동기화
app.all('/notice/*', route_notice); //(렌더링)공지
app.all('/page/*', route_paging); //(렌더링)메뉴별 페이지
app.all('/pan/*', route_pan); //(DB-AJAX)글 좋아요싫어요 //(렌더링)글 읽기
app.all('/remove/*', route_remove); //(DB)글 삭제
app.all('/search/*', route_search); //(렌더링)검색
app.all('/survey', route_survey); //(DB)설문 참여
app.all('/update/*', route_update); //(렌더링)글 수정 //(DB)글 수정
app.all('/write/*', route_write); //(렌더링)글쓰기 //(DB)글쓰기

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
