$(document).ready(function() {
  $('.page-link').click(function() {
    var a = document.getElementById('searchForm');
    a.action = $(this).attr('data-link');
    a.submit();
  });
});
