/**
 * Created by Arvin on 2018/8/15.
 */
(function ($) {
  function error_tip(msg) {
    var tip = '<img src="/media/images/tip.png" style="margin-right: 4px;margin-top: -3px"/>' + msg;
    $(".error_tip").html(tip);
  }

  $.fn.login = function (options) {
    var opts = $.extend({}, $.fn.login.defaults, options);
    var loadingIndex = 0;
    $(this).click(function () {
      $(".error_tip").html("&nbsp;");
      if ($.trim($(opts.username).val()) === "" || $.trim($(opts.pwd).val()) === "") {
        $(opts.username).select();
        error_tip(gettext("username_and_password_is_required"));
        return false;
      }
      $("#id_login_type").val('pwd');
      var serialize_form = $(opts.form).serialize();
      layui.use(['layer'], function () {
        var layer = layui.layer;
        loadingIndex = layer.load(1, {
          shade: [0.1, '#fff']
        });
      });
      $(opts.username).attr('disabled', 'disabled');
      $(opts.pwd).attr('disabled', 'disabled');
      $.ajax({
        url: opts.url,
        type: "POST",
        data: serialize_form,
        dataType: "json",
        success: function (callback) {
          var ret = callback.ret;
          if (ret === 0) {
            //var index = window.location.href.indexOf("?next=");
            //var self_index = window.location.href.indexOf("selfservice");
            //if(index!=-1 && is_focus_username && self_index==-1){
            //    window.location.href = window.location.href.substring(index+6);
            //}else{
            //    window.location.href = opts.url;
            //}
            window.location.reload();
          } else {
            layer.close(loadingIndex);
            $(opts.username).removeAttr('disabled');
            $(opts.pwd).removeAttr('disabled');
            $(opts.username).select();
            $(opts.pwd).val('');
            $(opts.pwd).blur();
            error_tip(callback.message);
          }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          layer.close(loadingIndex);
          $(opts.username).removeAttr('disabled');
          $(opts.pwd).removeAttr('disabled');
          window.location.reload();
        }
      });
    });
    var login_btn = this;
    $(opts.pwd).keypress(function (event) {
      if (event.keyCode === 13) {
        $(login_btn).click();
      }
    });
  };
  $.fn.login.defaults = {
    username: "#id_username",
    pwd: "#id_password",
    form: "#login-form",
    url: ""
  };
})(jQuery);
$(function () {
  if (document.body.offsetWidth < 900 || document.body.offsetHeight < 360) {
    top.moveTo(0, 0);
    top.resizeTo(screen.availWidth, screen.availHeight);
  }
  var btn_map = {
    id_usernameTip: "#id_username",
    id_passwordTip: "#id_password",
    id_empNameTip: "#id_empName",
    id_empPwdTip: "#id_empPwd"
  };
  $(".login_inp_tip").focus(function () {
    var focus_elem = btn_map[$(this).attr('id')];
    $(this).hide();
    $(focus_elem).show();
    $(focus_elem).focus();
  });
  $(".login_inp").blur(function () {
    if ($(this).attr('id') === 'id_username' && $(this).val() === "") {
      $(this).hide();
      $("#id_usernameTip").show();
    } else if ($(this).attr('id') === 'id_password' && $(this).val() === "") {
      $(this).hide();
      $("#id_passwordTip").show();
    } else if ($(this).attr('id') === 'id_empName' && $(this).val() === "") {
      $(this).hide();
      $("#id_empNameTip").show();
    } else if ($(this).attr('id') === 'id_empPwd' && $(this).val() === "") {
      $(this).hide();
      $("#id_empPwdTip").show();
    }
  });
});
var switchLogin = function (curForm, form) {
  $("div.login_box_type a").removeClass("active");
  $(form).addClass("active");
  $("div.login_box form").hide();
  $(curForm).show();
};

function register(url) {
  $.ajax({
    url: url,
    type: "GET",
    dataType: "html",
    success: function (panel) {
      layer.closeAll();
      layer.open({
        title: 'About the system'
        , type: 1
        , zIndex: 1001
        , area: ['620px', '490px']
        , content: panel
        , cancel: function(index){
          window.location.reload();
          return true;
        }
      });
    }, error: function () {

    }
  });
}

function expiredDaysCheck() {
  $.ajax({
    url: '/expiredDays/',
    type: "GET",
    dataType: "json",
    success: function (response) {
      var msg = response.msg;
      if (msg !== '') {
        var tip = '<img src="/media/images/tip.png" style="margin-right: 4px;margin-top: -3px"/>' + msg;
        $(".error_tip").html(tip);
      }
    }, error: function () {

    }
  });
}

function getCaptcha(imgContainer){
  $.ajax({
    url:"/base/refresh_captcha/"
    ,type:"GET"
    ,dataType:"json"
    ,success: function (response) {
      var base64 = 'data:image/png;base64,'+ response.captcha;
      $("#"+imgContainer).attr('src', base64);
    }, error: function () {

    }
  })
}