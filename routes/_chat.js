const express = require('express');
const router = express.Router();

//설문 관리자 페이지(임시) 렌더링
router.get('/chat', function(req, res, next) {
  res.render('chat', {});
});

module.exports = router;
