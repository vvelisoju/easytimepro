/**
 * Created by Arvin on 2018/9/10.
 * Modified by Boyce on 2018.10.20
 */
layui.define(['element'], function (exports) {
  var element = layui.element,
    //$ = layui.jquery,
    // LIMITED_FREQUENCY = 500,
    // last_click_time = null,
    CONST_ADJUST_DELAY = 30,
    AUTO_DISAPPEAR_SECOND = 2,
    is_last_tab_loaded = true,
    last_click_module_item = null,
    last_click_menu_item = null,
    $switch_menu = '#side_menu .zk-switch-menu',
    $group_list_str = '#side_menu_nav>li',
    $tab_wrapper = '#zk-layui-tab',
    $tab_ul_str = '#zk-layui-tab-ul',
    $tab_title_str = '.layui-tab-title' + $tab_ul_str,
    $all_tab_li_str = $tab_title_str + '>li',
    $tab_list_template_str = $tab_title_str + '>li[lay-id=%s]',
    $related_menu_item_str = '.layui-nav-item.side-menu-group dl>dd>a[hex=%s]',
    preset_event_signals_x = ['need-collapse', 'need-expand', 'need-scale-x'],
    preset_event_signals_y = ['need-scale-y'],
    preset_event_signals_dual = ['need-scale-dual', 'need-scale-full', 'need-scale-restore'],
    preset_event_signals = _.union(preset_event_signals_x, preset_event_signals_y, preset_event_signals_dual),
    // tab_open_history = {}, //  every app each have individual open history
    tab_close_history = {}, //  every app each have individual close history
    width_mutation_if_need_callback_wrapper = function (lay_id) {
      $.fn.trigger_action_auto_review($.fn.get_model_name_from_hex(lay_id));
    },
    width_mutation_callback_wrapper = function (lay_id) {
      $.fn.trigger_action_auto($.fn.get_model_name_from_hex(lay_id), 'fit');
    },
    ZKTab = function () {
      this.config = {
        side_menu_filter: 'admin-nav',
        tab_filter: "zkTab",
        tab_head: "#zk-layui-tab",
        tab_ul: $tab_ul_str,
        pin_html: $.fn.adminSite.defaults.pined_tab,
        limiter_popup: false
      };
    };


  function click_tab_related_menu_item(lay_id) {
    $(interpolate($related_menu_item_str, [lay_id])).trigger('click');
  }

  /**
   *
   * @param before
   * @returns {boolean}
   */
  function check_tab_status(before) {
    if (before === undefined) {
      before = true;
    }

    var tab_cnt = $($all_tab_li_str).length;

    if (before === true) {
      if (tab_cnt === 1) {
        layer.msg(gettext('The last tab cannot be closed'), {
          title: 'Warning',
          icon: 0,
          time: 2000,
          shade: 0.3,
          closeBtn: 2,
          anim: 6
        });
        return false;
      }
    }

    if (tab_cnt > 1) {
      return true;
    } else {
      !before && $($all_tab_li_str).find('i.layui-icon.layui-tab-close').addClass('layui-hide');
      return false;
    }
  }


  function update_table_container_preferences_if_any(lay_id) {
    var last_saved = JSON.parse(
      window['get_local_storage']($.fn.actions.const.KEY_TABLE_CONTAINER_PREFERENCES) || '{}'),
      model_name = $.fn.get_model_name_from_hex(lay_id);
    var table_elem = $(interpolate('#' + $.fn.actions.defaults.table_id_template, [model_name]), '#' + model_name + '_fluid'),
      container = $.fn.get_grid_container(table_elem);
    if (container && container.length) {
      _.each(last_saved, function (cls_names) {
        container.removeClass(cls_names['off']);
        container.addClass(cls_names['on']);
      });
    }
  }

  function adjust_if_need_resize(options) {
    var lay_id, lay_index, error_msg = gettext('Missing critical arguments: lay_id or index');
    if (options !== undefined) {
      lay_id = options['lay_id'];
      lay_index = options['lay_index'];
    }

    if (lay_id === undefined) {
      if (lay_index === undefined) {
        throw Error(error_msg);
      } else {
        lay_id = $($all_tab_li_str).eq(lay_index).attr('lay-id');
        if (lay_id === undefined) {
          return;
        }
      }
    }

    var _tab_list_item = $(interpolate($tab_list_template_str, [lay_id])),
      class_list = get_prop_from_iterable(_tab_list_item.get(0).classList),
      multi_task_scheduler_delay = 300, // in microsecond
      overlapping_area = _.intersection(class_list, preset_event_signals);
    if (overlapping_area.length) {
      var task_queue;
      if (_.intersection(overlapping_area, preset_event_signals_dual).length) {
        task_queue = [
          width_mutation_callback_wrapper,
          $.fn.set_layui_content_max_height,
          $.fn.set_new_height_of_table
        ];
        //console.debug('[resize] both x-axis and y-axis.');
      } else if (_.intersection(overlapping_area, preset_event_signals_y).length) {
        task_queue = [
          $.fn.set_layui_content_max_height,
          $.fn.set_new_height_of_table
        ];
        //console.debug('[resize] only y-axis.');
      } else {
        task_queue = [width_mutation_callback_wrapper];
        //console.debug('[resize] only x-axis.');
      }
      task_queue.forEach(function (func, index) {
        setTimeout(func, (index * multi_task_scheduler_delay) || 1);
      });
      _tab_list_item.removeClass(overlapping_area.join(' '));
    }
  }


  function callback_of_frequency_limiter(_id, _module) {
    if (last_click_menu_item) {
      if (last_click_menu_item !== _id) {
        $('a[hex=' + _id + ']').closest('dd').removeClass('layui-this');
      }
      $('a[hex=' + last_click_menu_item + ']').closest('dd').addClass('layui-this');
    }
    if (last_click_module_item) {
      if (last_click_module_item !== _module) {
        $('.menu_module>a[app=' + _module + ']').closest('.menu_module').removeClass('layui-this');
      }
      $('.menu_module>a[app=' + last_click_module_item + ']').closest('.menu_module').addClass('layui-this');
      $($group_list_str).hide();
      $($group_list_str + '[app="' + last_click_module_item + '"]').show();
    }
    // ZKTab.prototype.append.apply(_tab, [elem,]) // let user enter load the content of tab anyway
  }

  ZKTab.prototype.append = function (elem, callback) {
    var _tab = this,
      _module = get_module_name(),
      _id = $(elem).attr('hex'),
      url = $(elem).attr('link');

    if (!url) {
      return;
    }

    var switch_menu = $($switch_menu),
      clear_field = switch_menu.find('i.fa-times-circle:not(.layui-hide)'),
      user_input_constrained = clear_field.length;
    if (user_input_constrained) {
      callback = function () {
        // input_field.val('').blur();
        clear_field.trigger('dbclick');
        clear_field.addClass('layui-hide');
      };
    }

    if (!callback) {
      callback = $.noop;
    }

    layer.closeAll('tips'); // necessary to remove tips which belong to other tabs
    // console.time();

    // new tab
    if ($(_tab.config.tab_ul + " > li[lay-id=" + _id + "]").length === 0) {
      var last_session_raw = window['get_local_storage']($.fn.adminSite.const.LAST_SESSION),
        last_session_obj = JSON.parse(last_session_raw || '{}');
      window['set_local_storage']($.fn.adminSite.const.LAST_SESSION, JSON.stringify({
        module: _module,
        tabs: (last_session_obj.tabs || []).concat(_id)
      }));
      // if (last_click_time && ((new Date().getTime()) - last_click_time  < LIMITED_FREQUENCY)) {
      if (_tab.config.limiter_popup && !is_last_tab_loaded) {
        layer.msg(gettext('Request too frequent! please wait the content of current tab load completely.'), {
          title: 'Prompt',
          icon: 0,
          area: '450px',
          time: AUTO_DISAPPEAR_SECOND * 1000,
          shade: [0.5, '#000'],
          anim: 1,
          closeBtn: 2
        }, callback_of_frequency_limiter);
        return;
      } else {
        !is_last_tab_loaded && callback_of_frequency_limiter();
      }
      var title = $(elem).html(),
        record_delete_option = {
          module: _module,
          record: true
        }, forgive_delete_option = {
          module: _module,
          record: false
        };
      is_last_tab_loaded = false;
      try {
        element.tabAdd(_tab.config.tab_filter, {
          title: title,
          content: '<div id="tab'+_id+'"></div>', //支持传入html
          id: _id
        });
      } catch (e) {
        if (e instanceof SyntaxError) {
          error_prompt('Oops! Cannot open new tab. Because the content of tab contains illegal characters.');
        } else {
          error_prompt('Oops! The requested tab is unavailable currently.');
        }
        return;
      }
      $.get({
        xhr: xhr_request_with_progress(),
        url: url,
        dataType: 'html',
        success: function (response) {
          // logout in another window
          if ($(response).find('#id_login').length) {
            $.fn.re_login_handler(_module, _id);
            return;
          }
          $("#tab"+_id).html(response);
          // remove the original event handler
          $(interpolate($tab_list_template_str, [_id]) + ' .layui-tab-close').off('click').on('click', function () {
            _tab.tabDelete(_id, record_delete_option);
          });
          _tab.tabChange(_id);
          var tab_content = $(interpolate('.layui-tab-item:nth-child(%s)', [
            $(interpolate($tab_list_template_str, [_id])).index() + 1
          ]), $tab_wrapper);
          if (tab_content.length) {
            var tab_form = tab_content.find('.layui-fluid form');
            if (tab_form.length) {
              $.fn.adjust_label_width_dynamically(tab_form);
            }
          }
          is_last_tab_loaded = true;
          // last_click_time = new Date().getTime();
          last_click_menu_item = _id;
          last_click_module_item = _module;

          var context_menu = new BootstrapMenu(interpolate($tab_list_template_str, [_id]), {
            fetchElementData: function ($elem) {
              return $elem.attr('lay-id');
            },
            actions: [
              {
                name: gettext('reload_tab'),
                onClick: function (_id) {
                  _tab.tabDelete(_id, forgive_delete_option);
                  click_tab_related_menu_item(_id);
                }
              }, {
                name: gettext('pin_tab'),
                onClick: function (_id) {
                  $.fn.pin_tab(_id, {
                    op: 'append',
                    repr: 'pin',
                    done_callback: function () {
                      $(interpolate($tab_list_template_str, [_id])).find('span').before($(_tab.config.pin_html));
                      var related_menu_item = $(interpolate($related_menu_item_str, [_id]));
                      related_menu_item.find('span').before($(_tab.config.pin_html));
                      related_menu_item.addClass('pined-tab-item');
                    }
                  });
                }
              }, {
                name: gettext('reopen_last_close_tab'),
                onClick: function (/*_id*/) {
                  var id_of_stored_tabs = tab_close_history[_module];
                  if (id_of_stored_tabs === undefined || id_of_stored_tabs.length === 0) {
                    // alert user: there is nothing in close history
                    error_prompt(gettext('There is nothing in close history'), 'auto');
                  } else {
                    var lay_id = id_of_stored_tabs.pop();
                    click_tab_related_menu_item(lay_id);
                    tab_close_history[_module] = id_of_stored_tabs;
                  }
                }
              }, {
                name: '----------------------------',
                onClick: function () {
                }
              }, {
                name: gettext('close_current_tab'),
                onClick: function (_id) {
                  if (check_tab_status(true)) {
                    _tab.tabDelete(_id, record_delete_option);
                  }
                  check_tab_status(false);
                }
              }, {
                name: gettext('close_left_tab'),
                onClick: function (_id) {
                  var all_li = $($all_tab_li_str);
                  for (var _n in all_li) {
                    if (all_li.hasOwnProperty(_n) && /\d+/.test(_n)) {
                      var elem = $(all_li[_n]),
                        lay_id = elem.attr('lay-id');
                      if (lay_id === _id) {
                        break;
                      }
                      _tab.tabDelete(lay_id, record_delete_option);
                    }
                  }
                  check_tab_status(false);
                }
              }, {
                name: gettext('close_right_tab'),
                onClick: function (_id) {

                  var all_li = $($all_tab_li_str),
                    _len = all_li.length;
                  for (var _i = _len - 1; _i >= 0; _i--) {
                    var elem = $(all_li[_i]),
                      lay_id = elem.attr('lay-id');
                    if (lay_id === _id) {
                      break;
                    }
                    _tab.tabDelete(lay_id, record_delete_option);
                  }
                  check_tab_status(false);
                }
              }, {
                name: gettext('close_all_tab_but_this'),
                onClick: function () {
                  var _siblings = context_menu.$openTarget.siblings();
                  $.each(_siblings, function (idx, elem) {
                    var lay_id = $(elem).attr('lay-id');
                    _tab.tabDelete(lay_id, record_delete_option);
                  });
                  check_tab_status(false);
                }
              }]
          });
        }, error: function () {
          is_last_tab_loaded = true;
          // last_click_time = new Date().getTime();
          last_click_menu_item = _id;
          last_click_module_item = _module;
          //console.warn('# Error: Append tab: ', arguments);
        }
      });
    } else {
      _tab.tabChange(_id);
      adjust_if_need_resize({
        'lay_id': _id
      });
      setTimeout(function () {
        width_mutation_if_need_callback_wrapper(_id);
      }, CONST_ADJUST_DELAY);
      // jump to page 1 if current page is not equal '1'
      $.fn.reload_layui_data_grid({
        to_first: true,
        hex_code: _id
      });
      last_click_menu_item = _id;
    }
    // console.timeEnd();
    callback.call(this);
  };
  ZKTab.prototype.remove_close_button_of_first_tab_accordingly = function () {
    var first_tab_close_btn = $($tab_ul_str + " li:first i.layui-tab-close"),
      _all_tab = $($all_tab_li_str);

    if (_all_tab.length === 1) {
      first_tab_close_btn && first_tab_close_btn.hide();
    } else if (_all_tab.length > 1) {
      first_tab_close_btn && first_tab_close_btn.show();
    }
  };

  ZKTab.prototype.tabChange = function (tab_id) {
    // var _tab = this;
    this.remove_close_button_of_first_tab_accordingly();
    element.tabChange(this.config.tab_filter, tab_id);
  };

  ZKTab.prototype.tabDelete = function (tab_id, options) {
    var record = null, module = null, callback = null, is_last_tab = false,
      $tab_title_str = '.layui-tab-title > li',
      tab_title = $($tab_title_str),
      len_tabs = tab_title.length;
    if ($(tab_title[len_tabs - 1]).attr('lay-id') === tab_id) {
      is_last_tab = true;
    }

    if (options) {
      record = options.record;
      module = options.module;
      callback = options.callback;
    }
    if (!callback) {
      callback = function () {
        if ($('.layui-tab-title').hasClass('layui-tab-more') && is_last_tab) {
          var all_tab_item = $('.layui-tab-content div.layui-tab-item'),
            len_tab_item = all_tab_item.length;
          all_tab_item.eq(len_tab_item - 1).addClass('layui-show');
          $($tab_title_str).eq(len_tab_item - 1).addClass('layui-this');
        }
      };
    }

    if (!record && typeof record !== 'boolean') {
      record = true;
    }

    var used_layer_ids = $(interpolate($tab_list_template_str, [tab_id])).data($.fn.zTreeSelect.const['CONST_KEY_USED_LAYER_IDS']);
    if (used_layer_ids && type(used_layer_ids) === 'array' && used_layer_ids.length) {
      used_layer_ids.forEach(function (_lay_id) {
        layer.close(_lay_id);
      });
    }

    if (record) {
      if (!module) {
        // get module immediately
        module = get_module_name();
      }

      // add closed tab id to tab_close_history
      var previous_result = tab_close_history[module];
      if (previous_result === undefined) {
        previous_result = [];
      } else {
        do {
          var loc = previous_result.indexOf(tab_id);
          if (loc !== -1) {
            previous_result.splice(loc, 1);
          }
        } while (loc !== -1);
      }
      previous_result.push(tab_id);
      tab_close_history[module] = previous_result;
    }
    element.tabDelete(this.config.tab_filter, tab_id);
    callback.call(this);
    this.remove_close_button_of_first_tab_accordingly();
    if (record) {
      var last_session_raw = window['get_local_storage']($.fn.adminSite.const.LAST_SESSION);
      if (last_session_raw) {
        var last_session_obj = JSON.parse(last_session_raw || '{}'),
          tabs = last_session_obj.tabs || [];
        if (tabs.includes(tab_id)) {
          tabs.splice(tabs.indexOf(tab_id, 1));
        }
        window['set_local_storage']($.fn.adminSite.const.LAST_SESSION, JSON.stringify({
          module: module,
          tabs: tabs
        }));
      }
    }
  };
  ZKTab.prototype.render = function (opts) {
    var _tab = this; // only in he entrance, _tab equal to ZKTable instance
    $.extend(true, _tab.config, opts);
    //Tab render
    _tab.bindTab();
    //Add Tab
    element.on('nav(' + _tab.config.side_menu_filter + ')', function (elem) {
      var parent_elem = elem.parent(),
        module_name = get_module_name(),
        tab_head = $(_tab.config.tab_head);
      if (parent_elem.is('.layui-nav-item.side-menu-group')) {
        if (parent_elem.closest('.layui-side-collapsed').length) {
          parent_elem.removeClass('layui-nav-itemed');
        }
        //not close other teb when we click one tab, so that comment this code.
        // parent_elem.siblings(interpolate('.layui-nav-itemed[app=%s]', [module_name])).removeClass('layui-nav-itemed');
      }
      if (tab_head.hasClass('layui-hide')) {
        tab_head.removeClass("layui-hide");
      }
      _tab.append(elem);
    });
    // monitor tab click event
    element.on('tab(' + _tab.config.tab_filter + ')', function (data) {
      //   // data.index: relative index; data.elem: parent HTML dom
      update_table_container_preferences_if_any();
      $.fn.reveal_search_form_if_hidden();

      adjust_if_need_resize({
        'lay_index': data.index
      });
      setTimeout(width_mutation_if_need_callback_wrapper, CONST_ADJUST_DELAY);
      //   $.fn.trigger_action_auto($.fn.get_model_name_from_hex($(this).attr('lay-id')), 'fit');
    });
  };
  ZKTab.prototype.menuSelected = function (tabItem) {
    // console.log(tabItem)
  };
  ZKTab.prototype.bindTab = function () {
    var _tab = this;
    element.on('tab(' + _tab.config.tab_filter + ')', function () {
      var tabItem = $(this).attr('lay-id');
      //selected item css
      _tab.menuSelected(tabItem);
    });
  };
  var zkTab = new ZKTab();
  exports('zkTab', zkTab);
});
