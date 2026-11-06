/**
 * Refactor by Boyce at 2019/01/24
 */
layui.define(['element'], function (exports) {
  var MOUSE_MOTION_DELAY = 100
    , THIS = 'layui-this'
    , CONST_ORIGINAL_HEIGHT = 'original_height'
    , NAV_ELEM = '.layui-nav', NAV_ITEM = 'layui-nav-item'
    , NAV_TREE = 'layui-nav-tree', NAV_CHILD = 'layui-nav-child'
    , NAV_ANIM = 'layui-anim layui-anim-upbit'
    , element = layui.element
    , tab_header = 'zk-layui-tab'
    , $tab_header = '#' + tab_header
    , main_body_id = 'main_body'
    // , $main_body_id = '#' + main_body_id
    , $side_menu = '#side_menu'
    , $side_menu_nav = '#side_menu_nav'
    , $side_menu_switcher = $side_menu + ' .zk-switch-menu'
    , $side_menu_group = 'li.layui-nav-item.side-menu-group'
    ,
    ZKMenu = function () {
      this.config = {
        data: [],
        pin_html: $.fn.adminSite.defaults.pined_tab
      };
    };

  ZKMenu.prototype.render = function (opts) {
    var _menu = this;
    $.extend(true, _menu.config, opts);
    console.log(opts);
    _menu.showMenu();
  };
  // ZKMenu.prototype.loadMenu = function () {
  // };

  // noinspection JSUnusedGlobalSymbols
  ZKMenu.prototype.tag_a_click = function (e) {
    var is_collapsed = $(this).closest('.layui-side-collapsed').length > 0;
    if (is_collapsed) {
      e.stopPropagation();
      return false;
    }
      if (is_collapsed) {
      $('.layui-tab').css('position','absolute','margin-left','0px');
      return true;
    }
    var othis = $(this)
      , parents = othis.parents(NAV_ELEM)
      , parent = othis.parent()
      , child = othis.siblings('.' + NAV_CHILD)
      , unselect = typeof parent.attr('lay-unselect') === 'string';

    if (!(othis.attr('href') !== 'javascript:;' && othis.attr('target') === '_blank') && !unselect) {
      if (!child[0]) {
        parents.find('.' + THIS).removeClass(THIS);
        parent.addClass(THIS);
      }
    }

    // is vertical menu?
    if (parents.hasClass(NAV_TREE)) {
      child.removeClass(NAV_ANIM);

      // if there is subordinated menu, then expand
      if (child[0]) {
        parent[child.css('display') === 'none' ? 'addClass' : 'removeClass'](NAV_ITEM + 'ed');
        if (parents.attr('lay-shrink') === 'all') {
          parent.siblings().removeClass(NAV_ITEM + 'ed');
        }
      }
    }
    e.stopPropagation();
    return false;
  };

  ZKMenu.prototype.showMenuSwitcher = function () {
    var container = $($side_menu_switcher),
      html_str_list = [],
      tpl = '<i class="fa fa-fw %(cls)s"></i>',
      config = [
        {'cls': 'fa-times-circle layui-hide'},
        {'cls': 'fa-tags'},
        {'cls': 'fa-search'},
        {'cls': 'fa-outdent'}
      ];

    config.forEach(function (conf) {
      html_str_list.push(interpolate(tpl, conf, ''));
    });
    container.append(html_str_list.join(''));
  };

  ZKMenu.prototype.showMenu = function () {
    var _menu = this;
    var data = _menu.config.data;

    this.showMenuSwitcher();

    $.each(data, function (i, v) {
      // App Menu
      var _app_name = v['app'],
        app = $(interject(
          '<li class="layui-nav-item"><div class="menu_module"><a href="javascript:void(0);" app="{app_name}">{app_label}</a></div></li>', {
            'app_name': v['app'],
            'app_label': v['label']
          }));

      $("#top_module_menu_nav").append(app);
      // App Group
      if (v['groups'] && v['groups'].length > 0) {
        $.each(v['groups'], function (i, g) {
          // console.warn('#group:', g);
          let hidden = "";
          if (g["isReport"] === "true") {
            hidden = "layui-hide";
          }
          var group = interject(
            '<li class="layui-nav-item side-menu-group {report_hidden}" app="{app_name}" title="{group_label}"><a href="javascript:void(0);"><i class="menu-icon fa fa-fw {menu_icon}"></i><span>{group_label}</span></a>', {
              'report_hidden': hidden,
              'app_name': _app_name,
              'group_label': g['label'],
              //'group_label': titleCase(g['label'], '_'),
              'menu_icon': g['icon'].length ? g['icon'] : 'fa-th-list'
            });

          // Menu Items
          if (g['menus'] && g['menus'].length > 0) {
            group += '<dl class="layui-nav-child">';
            $.each(g['menus'], function (i, m) {
              var is_pin = m['pin'];
              group += interject('<dd class=""><a href="javascript:void(0);" hex="{m_hex}" link="{m_url}" title="{m_label}" class="{pin}"><i class="layui-icon">{m_pin}</i><span>{m_label}</span></a></dd>', {
                'm_hex': m['hex'],
                'm_url': m['url'],
                'pin': is_pin ? ' pined-tab-item' : '',
                'm_pin': is_pin ? _menu.config.pin_html : '',
                'm_label': m['label'] //titleCase(m['label'], '_')
              });

            });
            group += '</d1>';
          }
          group += '</li>';
          $("#side_menu_nav").append(group);
        });
      }
    });
    element.render("nav");

    function side_menu_hover_handler_wrapper() {
      var MENU_SWITCH_DELAY = 300, _DELAY = 500, last_menu_item = null, last_menu_item_text = "",
        _hide_menu_timer_id = null, _switch_menu_timer_id = null,
        popup_menu_id = generate_uuid_v4_crypt(), $popup_menu_id = '#' + popup_menu_id,
        force_each_menu_must_wait = false,
        div_elem = $.fn.make_dom_element("div", {
          "id": popup_menu_id,
          "class": "layui-hide popup-menu"
          // "innerHTML": '<ul class="side-menu side-menu-sub side-menu-vertical" role="menu"></ul>'
        }),
        ul_elem = $.fn.make_dom_element('ul', {
          "role": 'menu',
          "class": 'side-menu side-menu-sub side-menu-vertical'
        });

      div_elem.appendChild(ul_elem);
      document.getElementById(main_body_id).parentNode.insertBefore(div_elem, null);

      $($popup_menu_id)
        .on('mouseover', _.debounce(function () {
          side_menu_hover_handler.call(this);
        }, MOUSE_MOTION_DELAY))
        .on('mouseleave', _.debounce(function () {
          side_menu_hover_handler.call(this, true);
        }, MOUSE_MOTION_DELAY))
        .on('click', '.side-menu-item', function (e) {
          var elem = $(this),
            tag_a = elem, tag_li = elem, hex_id;

          if (!elem.is('li')) {
            tag_li = elem.closest('li');
          }
          if (tag_li.is('.disabled-item')) {
            e.stopPropagation();
            return false;
          }

          tag_li.siblings('li').removeClass('layui-this');
          tag_li.addClass('layui-this');

          if (!elem.is('a')) {
            tag_a = elem.find('a');
          }
          hex_id = tag_a.attr('hex');
          $('dl > dd > a[hex=' + hex_id + ']', $side_menu_nav).trigger('click');
        });

      function adjust_if_exceed_screen_bottom(popup_menu, pointed_elem) {
        var popup_menu_rect = popup_menu.find('>ul').get(0).getBoundingClientRect(),
          // popup_menu_height = popup_menu_rect.height,
          popup_menu_bottom = popup_menu_rect.bottom,
          // screen_top = $($main_body_id).get(0).getBoundingClientRect().top,
          screen_bottom = document.getElementsByTagName('body')[0].getBoundingClientRect().bottom,
          list_item = pointed_elem.closest('li'),
          popup_menu_ul = popup_menu.find('>ul'),
          popup_menu_height = popup_menu_ul.height(),
          popup_menu_width = popup_menu_ul.width();

        //: equivalent height of popup-menu
        // list_item.data(CONST_ORIGINAL_HEIGHT, list_item.height());
        // if (popup_menu_height > 0) {
        //   $('li.layui-nav-item.side-menu-group').css({'height': ''});
        //   list_item.css({
        //     'height': popup_menu_height
        //   });
        // }

        if (is_rtl_layout() && popup_menu_width > 0) {
          popup_menu.css({
            'right': popup_menu_width + $($side_menu).width()
          });
        }

        if (popup_menu_bottom > screen_bottom) {
          var vertical_menu = popup_menu.children('.side-menu-vertical');

          vertical_menu.css({
            'max-height': screen_bottom - popup_menu_rect.top
          });

          // var new_top = screen_bottom - popup_menu_height
          //: adjust the css property of popup-menu
          // if (new_top < screen_top) {
          //   new_top = screen_top;
          // }
          // popup_menu.css({
          //   top: new_top
          // });
        }
      }

      return function (hide) {
        var elem = $(this),
          popup_menu = $($popup_menu_id),
          side_menu = $($side_menu),
          hide_callback = function (reset_last_menu_item) {
            if (reset_last_menu_item === undefined || type(reset_last_menu_item) !== 'boolean') {
              reset_last_menu_item = false;
            }
            if (!_hide_menu_timer_id) {
              _hide_menu_timer_id = setTimeout(function () {
                popup_menu.addClass('layui-hide');
                $('li.layui-nav-item.side-menu-group').css({'height': 'auto'});
              }, _DELAY);
            }
            if (reset_last_menu_item) {
              last_menu_item_text = "";
            }
          }, clear_hide_request_callback = function () {
            if (_hide_menu_timer_id) {
              clearTimeout(_hide_menu_timer_id);
              _hide_menu_timer_id = null;
            }
            if (_switch_menu_timer_id) {
              clearTimeout(_switch_menu_timer_id);
              _switch_menu_timer_id = null;
            }
          };

        if (hide === undefined || type(hide) !== 'boolean') {
          hide = false;
        }

        switch (true) {
          case elem.is('.layui-nav-item'):
            var is_collapsed = elem.closest('.layui-side-collapsed').length > 0,
              all_child_item = elem.find('> dl > dd > a'),
              tag_a_tpl = '<a href="javascript:void(0);">%(m_icon)s<span>%(m_content)s</span></a>',
              list_tpl = '<li class="presentation side-menu-item%(m_tag)s">%(m_content)s</li>',
              elem_rect = elem.closest('li').get(0).getBoundingClientRect(),
              is_align_right = is_rtl_layout(),
              original_title = elem.attr("title");

            if (hide) {
              hide_callback.call(this);
            } else {
              if (last_menu_item !== null && last_menu_item.length && last_menu_item.data(CONST_ORIGINAL_HEIGHT) !== undefined) {
                last_menu_item.css({
                  'height': ''
                });
              }

              last_menu_item = elem.closest('li');
              if (is_collapsed) {
                elem.removeAttr('title').data('title', original_title);
                clear_hide_request_callback.call(this);
                var menu_list = $('ul', popup_menu),
                  first_item = menu_list.first(), tag_a, menu_group_text;
                menu_list.find('>li').remove();

                tag_a = elem.children('a');
                menu_group_text = tag_a.text();
                if (force_each_menu_must_wait && last_menu_item_text !== menu_group_text) {
                  popup_menu.addClass('layui-hide'); // force each menu must wait
                  $('li.layui-nav-item.side-menu-group').css({'height': 'auto'});
                }
                last_menu_item_text = menu_group_text;
                // append a pseudo title
                first_item.append(interpolate(list_tpl, {
                  'm_tag': ' disabled-item',
                  'm_content': interpolate(tag_a_tpl, {
                    m_icon: tag_a.children('i').get(0).outerHTML || '',
                    m_content: menu_group_text
                  })
                }));
                // extract useful info from original (expanded) side menu
                $.each(all_child_item, function (index, effective_item) {
                  var dd_elem = $(effective_item).closest('dd'),
                    m_tag = '';
                  if (dd_elem.hasClass('layui-this')) {
                    m_tag = ' layui-this'; // prefix blank is necessary
                  }
                  first_item.append(interpolate(list_tpl, {
                    'm_tag': m_tag,
                    'm_content': effective_item.outerHTML
                  }));
                });

                elem_rect = elem.closest('li').get(0).getBoundingClientRect();
                popup_menu.css(_.defaultsDeep({
                    zIndex: 10000,
                    top: elem_rect.top
                  },
                  (function () {
                    return (
                      !is_align_right
                      ? {
                          left: elem_rect.left + parseFloat(elem.css('marginLeft')) + side_menu.width()
                        }
                      : {
                          right: parseFloat(elem.css('marginRight')) + side_menu.width()
                        }
                    );
                  })()
                ));
                adjust_if_exceed_screen_bottom(popup_menu, elem);
                _switch_menu_timer_id = setTimeout(function () {
                  popup_menu.removeClass('layui-hide');
                  adjust_if_exceed_screen_bottom(popup_menu, elem);
                  popup_menu.addClass('layui-hide');
                  popup_menu.css({
                    display: 'block',
                    width: 'auto',
                    opacity: 1
                  });
                  popup_menu.removeClass('layui-hide');
                }, MENU_SWITCH_DELAY);
              } else {
                original_title = elem.data('title');
                if (original_title) {
                  elem.attr('title', original_title).data('title', undefined);
                }
              }
            }
            break;
          case elem.closest($popup_menu_id).length > 0:
            if (!hide) {
              clear_hide_request_callback.call(this);
            } else {
              hide_callback.call(this, true);
            }
            break;
          default:
            break;
        }
      };
    }

    var side_menu_hover_handler = side_menu_hover_handler_wrapper();

    $($side_menu_nav)
      .on('mouseover', '>' + $side_menu_group, _.debounce(function () {
        side_menu_hover_handler.call(this);
      }, MOUSE_MOTION_DELAY))
      .on('mouseleave', '>' + $side_menu_group, _.debounce(function () {
        side_menu_hover_handler.call(this, true);
      }, MOUSE_MOTION_DELAY));
  };

  function reset_side_menu_search() {
    var cur_app = $('.menu_module.layui-this > a', '#top_module_menu_nav').attr('app'),
      side_menu_nav = $('#side_menu_nav'),
      app_own_item = side_menu_nav.find('.layui-nav-item.side-menu-group[app=' + cur_app + ']'),
      dd_item = app_own_item.find('dd'),
      selected_dd_item = app_own_item.find('dd.layui-this');
    dd_item.removeClass('layui-hide');
    app_own_item.removeClass('layui-hide').removeClass('layui-nav-itemed');
    selected_dd_item.closest('.layui-nav-item.side-menu-group').addClass('layui-nav-itemed');
  }

  var menu_control_button_tips = general_hover_tips_generator();


  $(".zk-switch-menu", '#side_menu').on('mouseover', 'i', function () {
    var that = $(this),
      tips_text = that.data('tips');
    switch (true) {
      case that.is('.fa-outdent'):
        tips_text = gettext('collapse_the_side_menu');
        break;
      case that.is('.fa-indent'):
        tips_text = gettext('expand_the_side_menu');
        break;
      case that.is('.fa-search'):
        tips_text = gettext('search_menu-item_by_name');
        break;
      case that.is('.fa-tags'):
        tips_text = gettext('search_menu-item_by_action');
        break;
      default:
        break;
    }
    menu_control_button_tips.apply(this, [tips_text, {
      tips: [3, '#4d4d4d']
    }]);
  }).on('mouseleave', 'i', function () {
    menu_control_button_tips.apply(this, [null, {
      hide: true
    }]);
  }).on("click", 'i.fa-outdent,i.fa-indent', function () {
    var that = $(this),
      model_name = $.fn.get_model_name_from_hex(),
      sub_menu = $($side_menu),
      tabs_to_resize = $('>ul>li:not(.layui-this)', $tab_header),
      direction = is_rtl_layout() ? 'right' : 'left',
      tabs_need_collapse, tabs_need_expand;
    // from expanded to collapsed version
    if (that.is("i.fa-outdent")) {
      that.removeClass("fa-outdent").addClass("fa-indent");
      sub_menu.addClass('layui-side-collapsed');/*.css('max-width','100px');*/
      $(".layui-layout-admin").addClass("zk-show-menu");
      $("li.layui-nav-itemed").removeClass('layui-nav-itemed');
      $(".layui-body").css(direction, '55px');
      $.fn.trigger_action_auto(model_name, 'fit');
      that.siblings('i').hide();

      if (tabs_to_resize.length) {
        tabs_need_expand = tabs_to_resize.filter('.need-expand');
        tabs_need_collapse = tabs_to_resize.not('.need-expand');
        tabs_need_expand.removeClass('need-expand');
        tabs_need_collapse.addClass('need-collapse');
      }
      // $('.layui-nav-item[app=' + module_name + '] > a', sub_menu).off('click');
    } else {  // from collapsed to expanded version
      that.removeClass("fa-indent").addClass("fa-outdent");
      $("#side_menu").removeClass('layui-side-collapsed');
      $('dd.layui-this').parents('li.layui-nav-item').addClass('layui-nav-itemed');
      $(".layui-layout-admin").removeClass("zk-show-menu");
      $(".layui-body").css(direction, '250px');
      $.fn.trigger_action_auto(model_name, 'fit');
      that.siblings('i').show();
      if (tabs_to_resize.length) {
        tabs_need_collapse = tabs_to_resize.filter('.need-collapse');
        tabs_need_expand = tabs_to_resize.not('.need-collapse');
        tabs_need_expand.addClass('need-expand');
        tabs_need_collapse.removeClass('need-collapse');
      }
      // $('.layui-nav-item[app=' + module_name + '] > a', sub_menu).on('click', menu_tag_a_click);
    }
  }).on('click', 'i.fa-search,i.fa-tags', function () {
    var that = $(this),
      category = '';
    if (that.is('.fa-search')) {
      category = 'menu';
    } else {
      category = 'action';
    }
    that.siblings('input').data('category', category).removeClass('layui-hide').css({
      position: 'relative'
    }).show().focus();
  }).on('propertychange keyup paste', 'input', function (e) { // input change
    var that = $(this),
      user_input_val = that.val().toLowerCase(),
      category = that.data('category'),
      cur_app = $('.menu_module.layui-this > a', '#top_module_menu_nav').attr('app'),
      app_own_sub_menu = $('#side_menu_nav').find('.layui-nav-item.side-menu-group[app=' + cur_app + ']'),
      available_sub_menu = app_own_sub_menu.find('dd > a'),
      visible_sub_menu = app_own_sub_menu.find('dd:not(.layui-hide) > a'),
      clear_input_button = that.siblings('i.fa-times-circle'),
      match_cnt = 0,
      is_only_one_located = false,
      blank_user_input = false;

    if (visible_sub_menu.length === 1 && e.key === 'Enter') {
      visible_sub_menu.first().trigger('click');
      that.trigger('blur'); // .val('')
      clear_input_button.addClass('layui-hide');
      // user_input_val.length = 0; // OBSOLETE: tricky way
      is_only_one_located = true;
      return true;
    }

    switch (category) {
      case 'menu':
        if (user_input_val.length) {
          if (available_sub_menu.length) {
            $.each(available_sub_menu, function (idx, elem) {
              var $elem = $(elem),
                value = $elem.children('span').text().toLowerCase(),
                menu_group = $elem.closest('.layui-nav-item.side-menu-group'),
                dd_item = $elem.parent();
              if (value.includes(user_input_val)) {
                if (!menu_group.hasClass('layui-nav-itemed')) {
                  menu_group.addClass('layui-nav-itemed');
                }
                if (dd_item.hasClass('layui-hide')) {
                  dd_item.removeClass('layui-hide');
                }
                match_cnt += 1;
              } else {
                dd_item.addClass('layui-hide');
              }
            });
          }
        } else {
          blank_user_input = true;
        }
        break;
      case 'action':
        user_input_val = user_input_val.replace(/\s*/g, '');
        if (user_input_val.length) {
          var request_user_id = window['get_session_storage']('request_user_id'),
            cached_actions_str = window['get_session_storage'](request_user_id + '_cached_actions'),
            cached_actions,
            error_msg = 'Please ensure `window.sessionStorage` is available for access.';
          if (cached_actions_str === null) {
            error_prompt(error_msg);
            return false;
          }
          try {
            cached_actions = JSON.parse(cached_actions_str);
          } catch (e) {
            error_prompt(error_msg);
            return false;
          }
          var app_own_actions = cached_actions[cur_app],
            model_names_to_highlight = [];

          if (app_own_actions) {
            $.each(app_own_actions, function (cur_model_name, actions) {
              if (!cur_model_name.endsWith('__repr')) {
                var cur_actions_repr = app_own_actions[cur_model_name + '__repr'];
                if (!cur_actions_repr) {
                  cur_actions_repr = actions.join('\0\0').replace(/\s*/g, '').toLowerCase();
                }
                if (cur_actions_repr && cur_actions_repr.includes(user_input_val)) {
                  model_names_to_highlight.push(cur_model_name);
                }
              }
            });
          }
          $.each(available_sub_menu, function (index, elem) {
            // var menu_model_name = elem.attr('link').replace(/.*\/([a-zA-Z]+)\/$/, '$1');
            var $elem = $(elem),
              menu_model_name = $elem.attr('link').replace(/(^\/\w+\/|\/$)/g, ''),
              menu_group = $elem.closest('.layui-nav-item.side-menu-group'),
              dd_item = $elem.parent();
            if (model_names_to_highlight.indexOf(menu_model_name) !== -1) {
              if (!menu_group.hasClass('layui-nav-itemed')) {
                menu_group.addClass('layui-nav-itemed');
              }
              if (dd_item.hasClass('layui-hide')) {
                dd_item.removeClass('layui-hide');
              }
              match_cnt += 1;
            } else {
              dd_item.addClass('layui-hide');
            }
          });
        } else {
          blank_user_input = true;
        }
        break;
      default:
        break;
    }
    if (blank_user_input) {
      setTimeout(function () {
        reset_side_menu_search.call(that[0]);
        clear_input_button.addClass('layui-hide');
      }, is_only_one_located ? 300 : 1);
    }
    return true;
  }).on('click dbclick', 'i.fa-times-circle', function (e) {
    var that = $(this),
      input_field = that.siblings('input');
    if (e.type === 'click') {
      input_field.val('');
      input_field.trigger('propertychange');
    } else {
      reset_side_menu_search.call(that[0]);
    }
  }).on('focus', 'input', function () {
    var that = $(this);
    that.siblings('i').addClass('deactivated').addClass('layui-hide');
    that.trigger('propertychange');
  }).on('blur', 'input', function () {
    var that = $(this),
      clear_input_button = that.siblings('i.fa-times-circle');
    // user_input = that.val(); // .replace(/\s*/g, '');
    if (that.val().length) {
      clear_input_button.removeClass('layui-hide');
    } else {
      clear_input_button.addClass('layui-hide');
    }
    that.addClass('layui-hide');
    that.siblings('i').removeClass('deactivated').removeClass('layui-hide');
    if (that.val().length === 0) {
      that.siblings('i.fa-times-circle').addClass('layui-hide');
    }
    // reset_side_menu_search.call(this);
  });

  var zkMenu = new ZKMenu();
  exports('zkMenu', zkMenu);
});
