/**
 * Created by Arvin on 2018/9/5.
 */
(function ($) {
  $.fn.actions = function (options) {
    var opts = $.extend({}, $.fn.actions.defaults, options);
    var reload_page = function(){
      $(".layui-laypage-btn").click();
    }
    var action_render = function(op, html){
      layui.use(['layer', 'form'], function(){
        var $ = layui.jquery, layer = layui.layer, form=layui.form;
        layer.open({
          type: 1,
          zIndex: 998,
          area: ['auto', 'auto'],
          content: html,
          btn: ['Submit', 'Close'],
          success: function(layero){
            var container = $(layero).find("#additional-form-data");
            $(container).append('<input name="action_name" value="'+op.name+'"/>');
            if(op.objects){
              op.objects.forEach(function (item, _idx) {
                $(container).append('<input name="id" value="'+item.id+'"/>');
              });
            }
          },
          yes: function(index, layero){
            action_post(op, index, layero);
          }
        })
      });
    };
    var action_post = function(op, index, layero){
      var form = $(layero).find("#action-form");
      $.ajax({
        url: op.url,
        data: form.serialize(),
        type: "POST",
        dataType: "html",
        success: function(callback){
          if(callback == 'OK'){
            layer.close(index);
            reload_page();
            layer.msg('Successful', {time: 1000, icon: 1});
          }else if(callback.indexOf('action-form') != -1){
            layero.find(".layui-layer-content").html(callback);
            var container = $(layero).find("#additional-form-data");
            $(container).append('<input name="action_name" value="'+op.name+'"/>');
            if(op.objects){
              op.objects.forEach(function (item, _idx) {
                $(container).append('<input name="id" value="'+item.id+'"/>');
              });
            }
          }else{
            layer.msg(callback, {time: 3000, icon: 5})
          }
        }
      });
    };
    var action_request = function(params){
      var data = {action_name: params.action.name, popup: true};
      $.ajax({
        url: params.action.url,
        type: "GET",
        dataType: "html",
        data: data,
        success: function(content){
          action_render(params.action, content)
        }
      });
    };
    if(opts.actions.length > 0) {
      for (var i in opts.actions) {
        var action = opts.actions[i];
        var action_css = "layui-link-btn-" + action.name;
        var action_elem = $('<a class="layui-btn layui-btn-sm '+action_css+'" title="'+action.description+'" index="'+i+'">'+action.verbose_name+'</a>');
        $(opts.actionContainer).append(action_elem);
        $(action_elem).click(function(){
          var selected_data = opts.table.checkStatus(opts.gridOpts.id).data;
          var index = $(this).attr('index')
          var action = opts.actions[index];
          var op = $.extend({}, action, {objects: selected_data});
          var params = {elem: this, action: op};
          action_request(params);
        });
      }
    }
  };
  $.fn.actions.defaults = {
    actionContainer: 'div.grid-toolbar',
    actions: []
  }
})(jQuery);