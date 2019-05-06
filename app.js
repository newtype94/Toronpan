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
var route_main = require('./routes/_main');
var route_home = require('./routes/_home');
var route_search = require('./routes/_search');
var route_join = require('./routes/_join');
var route_write = require('./routes/_write');
var route_paging = require('./routes/_paging');
var route_mypage = require('./routes/_mypage');
var route_pan = require('./routes/_pan');
var route_update = require('./routes/_update');
var route_remove = require('./routes/_remove');
var route_survey = require('./routes/_survey');
var route_vote = require('./routes/_vote');
var route_comment = require('./routes/_comment');


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
app.use(session({ key:'sid', secret: 'secretCode', resave: false, saveUninitialized: true })); // 세션 활성화
app.use(passport.initialize()); // passport 구동
app.use(passport.session()); // 세션 연결

//flash
app.use(flash());

//라우팅
app.all('/*', route_main);
app.all('/home', route_home);
app.all('/search/*', route_search);
app.all('/join/*', route_join);
app.all('/write/*', route_write);
app.all('/page/*', route_paging);
app.all('/mypage/*', route_mypage);
app.all('/pan/*', route_pan);
app.all('/update/*', route_update);
app.all('/remove/*', route_remove);
app.all('/survey', route_survey);
app.all('/vote/*', route_vote);
app.all('/comment/*', route_comment);

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
