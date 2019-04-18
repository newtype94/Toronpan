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

var panRoute = require('./routes/panRoute');

var app = express();

//mongoDB + mongoose


// var promise = mongoose.connect('mongodb://localhost/mydb', {
// var promise = mongoose.connect('mongodb://newtype94:dydgns88!@ds057816.mlab.com:57816/heroku_66g54sp8', {
var promise = mongoose.connect('mongodb://newtype94:dydgns88!@ds057816.mlab.com:57816/heroku_66g54sp8', {
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

//대 라우팅
app.use('/', panRoute);

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
