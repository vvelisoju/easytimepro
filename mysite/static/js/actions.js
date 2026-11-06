"use strict";

/**
 * Refactor by Boyce on 2019/01/24.
 */

// noinspection ES6ModulesDependencies
(function ($) {
  var CONST_ALL_WIDTH = '__all__'
    , CONST_BEST_FIT_KEY = '__fit__'
    , CONST_BEST_SCALE_KEY = '__scale__'
    , CONST_TOOLBAR_KEY = '__toolbar__'
    , CONST_CELL_BORDER_WIDTH = 1
    , CONST_LAST_FIT_OP = 'last_fit_op'
    , CONST_DIALOG_SIDE_MARGIN_SCALE = 0.05
    , CONST_MODEL_HISTORY_SCALE_PERCENT = 0.8
    , CONST_TOLERANT_GAP_LIMIT = 10
    , CLASS_EMPTY_SLOT = 'slot-empty'
    , CLASS_PLACE_HOLDER = 'slot-place-holder'
    , CLASS_DRAG_SLOT = 'slot-drag'
    , CLASS_DRAG_ITEM = 'slot-drag-item'
    , CLASS_TOOL_PANEL = 'layui-table-tool-panel'
    , CLASS_SWITCHER = 'layui-form-switch'
    , CLASS_SWITCHER_ON = 'layui-form-onswitch'
    , CLASS_TABLE_PREFER_PREFIX = 'table-prefer-'
    , CLASS_TABLE_PREFER_OFF_SUFFIX = '-off'
    , CONST_CSRF_TOKEN_PUBLIC = 'csrfmiddlewaretoken'
    , CONST_GRID_TRAIT = 'layui-col-'
    , CONST_FILTER_GRID_TRAIT = '[class*=' + CONST_GRID_TRAIT + ']'
    , KEY_TABLE_CONTAINER_PREFERENCES = '__TABLE_CONTAINER_PREFER__'
    , KEY_LAST_BEST_FIT_LAPSE = '__LAPSE_BEST_FIT__'
    , KEY_LAST_SIDE_MENU_OPEN_STATUS = '__LAST_SIDE_MENU_STATUS__'
    , $SWITCH_MENU = '#side_menu .zk-switch-menu'
    , DEFAULT_CONTAINER_PREFER = (
    {
      'highlight_identifier': true,
      'show_zebra_stripes': false,
      'show_line_division': true
    }), WEST_TOOL_PANEL_HTML_TEMPLATE = (
    [
      '<div class="layui-inline" data-name="%(name)s" ',
      'data-arrowtip="%(tips)s" title="%(tips)s" lay-event="%(event)s">',
      '<i class="fa fa-fw %(icon)s"></i>',
      '</div>'
    ].join(''))
    , COLUMNS_PANEL_EVENT_FILTER = 'utilities_for_data_grid_columns'
    , COLUMNS_PANEL_HTML_TEMPLATE = interpolate(
    [
      '<li>',
      '<input type="checkbox" lay-skin="primary" ',
      'name="%(name)s" title="%(title)s" ',
      '%(option_checked)s %(option_fixed)s data-key="%(data_key)s" data-parent-key="%(data_parent_key)s" ',
      'lay-filter="%(lay_filter)s">',
      '</li>'
    ].join(''), {'lay_filter': COLUMNS_PANEL_EVENT_FILTER})
    , EXPAND_PANEL_EVENT_FILTER = 'utilities_for_data_grid_expand'
    , EXPAND_PANEL_SWITCHER_TEXT = '' // ON|OFF
    , PANEL_HTML_TEMPLATE_SWITCHER = (
    [
      '<li>',
      '<input type="checkbox" lay-skin="switch" data-op="%(op)s" name="%(name)s" ',
      '%(option_checked)s %(option_disabled)s lay-text="%(lay_text)s" lay-filter="%(lay_filter)s">',
      '<span>%(name)s</span>',
      '</li>'
    ].join(''))
    , EXPAND_PANEL_HTML_TEMPLATE = interpolate(
    PANEL_HTML_TEMPLATE_SWITCHER,
    {
      'lay_text': EXPAND_PANEL_SWITCHER_TEXT, 'lay_filter': EXPAND_PANEL_EVENT_FILTER
    })
    , PREFER_PANEL_EVENT_FILTER = 'utilities_for_data_grid_preferences'
    , PREFER_PANEL_SWITCHER_TEXT = '' // ON|OFF
    , PREFER_PANEL_HTML_TEMPLATE = interpolate(
    PANEL_HTML_TEMPLATE_SWITCHER,
    {
      'lay_text': PREFER_PANEL_SWITCHER_TEXT, 'lay_filter': PREFER_PANEL_EVENT_FILTER
    });


  $.fn.actions = function (options) {
    var slotArry = [], slotArryFlag = false;
    var opts = $.extend({}, $.fn.actions.defaults, options);
    if (!opts.init_disabled_fields) {
      opts.init_disabled_fields = [];
    }
    var available_action_panel_east = ['fit', 'expand', 'history', "column", "exports", "preferences"];
    if (opts.is_history) {
      opts.scale = opts.scale * CONST_MODEL_HISTORY_SCALE_PERCENT;
    }

    var disabled_action_panel_east = opts.disabled_action_panel_east;
    if (disabled_action_panel_east) {
      _.each(disabled_action_panel_east, function (elem) {
        var loc = available_action_panel_east.indexOf(elem);
        if (loc !== -1) {
          available_action_panel_east.splice(loc, 1);
        }
      });
    }
    if (!opts.prefer_best_fit_op) {
      opts.prefer_best_fit_op = 'best_scale';
    }

    if (!opts.callback) {
      opts.callback = {};
    }
    if (!opts.dimension.actions) {
      opts.dimension.actions = {};
    }

    opts.best_fit_tips_index = null;
    // init
    actionTemplate();

    var synced_disabled_fields = JSON.parse(JSON.stringify(opts.init_disabled_fields)),
      last_sync_disabled_fields = [synced_disabled_fields.concat()],
      last_hidden_fields = [],
      cur_hidden_fields = [],
      init_column_list = [],
      cur_column_list = [],
      total_column_num,
      client_x, client_y,
      pseudo_drag_element = null,
      pointed_element = null,
      related_slot = null,
      current_drag_item = null,
      slot_placeholder = $('<li class="' + CLASS_PLACE_HOLDER + '"/>'),
      panel_dom_dict = {},
      relative_offset = {
        x: 0,
        y: 0
      },
      title_map_for_sync = {
        0: gettext('reset_the_disabled_fields_of_cloud'),
        1: gettext('sync_disabled_fields_to_cloud')
      }; // make a shallow copy

    ////Reload currently page
    var reload_page = function reload_page(extra_options) {
      if (extra_options === undefined) {
        extra_options = {};
      }
      var options = {page: {curr: 1}};
      opts.curTable.reload(opts.tableId, $.extend(true, options, extra_options));
      // init after reload
      actionTemplate();
      panel_dom_dict = {};
    }, default_callback_action = $.noop;


    var get_action_dimension = function (action_name) {
      var _dimension = opts.dimension.actions[decodeHex(action_name)] || {},
        _width = _dimension[0] ? _dimension[0] + 'px' : 'auto',
        _height = _dimension[1] ? _dimension[1] + 'px' : 'auto';
      return {
        width: _width,
        height: _height
      };
    };


    function action_callback(layer, form, index, op, layero, disabled) {
      return function (response) {
        if (disabled !== undefined) {
          disabled.attr('disabled', 'disabled');
        }
        layer.closeAll('loading');
        if (op.simple) {
          // first request is post
          if (response.code === 0) {
            if(!op['keep_page_open']){
              layer.close(index);
              var specific_callback = opts.callback[decodeHex(op['name'])],
                specific_callback_done = specific_callback ? specific_callback['done'] : undefined;

              if (specific_callback_done && typeof specific_callback_done === 'function') {
                specific_callback_done.apply(opts);
              } else {
                default_callback_action.apply(opts);
              }
              reload_page();
              layer.msg(gettext("action_notification_successful"), {time: 1000, icon: 1});
            }else {
              layer.msg(gettext("action_notification_successful"), {time: 1000, icon: 1});
            }
          } else {
            parse_msg_show_tips(layero, response.msg);
            // layer.msg(server_message, {time: 3000, icon: 5});
          }
        } else {
          // first request is get
          var _dimension = get_action_dimension(op.name);
          layer.close(index);
          layer.open({
            type: 1,
            zIndex: 998,
            area: [_dimension.width || opts.dimension.width, _dimension.height || opts.dimension.height],
            content: response,
            title: op['verbose_name'],
            btn: [gettext("btn_confirm"), gettext("btn_cancel")],
            success: function success(/*layero*/) {
              $("#" + opts.model + "_edit_form").prop("action", op.url);
              layui.use(["form", "laydate"], function () {
                var form = layui.form;
                var laydate = layui.laydate;
                $("form.layui-form input.layui-datetime").each(function () {
                  laydate.render({elem: this, type: "datetime"});
                });
                $("form.layui-form input.layui-date").each(function () {
                  laydate.render({elem: this, type: "date"});
                });
                $("form.layui-form input.layui-time").each(function () {
                  laydate.render({elem: this, type: "time"});
                });
                form.render();
              });
            },
            yes: function yes(index, layero) {
              op.simple = true;
              action_post(op, index, layero);
            },
            end: function end() {
              layer.closeAll("tips");
            }
          });
        }
      };
    }

    // Action post handler
    var action_post = function action_post(op, index, layero) {
      var valid_form = window["before_submit_" + opts.tableId];
      if (valid_form && $.isFunction(valid_form) && !valid_form()) {
        return;
      }
      var data_form = $(layero).find(".action-form,.data-form");
      if (data_form.length === 0) {
        //If action without form, then generate a temp form.
        var form_template = [
          '<form method="post">',
          "</form>"
        ];
        data_form = $(form_template.join());
      }
      var requestType = op.simple ? "POST": "GET";
      // noinspection JSCheckFunctionSignatures
      var disabled = data_form.find(':input:disabled').removeAttr('disabled'),
        form_feedback_alliance = {
          'action_name': op.name,
          'id': (function () {
            var result = [];
            if (op.objects) {
              op.objects.forEach(function (item/*, _idx*/) {
                result.push(item.id);
              });
            }
            return result;
          })()
        };
      form_feedback_alliance[CONST_CSRF_TOKEN_PUBLIC] = opts.csrf;
      $(data_form).submit(function (e) {
        e.preventDefault();
        var formData = new FormData(this);
        _.each(_.omit(form_feedback_alliance, get_prop_from_iterable(formData, 'keys')), function (f_value, f_key) {
          switch (true) {
            case type(f_value) === 'function':
              f_value = f_value();
              formData.append(f_key, f_value);
              break;
            case type(f_value) === 'array':
              _.each(f_value, function (_value) {
                formData.append(f_key, _value);
              });
              break;
            default:
              formData.append(f_key, f_value);
              break;
          }
        });

        var ajax_opts = {
          url: op.url,
          type: requestType,
          success: action_callback(layer, data_form, index, op, layero, disabled),
          error: function () {
            disabled.attr('disabled', 'disabled');
            layer.closeAll('loading');
          },
          processData: false, contentType: false
        };

        if (requestType === "GET") {
          ajax_opts['url'] = concatenate_url(ajax_opts.url, formData, [CONST_CSRF_TOKEN_PUBLIC]);
          ajax_opts['dataType'] = "html";
        } else {
          ajax_opts['data'] = formData;
          ajax_opts['dataType'] = "json";
        }

        $.ajax(ajax_opts);
        return false;
      }).trigger('submit');
      $(data_form).off('submit');
      // noinspection ES6ModulesDependencies
      layer.load();
    };

    // Action page render
    var action_render = function action_render(op, html) {
      layui.use(["layer", "form"], function () {
        var $ = layui.jquery,
          layer = layui.layer,
          form = layui.form,
          _dimension = get_action_dimension(op.name);

        layer.open({
          type: 1,
            resize:false,
          zIndex: 998,
          area: [_dimension.width, _dimension.height],
          content: html,
          title: op['verbose_name'],
          btn: [gettext("btn_confirm"), gettext("btn_cancel")],
          yes: function yes(index, layero) {
            if($(layero).find("#idSubmitTrigger"+op.name).length > 0){
              form.on("submit(submitTrigger"+op.name+")", function (data) {
                action_post(op, index, layero);
                return false;
              });
              $("#idSubmitTrigger"+op.name).click();
            }else {
              action_post(op, index, layero);
            }
          },
          end: function end() {
            layer.closeAll("tips");
          },
          success: function success(layero) {
            // var c = $(layero).find("#additional-form-data");
            // $(c).append('<input name="action_name" value="' + op.name + '"/>');
            // if (op.objects) {
            //   op.objects.forEach(function (item/*, _idx*/) {
            //     $(c).append('<input name="id" value="' + item.id + '"/>');
            //   });
            // }
            form.render();
            $.fn.adjust_label_width_dynamically(layero);
            setTimeout(function () {
              var col_trait = '[class^=layui-col-]',
              all_col = $(col_trait, layero);
              $.fn.adjust_label_width_dynamically([all_col.filter(function (index, elem) {
                return $(elem).parent().closest(col_trait).length;
              }), all_col.filter(function (index, elem) {
                return $(elem).parent().closest(col_trait).length === 0;
              })], '.layui-form-checkbox>span');
              // $.fn.adjust_label_width_dynamically([$('[class^=layui-col-]:not([class$=12])', layero).filter(function
              // (elem) { return $(elem).closest('[class^=layui-col-]').length; })], '.layui-form-checkbox>span');
            }, 300);

            // 如果宽度是auto的情况下，需要自动加上firefox和ie下滚动条兼容问题
            if (_dimension.width == 'auto') {
              var action_form = $('.data-form').parent().first()
              var div_width = action_form.css('width');
              if(div_width){
                div_width = (parseInt(div_width.slice(0, -2)) + 30) + 'px'
                action_form.css('width', div_width);
              }
            }
          }
        });
      });
    };
    // Action Request Handler
    var action_request = function action_request(params) {
      var data = {
        action_name: params.action.name,
        _popup: true
      };
      if (url_params !== undefined) {
        for (let key in url_params) {
          data[key] = url_params[key];
        }
      }
      var load_index = layer.load(0, {
        shade: 0.1,
        time: 0
      });
      $.ajax({
        xhr: xhr_request_with_progress(),
        url: params.action.url,
        type: "GET",
        dataType: "html",
        data: data,
        success: function success(content) {
          layer.close(load_index);
          action_render(params.action, content);
        },
        error: function () {
          layer.close(load_index);
          error_prompt(gettext('Oops! The requested action is unavailable currently.'));
        }
      });
    };
    var get_where = function get_where() {
      var search_inputs = {};
      $(opts.container)
        .find("div.search-form input,select")
        .each(function () {
          var val = $(this).val();
          var f = $(this).attr("name");
          if (f && val) {
            search_inputs[f] = val;
          }
        });
      return search_inputs;
    };

    var do_search = function do_search() {
      var search_inputs = get_where();
      opts.table.reload(opts.curTable.config.id, {where: search_inputs});
      //opts.curTable.reload({where: search_inputs});
      //actionTemplate();
    };
    var search_name = opts.model + "-search";
    var search_clear_name = opts.model + "-search-clear";
    opts.form.on("submit(" + search_name + ")", function () {
      do_search();
    });
    opts.form.on("submit(" + search_clear_name + ")", function () {
      $(opts.container)
        .find(".search-form .layui-input-inline input,select")
        .each(function () {
          $(this).val("");
        });
      do_search();
    });

    function actionTemplate() {
      var action_bar_east = {
        // selectall: {
        //     name: 'Select All',
        //     tips: gettext("grid_menu_selectall"),
        //     icon: "fa-check",
        //     event: opts.model + "_selectall"
        //   },
          fit: {
            name: 'Best Fit',
            tips: gettext("grid_menu_fit"),
            icon: "fa-magic",
            event: opts.model + "_fit"
          },
          expand: {
            name: 'Expand',
            tips: gettext("grid_menu_expand"),
            icon: "fa-expand",
            event: opts.model + "_expand"
          },
          history: {
            name: 'History',
            tips: gettext("grid_menu_history"),
            icon: "fa-history",
            event: opts.model + "_history"
          },
          column: {
            name: 'Columns',
            tips: gettext("grid_menu_columns"),
            icon: "fa-columns",
            event: opts.model + "_columns"
          },
          exports: {
            name: "Export",
            tips: gettext("grid_menu_export"),
            icon: "fa-share",
            event: opts.model + "_export"
          },
          preferences: {
            name: 'Preferences',
            tips: gettext("grid_menu_preferences"),
            icon: "fa-sliders",
            event: opts.model + "_prefer"
          }
        },
        _temp_container = [];
      // noinspection ES6ModulesDependencies
      _.each(available_action_panel_east, function (action_name) {
        var item = action_bar_east[action_name];
        _temp_container.push(interpolate(
          WEST_TOOL_PANEL_HTML_TEMPLATE,
          {
            name: item.name,
            tips: item.tips,
            icon: item.icon,
            event: item.event
          },
          '')
        );
      });

      $(opts.container)
        .find(".layui-table-tool .layui-table-tool-self")
        .html(_temp_container.join(""));

      function get_disabled_fields(panel, stop_in_first_disabled) {
        var fields = [],
          all_checkbox = panel.find('li > input[type=checkbox]'),
          total_num = all_checkbox.length;

        for (var i = 0; i < total_num; i++) {
          if (!all_checkbox[i].checked) {
            fields.push(all_checkbox[i].name);
            if (stop_in_first_disabled) {
              break;
            }
          }
        }
        return fields;
      }

      function request_handler(options) {
        var data, repr, callback, done_callback, fail_callback;
        if (options !== undefined) {
          data = options['data'];
          repr = options['repr'];
          callback = options['callback'];
        }

        if (data === undefined || repr === undefined) {
          throw Error('Missing critical arguments');
        }
        if (callback) {
          done_callback = callback['done'];
          fail_callback = callback['fail'];
        }

        if (done_callback === undefined) {
          done_callback = $.noop;
        }
        if (fail_callback === undefined) {
          fail_callback = $.noop;
        }

        $.ajax({
          url: opts.disabled_fields_url,
          type: "POST",
          dataType: "json",
          // contentType: 'application/json',
          data: $.extend({}, data, {model: opts.model}),
          success: function success(res) {
            if (res.code === 0) {
              var _msg = res.msg;
              if (_msg === undefined) {
                _msg = gettext(repr + ' successfully');
              }
              layer.msg(gettext(_msg), {
                //title: 'info',
                icon: 1,
                time: '1500',
                shade: 0.1,
                closeBtn: 1
              });
              done_callback.apply(this);
            } else {
              parse_msg_show_tips(null, res.msg);
              fail_callback.apply(this);
            }
          },
          error: function () {
            fail_callback.apply(this);
          }
        });
      }

      function maintain_restore_status(panel) {
        var span_restore = $(panel).find('span[data-name=restore]');
        if (last_sync_disabled_fields.length) {
          span_restore.addClass('selected');
        } else {
          span_restore.removeClass('selected');
        }
      }

      function maintain_checkbox_status(panel) {
        cur_hidden_fields = get_disabled_fields(panel);
        var all_selected = cur_hidden_fields.length === 0;
        var span_all = $(panel).find('span[data-name=all]'),
          span_sync = $(panel).find('span[data-name=sync]');
        if (all_selected) {
          span_all.addClass('selected');
          span_all.find('i').removeClass('fa-square-o').addClass('fa-check-square-o');
        } else {
          span_all.removeClass('selected');
          span_all.find('i').removeClass('fa-check-square-o').addClass('fa-square-o');
        }
        if (isArraysEqual(cur_hidden_fields, synced_disabled_fields) && (!opts.use_backend_hidden_fields)) {
          span_sync.addClass('selected');
          span_sync.children('a').prop('title', title_map_for_sync[0]);
        } else {
          span_sync.removeClass('selected');
          span_sync.children('a').prop('title', title_map_for_sync[1]);
        }
        maintain_restore_status(panel);
      }

      function restore_to_last_sync(parent_dom) {
        var _history_num = last_sync_disabled_fields.length;
        if (_history_num) {
          var _last = last_sync_disabled_fields[_history_num - 1], // peek first
            all_check_box = parent_dom.find('li > input[type=checkbox]'),
            current_disabled_fields = get_disabled_fields(parent_dom);
          if (!isArraysEqual(current_disabled_fields, _last)) {
            last_sync_disabled_fields.pop();
            _.each(all_check_box, function (elem) {
              var is_include = _last.includes(elem.name);
              if ((elem.checked && is_include) || (!elem.checked && !is_include)) {
                $(elem).siblings('.layui-form-checkbox').trigger('click');
              }
            });
          }
          normal_prompt(gettext('action_notification_successful'), 'auto');
        } else {
          error_prompt('last synced fields were not found');
        }
        maintain_restore_status(parent_dom);
      }

      function checkbox_click_handler(parent_dom, from_enable) {
        var all_check_box = parent_dom.find('li > input[type=checkbox]');
        _.each(all_check_box, function (elem) {
          if ((!elem.checked && from_enable) || (elem.checked && !from_enable)) {
            $(elem).siblings('.layui-form-checkbox').trigger('click');
          }
        });
      }

      function column_filter_handler() {
        var that = $(this),
          name = that.data('name'),
          column_ctrl = that.parent(),
          tool_panel = column_ctrl.parent(),
          $search_field_str = 'input[role=search]';

        that.toggleClass('selected');
        // from disable to enable
        if (that.hasClass('selected')) {
          switch (name) {
            case 'all':
              //: find all checkbox firstly, then dispatch them click event
              checkbox_click_handler(tool_panel, true);
              that.find('i').removeClass('fa-square-o').addClass('fa-check-square-o');
              break;
            case 'sync':
              var disabled_fields = get_disabled_fields(tool_panel);
              if ($.isArray(disabled_fields)) {
                if (disabled_fields.length === total_column_num) {
                  error_prompt('Please Select At Least One Column', 'auto');
                  return;
                }
                request_handler({
                  data: {
                    op: 'override',
                    field: JSON.stringify(disabled_fields)
                  },
                  repr: 'synced',
                  callback: {
                    done: function () {
                      last_sync_disabled_fields.push(synced_disabled_fields);
                      synced_disabled_fields = disabled_fields.concat();
                      maintain_restore_status(tool_panel);
                    }
                  }
                });
              } else {
                request_handler({
                  data: {
                    op: 'reset',
                    field: JSON.stringify(disabled_fields)
                  },
                  repr: 'Reset to default value',
                  callback: {
                    done: function () {
                      last_sync_disabled_fields.push(synced_disabled_fields);
                      synced_disabled_fields = [];
                      maintain_restore_status(tool_panel);
                    }
                  }
                });
                // error_prompt('Please exclude unwanted column first', 'auto');
              }
              break;
            case 'restore':
              error_prompt('last synced fields were not found');
              that.toggleClass('selected');
              break;
            case 'search':
              column_ctrl.find($search_field_str).show();
              break;
            default:
              console.log('undefined operation.');
          }
        } else { // from enable to disable
          switch (name) {
            case 'all':
              checkbox_click_handler(tool_panel, false);
              that.find('i').removeClass('fa-check-square-o').addClass('fa-square-o');
              break;
            case 'sync':
              // if (get_disabled_fields(tool_panel).length === 0) {
              //   error_prompt(gettext('In default state already'), 'auto');
              // } else {
                layer.confirm(gettext('Are you sure to reset the disabled fields stored in cloud?'), {
                  title: gettext('layer_title'),
                  icon: 3,
                  btn: [gettext('btn_confirm'), gettext('btn_cancel')]
                }, function (index) {
                  checkbox_click_handler(tool_panel, true);
                  request_handler({
                    data: {
                      op: 'reset',
                      field: JSON.stringify(disabled_fields)
                    },
                    repr: 'reset',
                    callback: {
                      done: function () {
                        last_sync_disabled_fields.push(synced_disabled_fields);
                        synced_disabled_fields = [];
                        maintain_restore_status(tool_panel);
                        layer.close(index);
                      }, fail: function () {
                        layer.close(index);
                      }
                    }
                  });
                }, function () {
                });
              // }
              break;
            case 'restore':
              restore_to_last_sync(tool_panel);
              break;
            case 'search':
              column_ctrl.find($search_field_str).hide();
              break;
            default:
              console.log('undefined operation.');
          }
        }
      }

      function compare_num(a, b) {
        return a - b;
      }

      function mouse_move_on_window(e) {
        if (pseudo_drag_element === null) {
          return;
        }
        e.preventDefault();
        var list, new_client_x = e.clientX + (document.body.scrollLeft || document.documentElement.scrollLeft),
          new_client_y = e.clientY + (document.body.scrollTop || document.documentElement.scrollTop),
          left = parseInt(pseudo_drag_element[0].style.left) || 0,
          top = parseInt(pseudo_drag_element[0].style.top) || 0;
        pseudo_drag_element[0].style.left = left + (new_client_x - client_x) + 'px';
        pseudo_drag_element[0].style.top = top + (new_client_y - client_y) + 'px';
        client_x = new_client_x;
        client_y = new_client_y;

        pseudo_drag_element.addClass('layui-hide');
        // pointed_element = $(document.elementFromPoint(client_x, top - 2));
        pointed_element = $(document.elementFromPoint(
          client_x - (document.body.scrollLeft || document.documentElement.scrollLeft),
          client_y - (document.body.scrollTop || document.documentElement.scrollTop)
          )
        );
        pseudo_drag_element.removeClass('layui-hide');
        if (pointed_element.closest('.' + CLASS_DRAG_ITEM).length) {
          // console.log('[detect] pointed to self', pointed_element.closest('.' + CLASS_DRAG_ITEM).length);
          return;
        }

        related_slot = pointed_element.closest('ul');
        if (!related_slot.hasClass(CLASS_DRAG_SLOT)) {
          // console.log('[detect] It is not drag slot', pointed_element.closest('.' + CLASS_DRAG_ITEM).length);
          return;
        }
        switch (true) {
          case pointed_element.closest('li').length > 0:
            // console.log('has slotItem');
            pointed_element = pointed_element.closest('li');
            var before = null;
            while (true) {
              var _input_field = pointed_element.find('input');
              if (_input_field.length && _input_field.data('fixed') !== undefined) {
                // console.log('has fixed attribute');
                // left fixed column
                pointed_element = pointed_element.next('li:not(.' + CLASS_PLACE_HOLDER + ')');
                before = true;
                // right fixed column
                if (pointed_element.length === 0) {
                  pointed_element = pointed_element.prev('li:not(.' + CLASS_PLACE_HOLDER + ')');
                  before = false;
                }
              } else {
                break;
              }
            }
            if (pointed_element.length) {
              var pointed_element_rect = pointed_element.get(0).getBoundingClientRect();
              // console.log(client_x, top - 2);
              // console.log('benchmark line:', pointed_element_rect.top + pointed_element.height() / 2);
              if (before === null) {
                before = e.pageY < (pointed_element_rect.top + pointed_element.height() / 2);
              }

              if (before) {
                pointed_element.before(slot_placeholder);
              } else {
                pointed_element.after(slot_placeholder);
              }
            }
            break;
          case pointed_element.hasClass(CLASS_EMPTY_SLOT):
            // console.log('has empty slotClass');
            list = pointed_element.find('li');
            if (list.length) {
              if (list.length > 1) {
                list.filter(':gt(0)').remove();
              }
            } else {
              list = $(document.createElement('li'));
              pointed_element.append(list);
            }
            list.append(slot_placeholder);
            break;
          case pointed_element.is('ul'):
            // console.log('has slotClass');
            pointed_element = pointed_element.children('ul').children().last();
            pointed_element.after(slot_placeholder);
            break;
          default:
            // console.log('return directly');
            return;
        }
      }

      function mouse_up_on_window(e) {
        var panel = $('[lay-id=id_grid_' + opts.model + ']').find('[lay-event=' + opts.model + '_columns] .layui-table-tool-panel');
        if (pseudo_drag_element === null) {
          return;
        }
        e.preventDefault();
        var el = pseudo_drag_element.children('li').first();
        el[0].parentNode.removeChild(el[0]);
        current_drag_item.removeClass('layui-hide');
        slot_placeholder.replaceWith(current_drag_item);
        pseudo_drag_element.remove();

        current_drag_item = null;
        pseudo_drag_element = null;
        pointed_element = null;
        if (related_slot && related_slot.length) {
          if (related_slot.hasClass(CLASS_EMPTY_SLOT)) {
            related_slot.removeClass(CLASS_EMPTY_SLOT);
          }
          if (related_slot.find('li').length === 0) {
            related_slot.closest('ul').addClass(CLASS_EMPTY_SLOT);
            $('.' + CLASS_EMPTY_SLOT).find('li').remove();
          }
        }
        related_slot = null;

        //: move cur_column_list re-calculation expression to mouseup
        cur_column_list = (function () {
          var all_checkbox = panel.find('li > input[type=checkbox]'),
            result = [];
          _.each(all_checkbox, function (field) {
            result.push(field.name);
          });
          return result;
        })();
      }

      function get_sheet_rules() {
        var that = this
          , style = that.find('style')[0]
          , sheet = style.sheet || style.styleSheet || {}
          , rules = sheet.cssRules || sheet.rules;
        return rules || {};
      }

      function tackle_match_css_rule(rules, key, callback) {
        _.each(rules, function (item) {
          if (item.selectorText === interpolate(opts.lay_table_cell_style, [key])) {
            return callback(item);
          }
        });
      }

      function auto_fit_callback_wrapper(othis, curr, total) {
        return function () {
          $.fn.set_progress_bar({
            'percent': 100 * (curr + 1) / total
          });

          var tips_index = opts.best_fit_tips_index,
            title = this.title || '',
            text = interpolate(gettext('[%(curr)s / %(total)s]: adjusting the width of column%(title)s.'), {
              'title': title.length ? ' ' + title : title, 'curr': curr + 1, 'total': total
            });
          if (!tips_index) {
            return layer.tips(text, othis, {
              tips: [4, '#393d49'],
              time: 0,
              // time: 2 * opts['best_fit_interval'],
              // closeBtn: 2,
              tipsMore: false
              // amim: -1,
              // isOutAnim: false
            });
          } else {
            $('#' + interpolate(opts.layer_id_tmp, [tips_index])).find('.layui-layer-content').text(text);
            return tips_index;
          }
        };
      }

      function update_table_style_rules(cell_max, cell_rules, cell_key, is_scale) {
        if (is_scale === undefined || typeof is_scale !== 'boolean') {
          is_scale = false;
        }
        var _min_width;
        if (is_scale) {
          _min_width = cell_max;
        } else {
          _min_width = Math.min(cell_max, opts.best_fit_max_col_width * opts.scale);
        }

        tackle_match_css_rule(cell_rules, cell_key, function (item) {
          item.style.width = _min_width + 'px';
        });
      }

      function best_fit_column_handler(options, callback) {
        var col_prop = this, th_width = [], td_width = [], cell_max, col_width_dict, config_index,
          fit_with_interval = true;
        if (options !== undefined) {
          fit_with_interval = options.fit_with_interval;
          config_index = options.index;
          col_width_dict = options.col_width;
        }
        if (!th_width || !td_width || config_index === undefined) {
          throw Error('Missing Critical Argument td_width, th_width array, config_index');
        }

        if (callback === undefined) {
          callback = $.noop;
        }
        opts.best_fit_tips_index = callback.call(this);
        var _col = $(opts.container).find('.layui-table-box *[data-key="' + config_index + "-" + col_prop.key + '"]'),
          th_max, td_max, th_last, td_last, cell_key, table_style_rules, $th_dom;

        _.each(_col, function (col_dom) {
          var style = window.getComputedStyle(col_dom, 'none'),
            $col_dom = $(col_dom/*, idx3*/),
            _tag_name = col_dom.tagName.toLowerCase();
          if (!table_style_rules || !cell_key) {
            cell_key = $col_dom.data('key');
            table_style_rules = get_sheet_rules.call($col_dom.closest('.layui-table-view'));
          }
          if ($col_dom.text().trim().length) {
            if (_tag_name === 'th') {
              var has_sort_icon = $col_dom.find('.layui-table-sort').length > 0;
              th_width.push(parseFloat(
                get_text_width.call($col_dom, $col_dom.text(), style['font'])) + (has_sort_icon ? 30 : 12));
            } else if (_tag_name === 'td') {
              td_width.push(parseFloat(
                get_text_width.call($col_dom, $col_dom.text(), style['font'])) + 12);
            }
          } else if (!col_prop.field && _tag_name.toLowerCase() === 'th') {
            if ($th_dom === undefined || $th_dom.length === 0) {
              $th_dom = $col_dom;
            }
          }
        });
        th_last = th_width.length - 1;
        td_last = td_width.length - 1;
        th_width.sort(compare_num);
        td_width.sort(compare_num);
        var field_name;
        if (col_prop.field) {
          field_name = col_prop.field;
          th_max = th_width[th_last] || $.fn.dataGrid.defaults.cell_min_width;
          td_max = td_width[td_last] || (opts.keep_cell_min_width ? $.fn.dataGrid.defaults.cell_min_width : 0);
        } else {
          field_name = CONST_TOOLBAR_KEY;
          if ($th_dom && td_last === -1 && td_last === -1) {
            th_max = td_max = $th_dom.prop('scrollWidth');
          } else {
            th_max = th_width[th_last] || $.fn.dataGrid.defaults.cell_min_width;
            td_max = td_width[td_last] || (opts.keep_cell_min_width ? $.fn.dataGrid.defaults.cell_min_width : 0);
          }
        }
        cell_max = Math.max(th_max, td_max);
        if (!fit_with_interval) {
          var _d = {'key': col_prop.key};
          _d[CONST_BEST_FIT_KEY] = cell_max;
          col_width_dict[field_name] = _d;
          if (col_width_dict[CONST_ALL_WIDTH] === undefined) {
            col_width_dict[CONST_ALL_WIDTH] = 0;
          }
          if (col_prop.field) {
            col_width_dict[CONST_ALL_WIDTH] += cell_max;
          }
        }

        //: write an new separate function to update the style of table
        if (fit_with_interval && table_style_rules && cell_key) {
          update_table_style_rules(cell_max, table_style_rules, cell_key);
        }

        // clean up
        th_width.length = 0;
        td_width.length = 0;
      }

      /**
       * get integer value(pixel value) from the property of specific container
       *  prop {string} {prop}, optional
       *  selector {string} {selector}, optional
       *  ancestor {string} {ancestor}, optional
       * @returns {number}
       */
      function get_container_pixel(prop, selector, ancestor) {
        if (prop === undefined) {
          prop = 'width';
        }

        if (selector === undefined) {
          selector = '.layui-table-view[lay-id=id_grid_' + opts.model + ']';
        }

        // distinguish two diff value: null versus undefined
        if (ancestor === undefined) {
          ancestor = opts.container;
        }
        var result = 0, container_dom;

        if (ancestor) {
          container_dom = $(ancestor).find(selector)[0];
        } else {
          container_dom = $(selector)[0];
        }

        if (!container_dom) {
          throw Error('Improper selector for layer table instance.');
        }
        try {
          result = parseInt(window.getComputedStyle(container_dom, null)[prop].replace(/px$/, ''));
        } catch (e) {
          throw Error(interpolate('cannot parse the property %s of container', [prop]));
        }
        return result;
      }

      function best_fit_click_handler(othis, op, config) {
        var that = $(this),
          is_user_triggered = that.length !== 0 && type(this) !== 'global',
          fit_op = op,
          fit_with_interval = fit_op === 'best_fit',
          col_width_dict = {},
          task_queue = [],
          hide_count = 0,
          col_list_len,
          start_time = new Date().getTime(),
          subtract_width = 0,
          last_visible_col_key = '',
          construct_progress_bar = (function (is_user) {
            return is_user
                   ? function () {
                $.fn.set_progress_bar({
                  'percent': 0
                });
              }
                   : $.noop;
          })(is_user_triggered),
          deconstruct_progress_bar = (function (is_user) {
            return is_user
                   ? function () {
                $.fn.set_progress_bar({
                  'percent': 100
                });
                setTimeout(function () {
                  $.fn.set_progress_bar({
                    'hide': true
                  });
                }, 300);
              }
                   : $.noop;
          })(is_user_triggered);

        construct_progress_bar();
        _.each(config.cols, function (col_list/*, idx1*/) {
          var lay_index = null;
          col_list_len = col_list.length;
          if (is_user_triggered) {
            lay_index = layer.msg(gettext('Adjusting the width of columns.'), {
              title: gettext("layer_title"),
              icon: 16,
              shade: 0.01,
              time: 0
            });
          }
          _.each(col_list, function (col_prop/*, idx2*/) {
            if (col_prop.hide) {
              hide_count += 1;
            } else if (col_prop.type === 'checkbox' || col_prop.unresize) {
              subtract_width += col_prop.width || 0;
              hide_count += 1;
            } else {
              if (col_prop.field) {
                last_visible_col_key = col_prop.key;
              }
              var auto_fit_callback = function (curr, total) {
                return auto_fit_callback_wrapper.call(
                  col_prop, othis, curr, total
                );
              };
              task_queue.push(function (curr, total) {
                return function () {
                  best_fit_column_handler.call(col_prop, {
                    'fit_with_interval': fit_with_interval,
                    'col_width': col_width_dict,
                    'index': config.index
                  }, is_user_triggered ? auto_fit_callback(curr, total) : $.noop);
                };
              });
            }
          });

          task_queue.forEach(function (func, index) {
            if (fit_with_interval) {
              setTimeout(func(index, col_list_len - hide_count), is_user_triggered ? (opts['best_fit_interval'] * index) : 1);
            } else {
              func(index, col_list_len - hide_count).call();
            }
          });

          var sentry_callback = function () {
            var fix_column_r = $('.layui-table-fixed.layui-table-fixed-r .layui-table-col-special', opts.container),
              last_column = $('.layui-table-body.layui-table-main .layui-table-col-special', opts.container);

            if (fix_column_r.length && last_column.length) {
              if (fix_column_r.hasClass('layui-hide')) {
                fix_column_r.removeClass('layui-hide');
              }

              var fix_column_r_x = fix_column_r.eq(0).get(0).getBoundingClientRect()['x'],
                last_column_x = last_column.eq(0).get(0).getBoundingClientRect()['x'];

              if (last_column_x < fix_column_r_x) {
                fix_column_r.addClass('layui-hide');
              }
            }
            lay_index && layer.close(lay_index);
            opts.best_fit_tips_index && layer.close(opts.best_fit_tips_index);
            opts.best_fit_tips_index = null;
            deconstruct_progress_bar();
          };

          // remove overlapping toolbar
          setTimeout(sentry_callback, fit_with_interval
                                      ? opts['best_fit_interval'] * (col_list_len - hide_count)
                                      : 100);
        });
        if (fit_op === 'best_scale') {
          var container_width = get_container_pixel();

          // reassure: we have more than one column as least
          if (col_list_len && col_list_len > 0) {
            var pure_occupied_width = 0,
              has_toolbar = col_width_dict[CONST_TOOLBAR_KEY] !== undefined,
              pure_col_count = col_list_len - hide_count,
              /**
               * @author Boyce
               * @datetime 2019.01.09 AM
               * @description
               * pure_container_width =
               *
               * | [x]id(as checkbox) || col1 | col2 || col3 || .... || [x]toolbar |
               *
               * Those columns which started with `[x]` icon would not be taken into account.
               * Furthermore, for pixel-level perfect, we also need to calculate the border width of each table cell,
               * as the above diagram depicted, its width is equal to 2 * VISIBLE_COLUMN_NUM * CELL_BORDER_WIDTH;
               */
              pure_container_width = container_width - (
                subtract_width
                + 2 * (pure_col_count) * CONST_CELL_BORDER_WIDTH
                + (has_toolbar ? col_width_dict[CONST_TOOLBAR_KEY][CONST_BEST_FIT_KEY] : 0)),
              pure_table_width = col_width_dict[CONST_ALL_WIDTH],
              truncated_fields = [],
              table_index = config.index,
              ratio = pure_container_width / pure_table_width,
              rules = get_sheet_rules.call($(opts.container).find('.layui-table-view')),
              max_col_width_for_best_scale = opts.best_scale_max_col_width * opts.scale;

            _.each(col_width_dict, function (elem, key) {
              if (!key.startsWith('__')) {
                var is_scale = ratio > 1.0,
                  scale_width = is_scale
                                ? parseFloat((elem[CONST_BEST_FIT_KEY] * ratio).toFixed(2))
                                : elem[CONST_BEST_FIT_KEY];
                col_width_dict[key][CONST_BEST_SCALE_KEY] = scale_width;
                if (scale_width > max_col_width_for_best_scale) {
                  scale_width = max_col_width_for_best_scale;
                  truncated_fields.push(elem);
                }
                pure_occupied_width += scale_width;
                update_table_style_rules(scale_width,
                  rules, table_index + '-' + elem.key, true
                );
              }
            });
            if (pure_occupied_width < pure_container_width) {
              if (truncated_fields.length) {
                var remnant_width = pure_container_width - pure_occupied_width,
                  remnant_best_fit = truncated_fields.reduce(function (pre_val, cur_val) {
                    return pre_val + cur_val[CONST_BEST_FIT_KEY];
                  }, 0);
                // equalized_width = remnant_width / truncated_fields.length;

                truncated_fields.forEach(function (elem/*, idx*/) {
                  update_table_style_rules(max_col_width_for_best_scale +
                                           remnant_width * (elem[CONST_BEST_FIT_KEY] / remnant_best_fit),
                    rules, table_index + '-' + elem.key, true
                  );
                });
              }

            }
            // check gap: an empty area between toolbar or last_column to right boundary
            var last_tr = $(opts.container).find('.layui-table-view > .layui-table-box > .layui-table-header tr > th').last();
            if (last_visible_col_key && last_tr.length && !opts.is_history) {
              var last_tr_rect = last_tr.get(0).getBoundingClientRect()
                , last_second_tr = last_tr.prevAll(':not(.layui-hide)').first()
                , last_second_tr_width = last_second_tr.get(0).getBoundingClientRect().width
                , last_tr_right = last_tr_rect.right
                , table_right = $(opts.container).find('.layui-table-view').get(0).getBoundingClientRect().right
                , gap_width = table_right - last_tr_right - 2 * CONST_CELL_BORDER_WIDTH,
                last_effective_tr_width = has_toolbar ? last_second_tr_width : last_tr_rect.width;
              if (last_effective_tr_width !== 0 && 1 < gap_width && gap_width < CONST_TOLERANT_GAP_LIMIT) {
                update_table_style_rules(last_effective_tr_width + gap_width, rules, table_index + '-' + last_visible_col_key, true);
              }
            }
          }
        }
        var last_lapse = window['get_session_storage'](KEY_LAST_BEST_FIT_LAPSE),
          current_lapse = (new Date().getTime() - start_time);
        // the weight of last_lapse is lighter than current lapse
        if (last_lapse) {
          current_lapse = Math.floor(current_lapse * 0.7 + last_lapse * 0.3);
        }
        window['set_session_storage'](KEY_LAST_BEST_FIT_LAPSE, current_lapse);
      }

      function best_fit_callback(_othis, _config) {
        var best_fit_btn = _othis.siblings(interpolate('[lay-event=%s]', [opts.model + '_fit'])),
          last_fit_op = best_fit_btn.data(CONST_LAST_FIT_OP);
        best_fit_click_handler.apply(null,
          [best_fit_btn, last_fit_op || opts.prefer_best_fit_op, _config]);
        layer.msg(gettext('Adjusting columns'), {
          title: gettext("layer_title"), icon: 16, shade: 0.01, time: 300
        });
      }

      function expand_table_callback(container, is_checked, options) {
        var is_using_grid_scale = container.is(CONST_FILTER_GRID_TRAIT);

        var container_class_list = Array.prototype.slice.apply(container.get(0).classList),
          with_in_same_row = container.siblings(CONST_FILTER_GRID_TRAIT),
          done_callback;
        if (options !== undefined) {
          done_callback = options.done;
        }
        if (done_callback === undefined || type(done_callback) !== 'function') {
          done_callback = _.noop;
        }

        if (is_using_grid_scale) {
          var new_occupied_scale = 0,
            cur_occupied_scale = 0,
            widget_available_scale = 0,
            max_occupied_scale = 12;

          _.each(container_class_list, function (cls_name) {
            if (cls_name.startsWith(CONST_GRID_TRAIT)) {
              cur_occupied_scale = Math.max(
                get_grid_scale(cls_name, CONST_GRID_TRAIT),
                cur_occupied_scale
              );
            }
          });

          _.each(with_in_same_row, function (elem) {
            var _elem = $(elem), _class_list = Array.prototype.slice.apply(elem.classList), _scale = 0;
            _.each(_class_list, function (cls_name) {
              if (cls_name.startsWith(CONST_GRID_TRAIT)) {
                _scale = Math.max(
                  get_grid_scale(cls_name, CONST_GRID_TRAIT),
                  _scale
                );
                if (!_elem.hasClass('layui-hide')) {
                  _elem.addClass('layui-hide');
                } else if (is_checked) {
                  _elem.removeClass('layui-hide');
                }
              }
            });
            widget_available_scale += _scale;
          });

          if (!is_checked) { // from disable to enable
            new_occupied_scale = Math.min(cur_occupied_scale + widget_available_scale, max_occupied_scale);
            // call best_fit with scale
          } else { // form enable to disable
            //: reverse operations of expand: collapse to original layout
            new_occupied_scale = cur_occupied_scale - widget_available_scale;
          }
          if (new_occupied_scale > 0 && new_occupied_scale <= max_occupied_scale) {
            _.each(container_class_list, function (cls_name) {
              if (cls_name.startsWith(CONST_GRID_TRAIT)) {
                container.removeClass(cls_name);
                container.addClass(cls_name.replace(/\d+/g, '') + new_occupied_scale);
              }
            });
          }

          done_callback();
        }
      }


      function update_switcher_status(switcher_elem, input_field) {
        var switcher_status_list = EXPAND_PANEL_SWITCHER_TEXT.split('|').reverse(),
          switcher = input_field.siblings('.' + CLASS_SWITCHER),
          switcher_text_node = switcher.children('em'),
          is_checked = input_field.prop('checked');

        var switcher_status_callback = function (check_status) {

          if (check_status && !switcher.hasClass(CLASS_SWITCHER_ON)) {
            switcher.addClass(CLASS_SWITCHER_ON);
          } else if (!check_status && switcher.hasClass(CLASS_SWITCHER_ON)) {
            switcher.removeClass(CLASS_SWITCHER_ON);
          }
          switcher_text_node.text(switcher_status_list[Number(check_status)]);
          input_field.prop('checked', check_status);
        };

        if (switcher_elem.closest('.layui-form-switch').length) {
          is_checked = !is_checked;
        } else {
          switcher_status_callback(!is_checked);
        }
        return is_checked;
      }

      function get_table_prefer_class_on_and_off(data_op, is_checked, reverse) {
        var prefer_classes = {};
        prefer_classes["on"] = CLASS_TABLE_PREFER_PREFIX + data_op.replace(/_/g, '-');
        prefer_classes["off"] = prefer_classes["on"] + CLASS_TABLE_PREFER_OFF_SUFFIX;
        if (reverse === undefined || type(reverse) !== 'boolean') {
          reverse = true;
        }
        // from enable to disable
        if ((reverse && is_checked) || (!reverse && !is_checked)) {
          var tmp_class = prefer_classes["off"];
          prefer_classes["off"] = prefer_classes["on"];
          prefer_classes["on"] = tmp_class;
        }
        return prefer_classes;
      }

      opts.table.on("toolbar(" + opts.model + ")", function (obj) {
        //var checkStatus = table.checkStatus(obj.config.id);
        var othis = $(this),
          sibling_trigger = othis.siblings('[lay-event]'),
          $tool_panel_str = '.' + CLASS_TOOL_PANEL;

        if (othis.hasClass('open')) {
          othis.removeClass('open');
          $($tool_panel_str).remove();
          return;
        } else {
          sibling_trigger.filter('.open').removeClass('open');
          $($tool_panel_str).remove();
          othis.addClass('open');
        }

        var is_auto_action = !!othis.data('auto'),
          config = obj.config,
          openPanel = function openPanel(panel_opts) {
            var list = $(panel_opts.list),
              panel_callback = panel_opts.panel_callback,
              panel = $(interpolate(
                '<div class="%(div_cls)s"><ul class="%(ul_cls)s" data-index="%(data_index)s"></ul></div>',
                {
                  'div_cls': CLASS_TOOL_PANEL,
                  'ul_cls': CLASS_DRAG_SLOT,
                  'data_index': config.index
                }));
            panel.children('ul').html(list);
            othis.find($tool_panel_str)[0] || othis.append(panel);
            opts.form.render();

            if (panel_dom_dict[obj.event] === undefined) {
              var panel_dom_monitor = new MutationObserver(function (events) {
                _.each(events, function (changed_event) {
                  if (changed_event.removedNodes.length) {
                    $(changed_event.target).removeClass('open');
                    if (panel_callback && type(panel_callback) === 'function') {
                      panel_callback.call(this, panel, list, panel_opts);
                    }
                  }
                });
              });
              panel_dom_monitor.observe(panel.parent().get(0), {childList: true});
              panel_dom_dict[obj.event] = true;
            }

            panel.on("click", function (e) {
              layui.stope(e);
            });

            panel_opts.done && panel_opts.done(panel, list, panel_opts);
          };


        var start_with_model = new RegExp("^" + opts.model, "i"),
          event_suffix = obj.event.replace(start_with_model, '');

        switch (event_suffix) {
          case "_fit":
            if (opts.action_triggered_auto && is_auto_action) {
              var last_fit_op = othis.data(CONST_LAST_FIT_OP);
              best_fit_click_handler.apply(null,
                [othis, last_fit_op || opts.prefer_best_fit_op, config]);
            } else {
              openPanel({
                list: get_rendered_panel_html([
                  {
                    'op': 'best_fit', 'name': gettext('best_fit')
                  },
                  {
                    'op': 'best_scale', 'name': gettext('best_fit_with_scale')
                  }
                ]),
                done: function (panel, list/*, panel_opts*/) {
                  list.on("click", function () {
                    var that = $(this),
                      op = that.data('op');
                    best_fit_click_handler.apply(this, [othis, op, config]);
                    othis.data(CONST_LAST_FIT_OP, op);
                    // Cookies.set(CONST_LAST_FIT_OP, op);
                    $(opts.container).trigger('click'); // let the drop_menu disappear
                  });
                }
              });
            }
            break;
          case '_expand':
            openPanel({
              list: (function () {
                var container = get_grid_container(othis),
                  is_expanded = false,
                  on_demand_disabled = false;

                if (container.is(CONST_FILTER_GRID_TRAIT)) {
                  var with_in_same_row = container.siblings('[class*=' + CONST_GRID_TRAIT + ']'),
                    i, n;
                  for (i = 0, n = with_in_same_row.length; i < n; i++) {
                    var _elem = with_in_same_row[i];
                    if (_.includes(_elem.classList, 'layui-hide')) {
                      is_expanded = true;
                      break;
                    }
                  }
                  if (with_in_same_row.length == 0) {
                    on_demand_disabled = true;
                  }
                } else {
                  on_demand_disabled = true;
                }
                return get_rendered_panel_html([
                  {
                    'op': 'expand_on_demand',
                    'name': gettext('expand_on_demand'),
                    'option_checked': (is_expanded || on_demand_disabled) ? 'checked' : '',
                    'option_disabled': on_demand_disabled ? 'disabled' : ''
                  }, {
                    'op': 'expand_full_screen',
                    'name': gettext('expand_full_screen'),
                    'option_checked': is_fullscreen() ? 'checked' : ''
                  }
                ], EXPAND_PANEL_HTML_TEMPLATE);
              })(),
              done: function (panel, list/*, panel_opts*/) {
                list.on("click", function (e) {
                  var that = $(this),
                    current_target = e.target,
                    $current_target = $(current_target),
                    input_field = that.find('input'),
                    op = input_field.data('op'),
                    container = get_grid_container(othis),
                    is_disabled = input_field.prop('disabled'),
                    is_checked;


                  if (is_disabled) {
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                  }

                  is_checked = update_switcher_status($current_target, input_field);

                  // noinspection NestedSwitchStatementJS
                  switch (op) {
                    case 'expand_on_demand':
                      expand_table_callback(container, is_checked, {
                        done: function () {
                          best_fit_callback(othis, config);
                        }
                      });
                      break;
                    case 'expand_full_screen':
                      // layer.msg('Notice: This feature still work in progress.');
//                      expand_table_callback(container, is_checked, {
//                        done: function () {
//                          best_fit_callback(othis, config);
//                        }
//                      });

                      if (!is_checked) {
                        var outdent_btn = $('> i.fa.fa-fw.fa-outdent', $SWITCH_MENU),
                          side_menu_open_status = false;
                        if (outdent_btn.length) {
                          side_menu_open_status = true;
                          outdent_btn.trigger('click');
                        }
                        window['set_session_storage'](KEY_LAST_SIDE_MENU_OPEN_STATUS, JSON.stringify(side_menu_open_status));
                        $.fn.request_full_screen();
                      } else {
                        var is_last_side_menu_open = JSON.parse(window['get_session_storage'](KEY_LAST_SIDE_MENU_OPEN_STATUS) || 'false'),
                          indent_btn = $('> i.fa.fa-fw.fa-indent', $SWITCH_MENU);
                        if (is_last_side_menu_open && indent_btn.length) {
                          indent_btn.trigger('click');
                        }
                        $.fn.cancel_full_screen();
                      }
                      break;
                    default:
                      break;
                  }
                  $(opts.container).trigger('click'); // let the drop_menu disappear
                });
                // opts.form.on("checkbox(" + EXPAND_PANEL_EVENT_FILTER + ")", function (obj) {
                //   console.log('checkbox(expand)', obj, arguments);
                // });
              }
            });
            break;
          case '_prefer':
            openPanel({
              list: (function () {
                var container = get_grid_container(othis),
                  fetch_switcher_current_status_on_the_fly = function (conf) {
                  var keys = Object.keys(conf);
                  for(var i=0; i<keys.length; i++){
                    var _key = keys[i];
                    //for (var _key in keys) {
                      var list_item = conf[_key];
                      var table_prefer_class_on = CLASS_TABLE_PREFER_PREFIX + list_item.op.replace(/_/g, '-'),
                        table_prefer_class_off = table_prefer_class_on + CLASS_TABLE_PREFER_OFF_SUFFIX;
                      // setting option_checked
                      list_item.option_checked = DEFAULT_CONTAINER_PREFER[list_item.op] ? 'checked' : '';
                      if (container.hasClass(table_prefer_class_on)) {
                        list_item.option_checked = 'checked';
                      }
                      if (container.hasClass(table_prefer_class_off)) {
                        list_item.option_checked = '';
                      }
                      // conf[_key] = list_item;
                    }
                    return conf;
                  };

                return get_rendered_panel_html(fetch_switcher_current_status_on_the_fly([
                  {
                    'op': 'highlight_identifier',
                    'name': gettext('highlight_identifier')
                  }, {
                    'op': 'show_zebra_stripes',
                    'name': gettext('show_zebra_stripes')
                  }, {
                    'op': 'show_line_division',
                    'name': gettext('show_line_division')
                  }
                ]), PREFER_PANEL_HTML_TEMPLATE);
              })(),
              done: function (panel, list/*, panel_opts*/) {
                list.on("click", function (e) {
                  var that = $(this),
                    current_target = e.target,
                    $current_target = $(current_target),
                    input_field = that.find('input'),
                    op = input_field.data('op'),
                    container = get_grid_container(othis),
                    is_disabled = input_field.prop('disabled'),
                    is_checked;

                  if (is_disabled) {
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                  }

                  is_checked = update_switcher_status($current_target, input_field);

                  var cur_prefer_class = get_table_prefer_class_on_and_off(op, is_checked);
                  container.removeClass(cur_prefer_class["off"]);
                  container.addClass(cur_prefer_class["on"]);

                  //: save user's last selected preferences
                  var last_saved = JSON.parse(window['get_local_storage'](KEY_TABLE_CONTAINER_PREFERENCES) || '{}');
                  if (Object.keys(last_saved).length === 0) {
                    var all_input_preferences = panel.find("input[type=checkbox][lay-skin=switch]");
                    $.each(all_input_preferences, function () {
                      var cur_input = $(this),
                        _op = cur_input.data("op"),
                        _is_checked = cur_input.prop("checked");
                      if (_op === op) {
                        last_saved[_op] = cur_prefer_class;
                      } else {
                        last_saved[_op] = get_table_prefer_class_on_and_off(_op, _is_checked, false);
                      }
                    });
                  } else {
                    last_saved[op] = cur_prefer_class;
                  }
                  window['set_local_storage'](KEY_TABLE_CONTAINER_PREFERENCES, last_saved);
                });
              }
              // panel_callback: function (panel/*, list, panel_opts*/) {
              // }
            });
            break;
          case '_history':
            var callback = function (html) {
              // var curr_tab = $(opts.container).closest('div[id^=tab_]');
              var main_body = '#main_body',
                rect = $(main_body)[0].getBoundingClientRect(),
                side_margin = rect.width * CONST_DIALOG_SIDE_MARGIN_SCALE,
                fix_part_height = 125, // 42 + 51 + 31 + 0 + extra_space
                // for example: limit = 20
                // 668(lay body) + 42(lay title bar),
                // lay body = 564(20 rows / 23px(per rows) + 0(margin-top+ margin-bottom)
                // + other fixed parts) + 51(filter bar) + 31(preserved area for filter group)
                dialog_adequate_height =
                  ($.fn.dataGrid.defaults.CONST_SINGLE_LAY_TABLE_ROW_HEIGHT *
                   Math.min(opts.grid_opts.limit, $.fn.dataGrid.defaults.CONST_MAX_DIALOG_ROWS_LIMIT)) +
                  $.fn.dataGrid.defaults.CONST_LAY_TABLE_OTHER_PARTS_HEIGHT + fix_part_height,
                loc_left = rect.left,
                loc_top = rect.top;
                if (window.innerHeight < 650)
                dialog_adequate_height = 500

              layer.open({
                type: 1,
                title: gettext('grid_menu_history'),
                closeBtn: 2,
                offset: [((loc_top + rect.height - dialog_adequate_height) / 2) + 'px', (loc_left + side_margin) + 'px'],
                area: [(rect.width - 2 * side_margin) + 'px', dialog_adequate_height + 'px'],
                skin: 'layui-layer-grim',
                shadeClose: true,
                // zIndex: layer.zIndex,
                maxmin: true,
                content: html,
                success: function (layero) {
                  // layer.setTop(layero);
                }, end: function (/*layero*/) {
                  othis.removeClass('open');
                }
              });
            };

            $.get({
              url: concatenate_url(opts.history_url, {
                "history_opts": JSON.stringify([opts.app, opts.model])
              }),
              dataType: 'html',
              success: function (response) {
                callback(response);
              }, error: function (err_details) {
                var error_text = gettext(interpolate('Sorry, You cannot access history dialog of model', [opts.model]));
                if (err_details.status === 403) {
                  error_prompt(error_text + ' due to permission constraint.');
                } else {
                  error_prompt(error_text + ' due to ' + err_details.statusText + '.');
                }
                console.warn(error_text, arguments);
              }
            });
            break;
          case "_columns":
            openPanel({
              ctrl: function () {
                var tag_close = '</div>',
                  _temp_list = ['<div class="column-control">'],
                  column_ctrl_conf = [
                    {
                      name: 'all',
                      title: gettext("columns_menu_selectAll"),
                      icon: "fa-check-square-o"
                    }, {
                      name: 'sync',
                      title: gettext("columns_menu_saveHiddenField"),
                      icon: "fa-cloud-upload"
                    }, {
                      name: "restore",
                      title: gettext("columns_menu_restore"),
                      icon: "fa-recycle"
                    }, {
                      name: "search",
                      title: gettext("columns_menu_search"),
                      icon: "fa-search"
                    }
                  ],
                  col_search_bar = '<input role="search" style="display: none;">';
                _.each(column_ctrl_conf, function (conf) {
                  if (!conf.disable) {
                    _temp_list.push(interpolate(opts.col_ctrl_panel_tmp, {
                      'name': conf.name,
                      'title': conf.title,
                      'icon': conf.icon
                    }));
                  }
                });
                _temp_list.push(col_search_bar);
                _temp_list.push(tag_close);
                return _temp_list.join('');
              }(),
              list: (function () {
                var lis = [];
                init_column_list = [];
                _.each(config.cols, function (item1/*, idx1*/) {
                  _.each(item1, function (item2/*, idx2*/) {
                    if (item2.hide) {
                      last_hidden_fields.push(item2.field);
                    }
                    if (item2.field && "normal" === item2.type) {
                      if (!_.includes(init_column_list, item2.field)) {
                        init_column_list.push(item2.field);
                      }
                      lis.push(interpolate(COLUMNS_PANEL_HTML_TEMPLATE, {
                        name: item2.field,
                        title: item2.title,
                        option_checked: (item2.hide ? "" : "checked"),
                        option_fixed: item2.fixed ? 'data-fixed="' + item2.fixed + '"' : '',
                        data_key: item2.key,
                        data_parent_key: (item2.parentKey || "")
                      }));

                      // lis.push([
                      //   '<li><input type="checkbox" name="' + item2.field + '" ',
                      //   (item2.fixed ? 'data-fixed="' + item2.fixed + '"' : ''),
                      //   ' data-key="' + item2.key + '" data-parentkey="' + (item2.parentKey || "") + '" ',
                      //   ' lay-skin="primary" ' + (item2.hide ? "" : "checked"),
                      //   ' title="' + item2.title + '" lay-filter="header_cols"></li>'
                      // ].join(''));
                    }
                  });
                });
                if (total_column_num === undefined || typeof total_column_num !== 'number') {
                  total_column_num = lis.length;
                }
                cur_column_list = init_column_list.concat();
                return lis.join("");
              })(),
              panel_callback: function (/*panel, list, panel_opts*/) {
                if (!isArraysEqualStrict(init_column_list, cur_column_list)) {
                  layer.confirm(gettext('msg_reload_order'), {
                    title: gettext('layer_title'), icon: 3, shade: 0.01,
                    btn: [gettext('btn_confirm'), gettext('btn_restore')]
                  }, function (index) {
                    layer.close(index);
                    var grid_opts = JSON.parse(JSON.stringify(opts.grid_opts)),
                      cols = grid_opts.cols[0],
                      cols_len = cols.length,
                      first_normal_loc = 0,
                      has_right_fixed_col = false,
                      last_col = cols[cols_len - 1];
                    // have right-most fixed column
                    if (!last_col.field && last_col.type === 'normal') {
                      cols.splice(cols_len - 1, 1);
                      has_right_fixed_col = true;
                    }

                    $.ajax({
                      url: opts.column_order_url,
                      type: "POST",
                      dataType: "html",
                      data: {
                        model: opts.model,
                        order: JSON.stringify(cur_column_list)
                      },
                      success: function (content) {
                        console.log({'request_response': content});
                        slotArry = cur_column_list;
                        slotArryFlag = true
                      },
                      error: function () {
                        console.debug({'request_response': arguments});
                      }
                    });

                    var i, n, col;
                    for (i = 0, n = cols.length; i < n; i++) {
                      col = cols[i];
                      if (col.type === 'normal') {
                        first_normal_loc = i;
                        break;
                      }
                    }
                    for (i = first_normal_loc, n = cols.length; i < n; i++) {
                      col = cols[i];
                      if (col.type === 'normal' && _.includes(cur_hidden_fields, col.field)) {
                        col.hide = true;
                      }
                    }
                    var ordered_normal_cols = [];
                    cur_column_list.forEach(function (col_field_name) {
                      var col = _.find(cols, function (o) {
                        return o.field === col_field_name;
                      }, first_normal_loc);
                      ordered_normal_cols.push(col);
                    });
                    if (has_right_fixed_col) {
                      ordered_normal_cols.push(last_col);
                    }
                    cols.splice(first_normal_loc, cols.length - first_normal_loc + 1);
                    cols = cols.concat(ordered_normal_cols);
                    grid_opts.cols[0] = cols;

                    layui.use(["table"], function () {
                      layer.msg(gettext('Reload tables...'), {
                        title: gettext("layer_title"), icon: 16, shade: 0.01, time: 2000
                      });
                      var table = layui.table,
                        curr_table = table.render(grid_opts);
                      actionTemplate();
                      panel_dom_dict = {};
                      setTimeout(function () {
                        best_fit_callback(othis, curr_table.config);
                      }, 1000);
                    });
                  }, function () {
                    // panel.children('ul').html(list);
                    // opts.form.render();
                    // panel_opts.done && panel_opts.done(panel, list, panel_opts);
                  });
                } else if (!isArraysEqual(last_hidden_fields, cur_hidden_fields)) {
                  best_fit_callback(othis, config);
                }

                // unbind high-level mouse trace event
                $(window)
                  .off('mousemove', mouse_move_on_window)
                  .off('mouseup', mouse_up_on_window);
                othis.parent().find('.open').removeClass('open');
              },
              done: function (panel, list, panel_opts) {
                var ctrl = panel_opts.ctrl;
                if (ctrl) {
                  panel.prepend($(ctrl));
                  $(panel).on('click', 'span[data-name]', column_filter_handler);
                  $(panel).on('keyup', 'input[role=search]', function () {
                    $.fn.input_search.apply(this, [{
                      tag: 'li',
                      closest: '.layui-table-tool-panel'
                    }]);
                  });
                }
                $('.layui-form-checkbox', list)
                  .on('mouseenter', function () {
                    var elem = $(this), input_field = elem.siblings('input'), tag_span = elem.children('span'),
                      icons = tag_span.siblings('i');
                    if (elem.is('.layui-form-checked')) {
                      var position_adjust_tpl = '<i class="fa fa-fw %s" aria-hidden="true" style="right: 28px;left: initial;"></i>';

                      if (icons.length === 1) {
                        if (input_field.data('fixed') !== undefined) {
                          icons.after(interpolate(position_adjust_tpl, ['fa-ban']));
                        } else {
                          icons.after(interpolate(position_adjust_tpl, ['fa-reorder']));
                        }
                      } else {
                        icons.filter('.fa-fw:not(.layui-hide)').show();
                      }
                    }
                  })
                  .on('mouseleave', function () {
                    var elem = $(this), tag_span = elem.children('span'), icons = tag_span.siblings('i');
                    icons.filter('.fa-fw').fadeOut(250);
                  })
                  .on('click', function () {
                    var elem = $(this), tag_span = elem.find('span'), icons = tag_span.siblings('i'),
                      show = elem.is('.layui-form-checked');
                    if (show) {
                      icons.filter('.fa-fw').show();
                    } else {
                      icons.filter('.fa-fw').fadeOut(50);
                    }
                  })
                  .off('click', '.fa-fw')
                  .on('mousedown', '.fa-fw', function (e) {
                    e.stopPropagation();
                    var elem = $(e.target),
                      curr_li = elem.closest('li'); // drag_item
                    current_drag_item = curr_li;
                    if (curr_li.length) {
                      // curr_li.find('.fa-fw').slideUp(50);
                      // noinspection NestedSwitchStatementJS
                      switch (true) {
                        case elem.is('.fa-reorder'):
                          current_drag_item.after(slot_placeholder);
                          slot_placeholder.css('height', current_drag_item.height());
                          // curr_li.css('width', curr_li.width() + 'px');

                          var same_slot = current_drag_item.closest('ul'),
                            all_slot_item = same_slot.find('li').length,
                            drag_item_pos = current_drag_item.get(0).getBoundingClientRect();
                          client_x = e.clientX + (document.body.scrollLeft || document.documentElement.scrollLeft);
                          client_y = e.clientY + (document.body.scrollTop || document.documentElement.scrollTop);

                          relative_offset.x = drag_item_pos.left - client_x;
                          relative_offset.y = drag_item_pos.top - client_y;

                          pseudo_drag_element = $(document.createElement('ul')).addClass(CLASS_DRAG_ITEM);
                          //: remove current node
                          // var parent_node = curr_li[0].parentNode;
                          // if (parent_node) {
                          //   parent_node.removeChild(curr_li[0]);
                          // }
                          //: only hide current drag item
                          if (all_slot_item === 1) {
                            same_slot.addClass(CLASS_EMPTY_SLOT);
                          }
                          current_drag_item.clone().appendTo(pseudo_drag_element);
                          pseudo_drag_element.find('input,.fa-fw').remove();
                          current_drag_item.addClass('layui-hide');
                          $(document.body).append(pseudo_drag_element);
                          pseudo_drag_element.css({
                            'left': client_x + relative_offset.x,
                            'top': client_y + relative_offset.y
                          });
                          break;
                        default:
                          break;
                      }
                      e.preventDefault();
                      return false;
                    }
                  });

                $(window)
                  .on('mousemove', mouse_move_on_window)
                  .on('mouseup', mouse_up_on_window);

                last_hidden_fields = get_disabled_fields(panel);
                maintain_checkbox_status(panel);
                opts.form.on("checkbox(" + COLUMNS_PANEL_EVENT_FILTER + ")", function (obj) {
                  var cur_col_obj = $(obj.elem), checked = this.checked, key = cur_col_obj.data("key");
                  if (!checked) {
                    // remove rightest fixed bar in table-main
                    // var fix_column_r = $('.layui-table-body.layui-table-main .layui-table-col-special',
                    // '.layui-show');
                    var fix_column_r = $('.layui-table-fixed.layui-table-fixed-r .layui-table-col-special', '.layui-show');
                    if (!fix_column_r.hasClass('layui-hide')) {
                      fix_column_r.addClass('layui-hide');
                    }
                  }
                  setTimeout(function () {
                    maintain_checkbox_status(panel);
                  }, 100);

                  _.each(config.cols, function (item1, i1) {
                    _.each(item1, function (item2, i2) {
                      if (item2.key === key) {
                        var hide = !checked;
                        item2.hide = hide;
                        if (hide !== layui.table.thisTable.config[opts.tableId].cols[i1][i2].hide) {
                          layui.table.thisTable.config[opts.tableId].cols[i1][i2].hide = hide;
                        }
                        $(opts.container).find('.layui-table-box *[data-key="' + config.index + "-" + key + '"]')[checked ? "removeClass" : "addClass"]("layui-hide");
                      }
                    });
                  });
                });
              }
            });
            break;
          case "_export":
            openPanel({
              list: (function () {
                return (
                  '<li data-type="pdf">' + gettext('pdf_export') + '</li>' +
                  '<li data-type="xls">' + gettext('xlsx_export') + '</li>' +
                  '<li data-type="csv">' + gettext('csv_export') + '</li>' +
                  '<li data-type="txt">' + gettext('txt_export') + '</li>');
              })(),
              done: function done(panel, list/*, panel_opts*/) {
                list.on("click", function () {
                  var export_type = $(this).data("type"), title = $(this).text();
                  // stamp = (new Date()).getTime(),
                  // csrf = $("input[name='csrfmiddlewaretoken']").val();
                  layui.use(["layer", "form"], function () {
                    var $ = layui.jquery, layer = layui.layer,
                      // curr_table_page = opts.curTable.config.page,
                      curr_table_config = get_layui_table_config(opts.model),
                      curr_table_page, page, page_size, count;
                    if (curr_table_config && Object.keys(curr_table_config.page || {}).length) {
                      // fetch table config from the global layui object
                      curr_table_page = curr_table_config.page;
                      page = curr_table_page.curr;
                      page_size = curr_table_page.limit;
                      count = curr_table_page.count;
                    } else {
                      // fetch these literal data(with Higher real-time requirements) from HTML DOM
                      curr_table_page = $('.layui-table-page', '.layui-show');
                      page = curr_table_page.find('.layui-laypage-curr').text();
                      page_size = curr_table_page.find('select').get(0).value;
                      count = curr_table_page.find('.layui-laypage-count').text().replace(/\D*/g, '');
                    }
                    var export_headers = [];
                    var report_headers = opts.curTable.config.cols[0];
                    var data_list = opts.table.cache[opts.curTable.config.id.toString()];
                    report_headers.forEach(function (item) {
                      if (item.hide === false && item.field !== 'id') {
                        export_headers.push(item.field);
                      }
                    });
                    if(slotArryFlag){
                      var export_headers_sort = [];
                      slotArry.forEach(function (value) {
                        if ($.inArray(value, export_headers) !== -1){
                          export_headers_sort.push(value)
                        }
                      });
                      export_headers = export_headers_sort;
                    }
                    var dataExport = function (layero) {
                      var exportForm = $(layero).find("form.export-form");
                      var params = $.extend({
                        is_virtual: false,
                        export_headers: export_headers.join(',')
                      }, get_layui_table_config(opts.model).where);
                      var formDataArray = $(exportForm).serializeArray();
                      formDataArray.forEach(function (item) {
                        params[item.name] = item.value;
                      });
                      var exportUrl = opts['export_url'].split("?")[0];
                      if (params.is_virtual) {
                        var csrfmiddlewaretoken = get_layui_table_config(opts.model).where.csrfmiddlewaretoken
                        if (csrfmiddlewaretoken) {
                          params['csrfmiddlewaretoken'] = csrfmiddlewaretoken
                        }
                        $.ajax({
                          url: exportUrl
                          , async: false
                          , type: "POST"
                          // , dataType: "json"
                          // , headers: {'content-type': 'application/json'}
                          , data: params
                          , success: function success(response) {
                            //window.location.href = response.detail;
                            if(response.code == -1 ){
                              layer.msg(response.msg);
                            } else {
                              function DownloadFile(filename, url) {
                                var pom = document.createElement("a");
                                pom.setAttribute("href", url);
                                pom.setAttribute("download", filename);
                                pom.setAttribute("target", "_blank");
                                pom.click();
                              }
                              DownloadFile(response.detail.slice(22), response.detail);
                              // window.open(response.detail, '_blank').location;
                            }
                          }
                          , error: function (XMLHttpRequest, textStatus, errorThrown) {
                            console.trace('[ERROR] happened while exporting', arguments);
                          }
                        });
                      } else {
                        delete params['is_virtual']
                        delete params['csrfmiddlewaretoken']
                        params['limit'] = params['page_size']
                        if(params['page'] == '') {
                          params['page'] = 1
                          params['limit'] = 999999
                          params['page_size'] = 999999
                        }
                        if(params['limit'] == '') {
                          params['limit'] = 15
                          params['page_size'] = 15
                        }
                        window.open(concatenate_url(opts['export_url'], params), '_blank').location;
                      }
                    };
                    $.ajax({
                      url: '/base/get_export_form/'
                      , type: 'GET'
                      , dataType: 'html'
                      , data: {
                        app_label: opts.app,
                        model: opts.model,
                        export_type: export_type,
                        page: page,
                        page_size: page_size,
                        count: count
                      }
                      , success: function (response) {
                        var size_w = '540px';
                        var size_h = '350px';
                        if(export_type == 'pdf'){
                          size_h = '380px'
                        }
                        layer.open({
                          type: 1
                          , title: title
                          , area: [size_w, size_h]
                          , content: response
                          , btn: [gettext("btn_confirm"), gettext("btn_cancel")]
                          , btnAlign: 'c'
                          //, success: function (layero, index) {
                          //  form.render();
                          //  form.val("exportForm", {page: page});
                          //}
                          , yes: function (index, layero) {
                            dataExport(layero);
                            layer.close(index);
                          }
                        });
                      }
                      , error: function (XMLHttpRequest, textStatus, errorThrown) {
                      }
                    });
                  });
                });
              }
            });
            break;
          default:
            break;
        }
      });
      // event binding for batch operations
      if (opts.actions.length > 0) {
        var action_bind = function action_bind(elem) {
          $(elem).on('click', (function () {
            var action_index = $(this).attr("index"),
              group_index = $(this).attr("group"),
              group = opts.actions[group_index],
              action = group.actions[action_index],
              selected_data = opts.table.checkStatus(opts.curTable.config.id).data,
              op = $.extend({}, action, {objects: selected_data}),
              params = {
                elem: this,
                action: op
              },
              // noinspection JSUnresolvedVariable
              need_select = op['batch_select'],
              need_one = op.unique,
              _len = op.objects.length;
            // [constrain]: you need select at least one item
            if ((need_select || need_one) && _len === 0) {
              layer.msg(gettext("action_notification_objectIsRequired"), {
                icon: 0
                , time: 1000
              });
              return;
            }else if (need_one && _len > 1){
              layer.msg(gettext("action_notification_objectNotMultiple"), {
                icon: 0
                , time: 1000
              });
              return;
            }

            if (op["confirmation"]) {
              layui.use("layer", function () {
                var layer = layui.layer;
                var confirm_text = "";
                var confirmation_times = op["confirmation_times"];
                var action_confirm_password = op["action_confirm_password"];
                if (need_select) {
                  confirm_text = interject(
                    op["confirmation"],
                    {
                      0: _len,
                      1: _len > 1 ? gettext("action_confirm_items") : gettext("action_confirm_item")
                    }
                  );
                } else {
                  confirm_text = op["confirmation"];
                }
                var action_confirm = function (confirmation_times) {
                  if (confirmation_times > 0) {
                    layer.confirm(
                      confirm_text,
                      {btn: [gettext("btn_confirm"), gettext("btn_cancel")], title: gettext("layer_title")},
                      function (index, layero) {
                        confirmation_times--;
                        if (confirmation_times < 1) {
                          if (!action_confirm_password) {
                            action_post(op, index, layero);
                          } else {
                            layer.close(index);
                            layer.prompt(
                              {
                                formType: 1,
                                title: gettext("Please enter 123456 to confirm that you want to delete them."),
                                maxlength: 6
                              },
                              function (pass, index, layero) {
                                if (pass === "123456") {
                                  action_post(op, index, layero);
                                } else {
                                  layer.close(index);
                                  layer.msg(gettext("Wrong information entered."), {time: 2000, icon: 0});
                                }
                              }
                            );
                          }
                        } else {
                          action_confirm(confirmation_times);
                        }
                      }
                    );
                  }
                };
                action_confirm(confirmation_times);
                // layer.confirm(
                //   confirm_text,
                //   {btn: [gettext("btn_confirm"), gettext("btn_cancel")], title: "Confirm"},
                //   function (index, layero) {
                //     action_post(op, index, layero);
                //   }
                // );
              });
            } else {
              action_request(params);
            }
          }));
        };

        //: add `here` tips for search menu-item by Action
        var switch_menu = $($SWITCH_MENU),
          user_input_field = switch_menu.find('input'),
          user_input_val = user_input_field.val().replace(/\s*/g, ''),
          action_highlight = false
          , tips_ids = [];
        if (user_input_field.data('category') === 'action' && user_input_val.length) {
          action_highlight = true;
        }

        var collect_highlight_action = function (_action_obj, _action_id) {
          var included = _action_obj['verbose_name']
            .toLowerCase().replace(/\s*/g, '').includes(user_input_val);
          if (action_highlight && included) {
            var nav_item = $(_action_id).closest('.layui-nav-item');
            if (nav_item.length && tips_ids.indexOf(_action_id) === -1) {
              tips_ids.push(nav_item);
            }
          }
        };

        opts.actions.forEach(function (action_set, idx_1) {
          var group = action_set["name"]
            , is_multi = action_set["multi"]
            , actions = action_set["actions"];

          if (actions !== undefined && actions.length > 0) {
            if (!is_multi && actions.length === 1) {
              var _action = actions[0]
                , action_id = opts.model + '_' + _action.name
                , $action_id = '#' + action_id
                , action_elem = '<li class="layui-nav-item"><a id="' + action_id
                                + '" class="layui-btn layui-btn layui-btn-sm" title="'
                                + _action.description + '" group="' + idx_1 + '" index="0">' + group + "</a></li>";

              $(opts.actionContainer).find(".layui-nav").append(action_elem);
              collect_highlight_action(_action, $action_id);
              action_bind($action_id);
            } else {
              var action_group =
                '<li class="layui-nav-item"><a class="layui-btn layui-btn layui-btn-sm" href="javascript:void(0);">' + group + '<span class="layui-nav-more"></span></a><d1 class="layui-nav-child layui-anim layui-anim-upbit">';

              actions.forEach(function (_action, idx_2) {
                var action_id = opts.model + '_' + _action.name;
                action_group += [
                  '<dd><a id ="' + action_id + '" class="layui-btn layui-btn layui-btn-sm" ',
                  'title="' + _action.description + '" group="' + idx_1 + '" index="' + idx_2 + '">',
                  _action["verbose_name"] + "</a></dd>"].join('');
              });
              action_group += "</d1></li>";
              $(opts.actionContainer)
                .find(".layui-nav")
                .append(action_group);
              actions.forEach(function (_action /*, j*/) {
                var action_id = opts.model + '_' + _action.name,
                  $action_id = '#' + action_id;
                action_bind($action_id);
                collect_highlight_action(_action, $action_id);
              });
            }
          }
        });
        _.each(tips_ids, function (elem) {
          layer.tips(gettext('here'), elem, {
            time: 3000,
            closeBtn: 1,
            tipsMore: true,
            tips: [3, '#393d49']
          });
        });
        opts.element.render("nav");
      }
    }
  };

  function get_grid_container(_othis) {
    var _container;
    if (_othis && _othis.length) {
      if (_othis.get(0).nodeName.toLowerCase() === 'table') {
        _container = _othis.parent();
      } else {
        _container = _othis.closest('.layui-table-view').parent();
      }

      var eligible_grid_container = (
        _container.is(CONST_FILTER_GRID_TRAIT)
        ? _container
        : _container.closest(CONST_FILTER_GRID_TRAIT));

      if (eligible_grid_container.length) {
        _container = eligible_grid_container;
      }
    }
    return _container;
  }

  $.fn.get_grid_container = get_grid_container;

  function get_grid_scale(cls_name, grid_trait, avail_screen_type) {
    if (avail_screen_type === undefined) {
      // extreme small, small, middle, large
      avail_screen_type = ['xs', 'sm', 'md', 'lg'];
    }
    return parseInt(cls_name.replace(
      new RegExp([
          grid_trait,
          interpolate('(?:%(screen_type)s)(\\d+)', {'screen_type': avail_screen_type.join('|')})
        ].join('')
        , "i"), function () {
        /**
         * @param match: The matched substring.
         * @param p1, p2, ...: The nth string found by a parenthesized capture group, provided
         *   the first argument to replace() was a RegExp object. (Corresponds to $1, $2, etc.)
         *   For example, if `/(\a+)(\b+)/` was given, p1 is the match for `\a+`, and p2 for `\b+`.
         * @param offset: The offset of the matched substring within the whole string being
         *   examined. (For example, if the whole string was 'abcd', and the matched substring
         *   was 'bc', then this argument will be 1.)
         * @param string: The whole string being examined.
         */
        var args = Array.prototype.slice.apply(arguments),
          args_len = args.length,
          // match = args[0],
          captured = args.slice(1, args_len - 2);
        return captured[0];
      }) || 0
    );
  }

  function get_rendered_panel_html(config, html_template, format_method) {
    if (html_template === undefined) {
      html_template = '<li data-op="%(op)s">%(name)s</li>';
    }
    if (format_method === undefined) {
      var pattern = new RegExp('%\\((.*?)\\)s|{(.*?)}', 'gi');
      // pattern.lastIndex = 0;
      if (pattern.test(html_template)) {
        if (RegExp.$1.length) {
          format_method = 'interpolate';
        } else if (RegExp.$2.length) {
          format_method = 'interject';
        } else { // default
          format_method = 'interpolate';
        }
      }
    }

    var _tmp_list = [],
      _format = window[format_method];
    _.each(config, function (conf) {
      _tmp_list.push(_format(html_template, conf, ''));
    });
    return _tmp_list.join('');
  }

  $.fn.get_rendered_panel_html = get_rendered_panel_html;


  /**
   *
   * @param {string} [hex_code]
   * @returns {string}
   */
  $.fn.get_model_name_from_hex = function (hex_code) {
    if (hex_code === undefined) {
      hex_code = $('.layui-tab-title#zk-layui-tab-ul>li.layui-this').attr('lay-id');
    }
    if (hex_code !== undefined && typeof hex_code === 'string') {
      return decodeHex(hex_code).replace(/\s|^\/|\/$/g, '').split('/')[1];
    }
  };

  $.fn.reload_layui_data_grid = function (options) {
    var tab_item = $.fn.actions.defaults.current_tab_item,
      to_first = null, // jump back to first page
      hex_code = undefined;
    if (options) {
      to_first = options.to_first;
      hex_code = options.hex_code;
    }

    if (!to_first || typeof to_first !== "boolean") {
      to_first = true;
    }
    if (to_first && $('.layui-laypage-curr', tab_item).text() !== '1') {
      var $first_page = $('a:not([class])[data-page=1]', '.layui-show').get(0);
      $first_page && $first_page.dispatchEvent(new Event('click'));
    }
    var refresh_btn = $('.layui-laypage-refresh', tab_item).get(0);
    if (refresh_btn) {
      refresh_btn.dispatchEvent(new Event('click'));
    } else { // if we cannot find the refresh button, then call the reload method of table
      var model_name = null;
      model_name = $.fn.get_model_name_from_hex(hex_code);
      if (model_name && model_name.length > 0) {
        layui.use(['table', 'tablePlug'], function () {
          var table = layui.table, tablePlug = layui.tablePlug,
            table_id = interpolate($.fn.actions.defaults.table_id_template, [model_name]),
            table_dom = $('#' + table_id);
          tablePlug.smartReload.enable(true);

          if (table_dom.length) {
            table.reload(table_id, {
              page: {curr: 1}
            });
          }
        });
      }
    }
  };

  $.fn.actions.const = {
    KEY_LAST_BEST_FIT_LAPSE: KEY_LAST_BEST_FIT_LAPSE,
    KEY_LAST_SIDE_MENU_OPEN_STATUS: KEY_LAST_SIDE_MENU_OPEN_STATUS,
    KEY_TABLE_CONTAINER_PREFERENCES: KEY_TABLE_CONTAINER_PREFERENCES
  };

  $.fn.actions.defaults = {
    editForm: "",
    lay_table_cell_style: '.laytable-cell-%s',
    layer_id_tmp: 'layui-layer%s',
    current_tab_item: '.layui-tab-item.layui-show',
    table_id_template: 'id_grid_%s',
    actionContainer: "div.grid-toolbar",
    actionContainerUl: "div.grid-toolbar ul",
    col_ctrl_panel_tmp: '<span data-name="%(name)s"><a href="javascript:void(0);" title="%(title)s"><i class="fa fa-fw fa-1-5x %(icon)s"></i></a></span>',
    tipsFail: "Failed.",
    tipsSucc: "Successful!",
    $pageInput: null,
    $gridParent: null,
    pageButton: ".layui-laypage-btn",
    table: null,
    element: null,
    curTable: null,
    tableId: 0,
    best_fit_interval: 150,
    best_fit_max_col_width: 300,
    best_scale_max_col_width: 400,
    action_triggered_auto: true,
    keep_cell_min_width: false,
    actions: [],
    scale: 1.0
  };
})(jQuery);
