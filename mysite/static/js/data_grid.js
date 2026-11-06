/**
 * Created by Boyce on 2018/11/26.
 * Modified by Boyce on 2019/01/07.
 */
(function () {
  var range_select_inited = false,
    C_TABLE_ACTION_EAST = '.layui-table-tool-self',
    $C_ELEM_CELL = '.layui-table-cell',
    $C_ELEM_BODY = '.layui-table-body',
    $C_ELEM_HEAD = '.layui-table-header',
    C_TABLE_CLICK = 'layui-table-click',
    ELEM_VIEW = 'layui-table-view',
    ELEM_GRID_DOWN = 'layui-table-grid-down',
    device_info = layui.device();
  // noinspection ES6ModulesDependencies

  $.fn.dataGrid = function (options) {
    // noinspection ES6ModulesDependencies
    var opts = $.extend({}, $.fn.dataGrid.defaults, options);

    layui.use(['table', 'form', 'element', 'laytpl', 'laydate', 'autoColumnWidth', 'tablePlug'], function () {
      var $ = layui.jquery, table = layui.table, form = layui.form, element = layui.element,
        laydate = layui.laydate, tablePlug = layui.tablePlug, laytpl = layui.laytpl;
      $(opts.fluid_container + " div.search-form input.layui-datetime-range").each(function () {
        laydate.render({elem: this, type: 'datetime', range: '~'});
      });

      laytpl.config({
        open: '{{',
        close: '}}'
      });
      form.render();

      var contenttype_id = encodeURIComponent(JSON.stringify([opts.history_contenttype])),
        row_limit = opts.grid_opts.limit;
      // deep_copy: true
      $.extend(true, opts.grid_opts, {
        id: opts.table_id,
        elem: opts.table_elem,
        toolbar: opts.toolbar_id,
        defaultToolbar: [],
        smartReloadModel: true,
        autoSort: false,  // disable front-end sorting
        cellMinWidth: opts.cell_min_width,
        height: 'full-175',
       // height: (function () {
         //  var row_num = opts.is_history ? Math.min(row_limit, opts.CONST_MAX_DIALOG_ROWS_LIMIT) : row_limit;
         //  return get_available_area_of_table(row_num);
        // }()),
        loading: true,
        page: {
          layout: ['refresh', 'limit', 'prev', 'page', 'next', 'count', 'skip'],
          curr: 1 //Start from first page
        }, text: {
          none: gettext('none_data')
        }, done: function (/*res, curr, count*/) {
          var load_done_callback = opts.callback.load && opts.callback.load.done || $.noop, task_queue = [
            load_done_callback,
            function () {
              $.fn.trigger_action_auto(opts.model);
            },
            $.fn.adjust_fixed_bar_misplace_if_any
          ], last_best_fit_lapse = window['get_session_storage']($.fn.actions.const.KEY_LAST_BEST_FIT_LAPSE);

          task_queue.forEach(function (func/*, index*/) {
            func();
          });

          setTimeout(function () {
            trigger_action_auto_review(opts.model);
          }, last_best_fit_lapse || 100);
        }, parseData: function (res) {
          return {
            "code": res.code,
            "msg": res.msg,
            "count": res.count,
            "data": res.data
          };
        },
        limits: (function () {
          var default_limit = [10, 20, 50, 80, 100, 200];
           if (default_limit.indexOf(row_limit) === -1) {
             var insert_loc = default_limit.length;
             for (var i in default_limit) {
               if (/^\d+$/.test(i)) {
                 var n = parseInt(i);
                 if (default_limit[n] > row_limit) {
                   insert_loc = n;
                   break;
                 }
               }
             }
            // default_limit.splice(insert_loc, 0, row_limit);
          }
          return default_limit;
        })(),
        //limit: 30,
        init_where: {},
        where: (function () {
          var wher = opts.is_history
                 ? {_p1_content_type__id__in: contenttype_id}
                 : {};

          var initWhere = opts.grid_opts && opts.grid_opts.init_where || (opts[opts.table_id] && opts[opts.table_id].init_where) || {};
          $.extend(wher, initWhere);
          return wher;

        })()
      });

      //grid_opts['done'] = function (res, curr, count) {
      //    // 分页后重新绑定范围选择事件
      //    range_select_inited = false;
      //    console.log(res, curr, count);
      //    console.log(this);
      //  }
      var grid_table = table.render(opts.grid_opts);
      $(opts.fluid_container + " div.grid-toolbar").actions({
        container: opts.fluid_container,
        actionContainer: opts.fluid_container + " div.grid-toolbar",
        model: opts.model,
        app: opts.app,
        table: table,
        tableId: opts.table_id,
        form: form,
        element: element,
        curTable: grid_table,
        grid_opts: opts.grid_opts,
        is_history: opts.is_history,
        actions: opts.actions,
        history_url: opts.history_url,
        export_url: opts.export_url,
        column_order_url: opts.column_order_url,
        disabled_fields_url: opts.disabled_fields_url,
        disabled_action_panel_east: (function () {
          if (!opts.disabled_action_panel_east) {
            opts.disabled_action_panel_east = [];
          }
          return opts.disabled_action_panel_east.concat(opts.is_history ? ['history', 'expand'] : []);
        })(),
        init_disabled_fields: opts.init_disabled_fields,
        csrf: opts.csrf_token,
        dimension: opts.dimension,
        callback: opts.callback['actions'],
        use_backend_hidden_fields: opts.use_backend_hidden_fields
      });
      setTimeout(function () {
        $(opts.model + '_navbar').adminFilters({
          model: opts.model, table: table, curTable: grid_table,
          where: opts.is_history ? {_p1_content_type__id__in: contenttype_id} : {}
        });
      }, 500);

      function previewCompactGridWrapper() {
        var which_layer; // closure variable
        return function (hide) {
          var othis = $(this), elemCell = othis.children($C_ELEM_CELL);
          if (hide) {
            which_layer && layer.close(which_layer);
          } else if (elemCell.text().trim().length && elemCell.prop('scrollWidth') > elemCell.outerWidth() + 1) {
            which_layer = layer.tips(elemCell.text(), elemCell, {
              tips: [1, '#393d49'],
              time: 0
            });
          }
        };
      }

      function grid_expand(hide) {
        var othis = $(this),
          elemCell = othis.children($C_ELEM_CELL);

        if (hide) {
          othis.find('.layui-table-grid-down').remove();
        } else if (elemCell.prop('scrollWidth') > elemCell.outerWidth() + 1) {
          if (elemCell.find('.' + ELEM_GRID_DOWN)[0]) {
            return;
          }
          othis.append('<div class="' + ELEM_GRID_DOWN + '"><i class="layui-icon layui-icon-down"></i></div>');
        }
      }

      var previewCompactGrid = previewCompactGridWrapper(),
        lay_container = $(opts.fluid_container),
        head_or_body = lay_container.find($C_ELEM_BODY + ',' + $C_ELEM_HEAD);
      if (opts.override_native_preview_event) {
        head_or_body.off('mouseenter', 'td').off('mouseleave', 'td');
        lay_container.off('click', '.' + ELEM_GRID_DOWN);
      }

      head_or_body.on('mouseenter', 'td,th', function () {
        previewCompactGrid.call(this);
        grid_expand.call(this);
      }).on('mouseleave', 'td,th', function () {
        previewCompactGrid.call(this, 'hide');
        grid_expand.call(this, 'hide');
      });

      lay_container.find($C_ELEM_BODY).on('click', '.' + ELEM_GRID_DOWN, (function (tips_options) {
        return function (e) {
          var othis = $(this),
            td = othis.parent(),
            elem = lay_container.find(ELEM_VIEW),
            elem_cell = td.children($C_ELEM_CELL);

          // tips_index =
          layer.tips([
            '<div class="layui-table-tips-main" style="margin-top: -' + (elem_cell.height() + 16) + 'px;' + function () {
              if (tips_options.size === 'sm') {
                return 'padding: 4px 15px; font-size: 12px;';
              }
              if (tips_options.size === 'lg') {
                return 'padding: 14px 15px;';
              }
              return '';
            }() + '">',
            elem_cell.html(),
            '</div>',
            '<i class="layui-icon layui-table-tips-c layui-icon-close"></i>'
          ].join(''), elem_cell[0], {
            tips: [3, ''],
            time: -1,
            shade: 0.01,
            shadeClose: true, // close shade area to close current expanded_grid layer
            anim: -1,
            maxWidth: (device_info.ios || device_info.android) ? 300 : elem.width() / 2,
            isOutAnim: false,
            skin: 'layui-table-tips',
            success: function (layero, index) {
              layero.find('.layui-table-tips-c').on('click', function () {
                layer.close(index);
              });
            }
          });
          layui.stope(e);
        };
      }({size: 'lg'})));

      function _default_callback() {
      }

      tablePlug.smartReload.enable(true);
      $(".layui-nav-bar").addClass('layui-hide');
      table.on('row(' + opts.model + ')', function (obj) {
        $('.' + C_TABLE_CLICK).removeClass(C_TABLE_CLICK);
        $(obj.tr).toggleClass(C_TABLE_CLICK);
        opts.rowClick(obj);
      });

      table.on('checkbox(' + opts.model + ')', function (obj) {
        // obj.checked: current row is in checked state?, obj.data: data of current selected row
        // obj.type: all -> check all row, none: only check current row
        if (obj.type === 'one' && !range_select_inited) {
          handler_range_select(obj.data["LAY_TABLE_INDEX"]);
          range_select_inited = true;
        }
        if (obj.type === 'all') {
          // 全选后重新绑定范围选择事件
          range_select_inited = false;
        }
      });

      /**
       * @desc: server-end ordering
       * @param:
       * - obj.field: 当前排序的字段名
       * - obj.type: 当前排序类型：desc（降序）、asc（升序）、null（空对象，默认排序）
       * - this: 当前排序的 th 对象
       *
       * 注：sort 是字段排序事件名， filter 是table原始容器的属性 lay-filter="对应的值"
       */
      table.on('sort(' + opts.model + ')', function (obj) {
        var sort = {}, msg, filter_params, sort_params;
        if (obj.type == null) {
          sort.field = undefined;
          sort.type = undefined;
        } else {
          // sort = JSON.parse(JSON.stringify(obj));
          sort = $.extend(sort, obj);
        }

        filter_params = $.fn.get_filter_params(opts.model);
        sort_params = {
          field: sort.field, //排序字段
          order: sort.type //排序方式
        };
        table.reload(opts.table_id, {
          initSort: obj, //记录初始排序，如果不设的话，将无法标记表头的排序状态。
          where: $.extend({}, filter_params, sort_params)
        });

        // if (sort.type) {
        //   msg = gettext('Sorting by') + ' ' + this[0].textContent + ' ' + sort.type;
        // } else {
        //   msg = gettext('Sorting by') + ' ' + gettext('default field.');
        // }
        // layer.msg(msg, {
        //   time: 1000, closeBtn: 2
        // });
      });

      table.on('tool(' + opts.model + ')', function (obj) {
        var data = obj.data;
        if (opts.all_perms.change) {
          function after_edit_done(layer, index, layero) {
            return function (response) {
              if (response.code === 0) {
                layer.close(index);
                var edit_callback = opts.callback['edit'],
                  edit_callback_done = edit_callback ? edit_callback['done'] : undefined;

                if (edit_callback_done && type(edit_callback_done) === 'function') {
                  edit_callback_done.apply(opts);
                } else {
                  _default_callback.apply(opts);
                }
                $.fn.do_filter({
                  model: opts.model,
                  table: table,
                  table_id: opts.table_id
                });
                layer.msg(gettext("action_post_successful"), {time: 1000, icon: 1});
              } else {
                parse_msg_show_tips(layero, response.msg);
              }
            };
          }

          function send_edit_ajax(index, layero) {
            var valid_form = window['before_submit_' + "id_grid_" + opts.model];
            if (valid_form && $.isFunction(valid_form) && !valid_form()) {
              return;
            }
            var form = $(layero).find("form.layui-form");
            if($(layero).find("#idSubmitTrigger_"+opts.model).length > 0) {
               $("#idSubmitTrigger_" + opts.model).click();
               if($(form).find('input.layui-form-danger').length>0)
                   return
            }
            var disabled = form.find(':input:disabled').removeAttr('disabled');
            $(form).submit(function (e) {
              e.preventDefault();
              var formData;
              formData = new FormData(this);
              formData.append('obj_id', data['id']);

              $.ajax({
                url: opts.edit_url,
                type: 'POST',
                data: formData,
                dataType: 'json',
                success: after_edit_done(layer, index, layero),
                error: function () {
                  disabled.attr('disabled', 'disabled');
                  layer.closeAll('loading');
                },
                processData: false, contentType: false
              });
              return false;
            }).trigger('submit');
            $(form).off('submit');

            // var _data = form.serialize();
            // _data += '&obj_id=' + data['id'];
            // $.ajax({
            //   url: opts.edit_url,
            //   type: 'POST',
            //   data: _data,
            //   dataType: 'json',
            //   success: after_edit_done(layer, index, layero)
            // });
            $(layero).find("div.layui-form-button a.layui-btn-cancel").click(function () {
              layer.close(index);
            });
          }

          if (obj.event === 'editPopUp' || obj.event === 'edit') {
            var loadIndex = layer.load();
            $.ajax({
              url: opts.edit_url,
              type: 'GET',
              data: {
                obj_id: data['id']
              },
              dataType: 'html',
              success: function (res) {
                // console.debug({'obj_id': data['id']});
                var current_tab = $($.fn.adminSite.const.CONST_CURRENT_TAB_TITLE_AREA);
                current_tab.data('this_record', $.extend({
                  model: opts.model
                }, data));
                // var lay_index =
                layer.close(loadIndex);
                layer.open({
                  title: gettext("model_action_editTitle"),
                  type: 1,
                  zIndex: 998,
                  //skin: 'layui-layer-rim',
                  area: [opts.dimension.width, opts.dimension.height],
                  content: res,
                  btn: [gettext("btn_confirm"), gettext("btn_cancel")],
                  yes: send_edit_ajax,
                  end: function () {
                    layer.closeAll('tips');
                    current_tab.removeData('this_record');
                  },
                  success: function (layero/*, index*/) {

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
                      // $.fn.adjust_label_width_dynamically([$('[class^=layui-col-]:not([class$=12])',
                      // layero).filter(function (elem) { return $(elem).closest('[class^=layui-col-]').length; })],
                      // '.layui-form-checkbox>span');
                    }, 300);

                    // 如果宽度是auto的情况下，需要自动加上firefox和ie下滚动条兼容问题
                    if (opts.dimension.width == 'auto') {
                      var action_form = $('.data-form').parent().first()
                      var div_width = action_form.css('width');
                      if(div_width){
                        div_width = (parseInt(div_width.slice(0, -2)) + 30) + 'px'
                        action_form.css('width', div_width);
                      }
                    }
                  }
                });
              }
              , error: function () {
                layer.close(loadIndex);
              }
            });
          }
        }

        //监听工具条
        if (data === undefined) {
          data = obj.data;
        }
        var layEvent = obj.event; //获得 lay-event 对应的值（也可以是表头的 event 参数对应的值）
        // var tr = obj.tr; //获得当前行 tr 的DOM对象
        if(opts.events && layEvent in opts.events){
          var op = opts.events[layEvent];
          op(data);
        }else if (layEvent === 'detail') { //查看
          if (opts.all_perms.view) {
          }
        } else if (layEvent === 'del') { //删除
          if (opts.all_perms.delete) {
            layer.confirm(gettext("confirm_be_sure"), {
              title: gettext("btn_confirm"),
              icon: 3,
              btn: [gettext('btn_confirm'), gettext('btn_cancel')]
            }, function (index) {
              layer.close(index);
              //向服务端发送删除指令
              $.ajax({
                url: opts.del_url,
                type: 'POST',
                dataType: 'json',
                data: {
                  'csrfmiddlewaretoken': opts.csrf_token,
                  'obj_ids': JSON.stringify([data['id']])
                },
                success: function (msg) {
                  if (msg.code === 0) {
                    layer.msg(gettext("action_notification_successful"), {time: 1000, icon: 1});
                    // table.reload(opts.table_id);
                    var del_callback = opts.callback['delete'],
                      del_callback_done = del_callback ? del_callback['done'] : undefined;

                    if (del_callback_done && type(del_callback_done) === 'function') {
                      del_callback_done.apply(opts);
                    } else { // default callback
                      _default_callback.apply(opts);
                    }
                    $.fn.do_filter({
                      model: opts.model,
                      table: table,
                      table_id: opts.table_id
                    });
                  } else {
                    parse_msg_show_tips('', msg.msg);
                  }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                  alert(textStatus + errorThrown);
                }
              });
            });
          }
        }
      }); // end interactEvent listener

      var active_action = {
        search: function (btn_id) {
          var _where = {};
          var all_search_input = $('.layui-input[id^=search_]');
          var btn_2_input = {};
          for (var i = 0, n = all_search_input.length; i < n; i++) {
            btn_2_input[all_search_input[i]['id'] + '_btn'] = all_search_input[i];
          }

          var field = btn_2_input[btn_id].name;
          _where[field] = $(btn_2_input[btn_id]).val();
          //执行重载

          table.reload('id_grid_' + opts.model, {
            page: {
              curr: 1 //重新从第 1 页开始
            }, where: {
              key: JSON.stringify(_where)
            }
          });
        }
      };
      $('.layui-btn[id^=search_][id$=_btn]').on('click', function () {
        var type = $(this).data('type');
        //console.log('click_search: ', type, $(this).data('type'), $(this).get(0).id);
        active_action[type] ? active_action[type].apply(this, [$(this)[0]['id']]) : '';
      });
    }); // end use table

    /**
     * @description 处理区间选择事件
     * 1. 获取 parent_container 即数据表格的容器对象
     * 2. 取得数据表格的 check_box 列
     * 3. 为 check_box 列的按钮绑定点击事件
     * 4. 点击事件中包含用户点击行为的检测，判断是否处于区间选择范围中： (last_checked_index, tartget_index) 且 shift 键已按下
     * 4* Tips 1： 需要注意 last_checked_index 不一定小于 target_index, 如为逆选择, 则需要反转
     * 4* Tips 2： last_checked_index, target_index 为用户手动点击项，无需再派发事件
     * 5. 对于选中范围中的 check_box 取出 index 放到数组中，之后统一进行事件的派发
     * @author: Boyce Gao
     * @param _last_index := 上次选中的元素的索引
     * @return void 自执行闭包方法处理事件的绑定
     */
    function handler_range_select(_last_index) {
      var last_checked_item = null;
      var last_checked_index = null;
      var all_need_click = [];
      // var unique_checked = new Set();
      return (function () {
        // parent div container
        var parent_container = null;

        var tableBox = $("#id_grid_" + opts.model).siblings().find('.layui-table-box');
        if (tableBox.find(".layui-table-fixed.layui-table-fixed-l").length > 0) {
          parent_container = tableBox.find(".layui-table-fixed.layui-table-fixed-l");
        } else {
          parent_container = tableBox.find(".layui-table-body.layui-table-main");
        }

        var body_check_box = $('td[data-field=id][align=center] .layui-form-checkbox', parent_container);

        // var main_check_box = $('.layui-table-main td[data-field=id][align=center] .layui-form-checkbox');

        function get_data_index(sel) {
          return $(sel).closest('tr[data-index]').data('index');
        }


        for (var i = 0, n = body_check_box.length; i < n; i++) {
          var check_box = body_check_box[i];
          if (!$(check_box).hasClass('layui-form-checked')) { /* console.log(elem);*/
          }

          check_box.onclick = function (event) {
            if (!event) {
              event = window.event;
            }
            var target = event.target ? event.target : event.srcElement;
            var target_index = get_data_index(target);

            if (_last_index !== undefined) {
              last_checked_index = _last_index;
              _last_index = undefined;
            } else {
              last_checked_index = last_checked_item ? get_data_index(last_checked_item) : null;
            }
            // console.log('### last_checked', last_checked_item, last_checked_index);

            if (last_checked_index !== target_index && event.shiftKey === true) {
              // _last_checked_item = last_checked_item;
              var inrange = false;

              //console.log('### inrange', inrange, 'shift', event.shiftKey);
              if (last_checked_index > target_index) {
                var temp = last_checked_index;
                last_checked_index = target_index;
                target_index = temp;
              }
              // console.log('### processing range', last_checked_index, target_index);
              for (var began_index = last_checked_index, i = began_index, n = body_check_box.length; i < n; i++) {
                var elem = body_check_box[i];
                var elem_index = get_data_index(elem);
                // if (compare_data_index(elem, _last_checked_item)) {  // DEBUG
                //    console.log('### begin point ', elem, get_data_index(elem));
                // }

                // 不包含最后一个
                if (elem_index === target_index) {
                  inrange = (!inrange);
                  all_need_click.forEach(function (item/*, index*/) {
                    //{#console.log('### click', item);#}
                    // item.dispatchEvent(new Event('click'));
                    var checkCell = parent_container.find("tr[data-index=" + item + "]").find("td div.laytable-cell-checkbox div.layui-form-checkbox i");
                    if (checkCell.length > 0) {
                      checkCell.click();
                    }
                  });
                  all_need_click.splice(0, all_need_click.length);
                  break;
                }

                // console.log(elem_index + 1, last_checked_index + 1, get_data_index(target) + 1, 'inrange',
                // inrange,);  // DEBUG
                if (inrange) {
                  //console.log('inrange', elem);
                  if (!$(elem).prop('checked')/* && !unique_checked.has(elem_index) */) {
                    // elem.dispatchEvent(new Event('click'));
                    all_need_click.push(elem_index);
                    /*unique_checked.add(elem_index);*/
                  } else {
                    // console.log(elem_index, 'already checked');
                  }
                  // all_need_click.push(elem);
                }
                // 不包含第一个
                if (elem_index === last_checked_index) {
                  inrange = (!inrange);
                }
              }
            }
            last_checked_item = target;
            // console.log('last_checked_item', 'changed', get_data_index(last_checked_item));
            // event.stopPropagation();
          }; // check_box.dispatchEvent(new Event('click'));
        }
      })();
    }

    /**
     * @summary: 单击行任一位置, 派发勾选 checkbox 事件(即 click 事件)
     * @description: 找到 table 的 div 绑定单击事件到表格的行：
     * 1、取得本行的索引 data-index，为后面查找 checkbox 的控件作准备
     * 2、根据是否有固定列查找 checkbox 所在的表格 table（当存在固定列时，固定列是另一个 table，checkbox控件就在这上面，固定列在上层,因此要优先取这个）
     * 3、通过 table 和 data-index 查找 checkbox 控件，如果存在，则执行单击
     * 4、对 td 的单击事件进行拦截停止，防止事件冒泡再次触发上述的单击事件
     * 5、在页面初始化完成后执行。
     * @author: Boyce Gao
     */
    $(document).on("click", ".layui-table-body table.layui-table tbody tr", function () {
      var index = $(this).attr('data-index');
      var tableBox = $(this).parents('.layui-table-box'),
        tableDiv = null;
      // 存在固定列
      if (tableBox.find(".layui-table-fixed.layui-table-fixed-l").length > 0) {
        tableDiv = tableBox.find(".layui-table-fixed.layui-table-fixed-l");
      } else {
        tableDiv = tableBox.find(".layui-table-body.layui-table-main");
      }
      var checkCell = tableDiv.find("tr[data-index=" + index + "]").find("td div.laytable-cell-checkbox div.layui-form-checkbox i");
      if (checkCell.length > 0) {
        checkCell.click();
      }
    });

    $(document).on("click", "td div.layui-table-cell", "td div.laytable-cell-checkbox div.layui-form-checkbox", function (e) {
      e.stopPropagation();
    });
  };

  function set_progress_bar(options) {
    layui.use(['element'], function () {
      var element = layui.element, opts = $.extend({
        filter: 'pace', percent: 0, hide: false
      }, options || {});
      if (opts.percent < 0) {
        opts.percent = 0;
      } else if (opts.percent > 100) {
        opts.percent = 100;
      }

      element.progress(opts.filter, opts.percent + '%');

      if (opts.percent === 0) {
        $($.fn.dataGrid.defaults.layui_progress_bar_selector).show();
      }
      if (opts.hide) {
        setTimeout(function () {
          $($.fn.dataGrid.defaults.layui_progress_bar_selector).hide();
        }, 3000);
      }
    });
  }

  $.fn.set_progress_bar = set_progress_bar;

  function trigger_action_auto_wrapper() {
    var retries_max = 1, cnt = 0;
    return function (model, event) {
      var _this = this, outside_arguments = arguments;

      if (event === undefined) {
        event = 'fit';
      }
      var elem = $(C_TABLE_ACTION_EAST, '#' + model + '_fluid').find(interpolate('*[lay-event=%s_%s]', [model, event]));
      if (elem.length) {
        elem.data('auto', true);
        elem.trigger('click');
        console.debug('[auto]best_fit');
        cnt = 0;
        setTimeout(function () {
          elem.data('auto', false);
          elem.removeClass('open');
        }, 100);
        return true;
      } else {
        if (cnt < retries_max) {
          cnt += 1;
          return outside_arguments.callee.apply(_this, outside_arguments);
        }
        return false;
      }
    };
  }

  $.fn.trigger_action_auto = trigger_action_auto_wrapper();

  function trigger_action_auto_review(model_name) {
    var table_box = $('.layui-table-box', '#' + model_name + '_fluid');
    if (table_box.length) {
      var table_box_rect = table_box.get(0).getBoundingClientRect(),
        last_column = $('> div.layui-table-header>table>thead>tr>th:not(.layui-table-patch)', table_box).last(),
        last_column_rect = last_column.length ? last_column.get(0).getBoundingClientRect() : undefined;
      if (table_box_rect && last_column_rect && last_column_rect.right < table_box_rect.right) {
        // console.debug('some blank area detected');
        $.fn.trigger_action_auto(model_name, 'fit');
      }
    }
  }

  $.fn.trigger_action_auto_review = trigger_action_auto_review;

  function get_available_area_of_table(row_num, tolerant_offset) {
    if (tolerant_offset === undefined || type(tolerant_offset) !== 'number') {
      tolerant_offset = 10;
    }

    return ($.fn.dataGrid.defaults.CONST_SINGLE_LAY_TABLE_ROW_HEIGHT * row_num) +
           $.fn.dataGrid.defaults.CONST_LAY_TABLE_OTHER_PARTS_HEIGHT + Math.floor(Math.random() * tolerant_offset) + 1;
  }

  $.fn.get_available_area_of_table = get_available_area_of_table;

  // noinspection ES6ModulesDependencies
  $.fn.dataGrid.defaults = {
    process_bar_selector: '.layui-progress[lay-filter=pace]',
    layui_progress_bar_selector: '.layui-progress[lay-filter=pace] .layui-progress-bar',
    cell_min_width: 80,
    override_native_preview_event: true,
    CONST_LAY_TABLE_OTHER_PARTS_HEIGHT: 104, // 30(table header) + 32(action bar) + 42(lay page)
    CONST_MAX_DIALOG_ROWS_LIMIT: 20,
    CONST_SINGLE_LAY_TABLE_ROW_HEIGHT: 23,
    rowClick: $.noop
  };
})(jQuery);
