// (one user -> specific date) "matching" => has writeLimit

var mongoose = require('mongoose');

var limitSchema = new mongoose.Schema({
  writer: String,
  howMany: Number,
  date: {
    type: Date,
    default: Date.now().toLocaleDateString
  }
});

module.exports = mongoose.model('writeLimit', limitSchema);

/* 사용법

  WriteLimit.findOne({
    writer: sessionUser._id,
    date: now
  }, function(err, what) {
    if (!err && !what) { //쿼리결과가 없다 = 오늘 글을 쓴적이 없다
      var writeLimit = new WriteLimit();
      writeLimit.writer = sessionUser._id;
      writeLimit.howMany = 0;
      writeLimit.date = now;
      writeLimit.save();
    } else if (!err && what) { //쿼리결과가 있다 = 오늘 글을 쓴 적이 있다
      if (what.howMany >= sessionUser.level) { //글쓰기 limit 초과
      } else if (what.howMany < sessionUser.level) { //글쓴기 limit 초과안함
        WriteLimit.findOneAndUpdate({
          writer: sessionUser._id,
          date: now
        }, {
          $inc: {
            howMany: 1
          }
        }, function() {
            req.flash('message', '성공적으로 등록되었습니다..');
            res.redirect("/home");
          });
        });
      }
    }
  );

*/
