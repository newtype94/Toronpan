const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const flash = require("connect-flash");

//router
const route_admin = require("./routes/_admin");
const route_chat = require("./routes/_chat");
const route_comment = require("./routes/_comment");
const route_commentpoli = require("./routes/_commentPoli");
const route_home = require("./routes/_home");
const route_join = require("./routes/_join");
const route_main = require("./routes/_main");
const route_mypage = require("./routes/_mypage");
const route_notice = require("./routes/_notice");
const route_paging = require("./routes/_paging");
const route_pan = require("./routes/_pan");
const route_remove = require("./routes/_remove");
const route_search = require("./routes/_search");
const route_survey = require("./routes/_survey");
const route_update = require("./routes/_update");
const route_write = require("./routes/_write");

const app = express();

// http server를 socket.io server로 upgrade한다
const server = require("http").createServer(app);
const io = require("socket.io")(server);

let emptyRoom;
let rooms = new Object(); // {userId : roomId}

io.of("/").on("connection", socket => {
  socket.emit("connected", [socket.id]);

  socket.on("disconnect", () => {
    const userId = socket.id;

    console.log(userId + " : Client disconnected");
    const roomId = rooms[userId];

    if (roomId !== null) {
      delete rooms[userId];
      socket.leave(roomId);
      io.to(roomId).emit("chattingCancelled"); //상대방에게 disconnected 통보
    }
  });

  //socket = (1대1) 클라이언트
  socket.on("waitingStart", () => {
    const userId = socket.id;

    console.log(userId + " : waitingStart \n");
    if (!emptyRoom) {
      emptyRoom = userId;
      socket.join(userId);
      rooms[userId] = userId;
    } else {
      socket.join(emptyRoom);
      socket.room = emptyRoom;
      rooms[userId] = emptyRoom;
      io.of("/")
        .in(emptyRoom)
        .emit("chattingStart", {}); //1번방에 matched쏨
      emptyRoom = null;
    }
    console.log("emptyRoom -> " + emptyRoom + "\n");
    console.log("rooms -> " + JSON.stringify(rooms) + "\n");
  });

  socket.on("messageSend", message => {
    const userId = socket.id;

    console.log("got messag : " + message + "\n");
    rooms[userId];
    socket.broadcast.to(rooms[userId]).emit("messageReceive", [message]);
  });

  socket.on("waitingCancel", () => {
    const userId = socket.id;
    const roomId = rooms[userId];

    console.log(userId + roomId);

    if (emptyRoom === userId) {
      console.log("emptyRoom(" + emptyRoom + ") : 삭제");
      emptyRoom = null;
    }

    if (roomId !== null) {
      delete rooms.userId;
      socket.leave(roomId);
    }
  });

  socket.on("chattingCancel", () => {
    const userId = socket.id;

    const roomId = rooms[userId];
    console.log(userId + " wants to get out " + roomId);

    if (roomId !== null) {
      delete rooms[userId];
      socket.leave(roomId);
      io.to(roomId).emit("chattingCancelled"); //상대방에게 disconnected 통보
    }
  });

  socket.on("chattingCancelled", () => {
    const userId = socket.id;

    const roomId = rooms[userId];
    console.log(userId + " got kicked from " + roomId);

    if (roomId !== null) {
      delete rooms[userId];
      socket.leave(roomId);
    }
  });
});

//mongoDB + mongoose
var promise = mongoose.connect("mongodb://localhost/mydb", {
  useMongoClient: true
});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("mongoDB connected successfully");
});

//view 엔진 설정
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(cookieParser());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//express-session + passport
app.use(
  session({
    key: "sid",
    secret: "wM#1@R12#@!@",
    resave: false,
    saveUninitialized: true
  })
); // 세션 활성화
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

app.all("/admin/*", route_admin); //(렌더링)관리자 페이지 //(DB)설문 등록
app.all("/chat", route_chat); //(렌더링)
app.all("/comment/*", route_comment); //일반 //(DB)댓글 쓰기, 좋아요, 대댓글 쓰기 //(AJAX)댓글 json
app.all("/commentPoli/*", route_commentpoli); //정치 //(DB)댓글 쓰기, 좋아요, 대댓글 쓰기 //(AJAX)댓글 json
app.all("/home", route_home); //(렌더링)홈
app.all("/join/*", route_join); //(DB) 회원가입
app.all("/*", route_main); //(passport)로그인 처리
app.all("/mypage/*", route_mypage); //(렌더링)마이 페이지 //(DB)레벨 동기화
app.all("/notice/*", route_notice); //(렌더링)공지
app.all("/page/*", route_paging); //(렌더링)메뉴별 페이지
app.all("/pan/*", route_pan); //(DB-AJAX)글 좋아요싫어요 //(렌더링)글 읽기
app.all("/remove/*", route_remove); //(DB)글 삭제
app.all("/search/*", route_search); //(렌더링)검색
app.all("/survey", route_survey); //(DB)설문 참여
app.all("/update/*", route_update); //(렌더링)글 수정 //(DB)글 수정
app.all("/write/*", route_write); //(렌더링)글쓰기 //(DB)글쓰기

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const port = process.env.PORT || 80;

server.listen(port, function() {
  console.log("Socket IO server listening on port 80");
});
