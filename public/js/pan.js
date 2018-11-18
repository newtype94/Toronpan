$(function() {

  $("#like").click(function() {
    var panId = $("#like").attr("data-panId");
    $.ajax({
      url: "/pan/likes/"+panId,
      type: 'post',
      dataType: 'json',
      success: function(data) {
        if (data.error)
          alert(data.error);
        else if (data.result)
          $('#like_number').html(data.result);
      },
      error: function(request, status, error) {
        alert("에러");
      }
    });
  });

  $("#dislike").click(function() {
        var panId = $("#dislike").attr("data-panId");
    $.ajax({
      url: "/pan/dislikes/"+panId,
      type: 'post',
      dataType: 'json',
      success: function(data) {
        if (data.error)
          alert(data.error);
        else if (data.result)
          $('#like_number').html(data.result);
      },
      error: function(request, status, error) {
        alert("에러");
      }
    });
  });

  $(document).on("click", '.commentLike', function() {
    var commentId = $(this).attr("data-commentid");
    $.ajax({
      url: "/comment/likes/" + commentId,
      type: 'post',
      dataType: 'json',
      success: function(data) {
        if (data.error)
          alert(data.error);
        else if (data.result)
          $('#' + commentId).html(data.result);
      },
      error: function(request, status, error) {
        alert("에러");
      }
    });
  });

  $(document).on("click", '.commentDislike', function() {
    var commentId = $(this).attr("data-commentid");
    $.ajax({
      url: "/comment/dislikes/" + commentId,
      type: 'post',
      dataType: 'json',
      success: function(data) {
        if (data.error)
          alert(data.error);
        else if (data.result)
          $('#' + commentId).html(data.result);
      },
      error: function(request, status, error) {
        alert("에러");
      }
    });
  });


  $(document).on("click", '.getComment', function() {
    var thisPage = $(this).attr("data-page");
    var newHot = $(this).attr("data-where");
    var panId = $("#dislike").attr("data-panId");
    $.ajax({
      url: "/commentpage/" + newHot + "/" + thisPage + "/" + panId,
      type: "get",
      dataType: 'json',
      success: function(json) {
        var comments = ""; //댓글 input

        var comment = $.parseJSON(json);
        for (var i = 0; i < comment.length - 1; i++) { //배열의 마지막 요소는 {pageNum:N} 임의로 넣은거라서
          comments += '<div class="row">' +
            '<div class="col-md-2 fontCenter bordered">' + comment[i].writer + '</div>' +
            '<div class="col-md-8">' + comment[i].comment_date.toLocaleString("ko-KR") + '</div>' +
            '<div class="col-md-2" id="' + comment[i]._id + '">' + comment[i].like_number + '</div>' +
            '<input type="hidden" class="commentId" value="' + comment[i]._id + '" />' +
            '</div>'+

            '<div class="row">'+
            '<div class="col-md-8" style="padding : 20px;">' + comment[i].contents + '</div>'+
            '<div class="col-md-2"><button class="commentLike" data-commentid="'+comment[i]._id+'">좋아요</button></div>' +
            '<div class="col-md-2"><button class="commentDislike" data-commentid="'+comment[i]._id+'">싫어요</button></div>' +
            '</div>'+

            '<div class="row">'+
            '<form action="/littlecomment/write" method="post">' +
            '<input type="hidden" name="id" value="' + comment[i]._id + '">' +
            '<div class="col-md-3"> ###대댓글### </div>' +
            '<div class="col-md-7"><textarea class="form-control" name="contents"></textarea></div>' +
            '<div class="col-md-2"><input class="btn btn-default form-control" type="submit" value="완료"></div>' +
            '</form></div>';


          if (comment[i].littleComment !== null) {
            for (var a = 0; a < comment[i].littleComment.length; a++) {
              comments += '<div class="row" style ="padding:20px;"><div class="col-md-3"><span class="bordered">' + comment[i].littleComment[a].writer + '</span></div>' +
                '<div class="col-md-6">' + comment[i].littleComment[a].comment_date.toLocaleString("ko-KR") + '</div>' +
                '<div class="col-md-3">' + comment[i].littleComment[a].contents + '</div>';
            }
          }
          comments += '</div><hr>';
        }


        var pageNum = comment[comment.length - 1].pageNum;
        var paging = "";
        paging += '<div class="text-center">' +
          '<ul class="pagination">';

        var start = thisPage; //start
        if ((start % 10) == 0)
          start--;
        while ((start % 10) != 0) {
          start--;
        }
        start++;

        if ((start + 9) > pageNum)
          end = pageNum;
        else
          end = start + 9;

        if (start != 1) { //앞에 페이지 더있다 [<]
          var tmp = start - 1;

          paging += '<li><button class="page-link getComment" data-page="' + tmp + '" data-where="'+newHot+'"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span></button></li>';
        }
        for (var i = start; i <= end; i++) { //당장 보이는 페이지들
          paging += '<li><button class="page-link getComment" data-page="' + i + '" data-where="'+newHot+'">' + i + '</button></li>';
        }

        if (end != pageNum) { //보이는 마지막 부분이 전체 pageNum보다 작음 [>]
          var tmp = end + 1;
          paging += '<li><button class="page-link getComment" data-page="' + tmp + '" data-where="'+newHot+'"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button></li>'
        }

        paging += '</ul></div>';

        //실제 보이는 부분
        $("#commentBox").html(comments + paging);

      },
      error: function(request, status, error) {
        alert("에러");
      }
    })
  });

  $('#getFirstComment').click();

});
