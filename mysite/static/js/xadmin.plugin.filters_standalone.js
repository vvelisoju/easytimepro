/*
 * @Author: Boyce Gao
 * @Date: 2018-11-05 14:15:17
 * @Last Modified by: Boyce Gao
 * @Last Modified time: 2019-01-11
 */
//# sourceURL=filters_standalone.js
(function ($) {
  var CURSOR_MAX_TRACKED_COUNT = 3,  // maximum count of previous mouse locations to track
    DELAY_TIME_IN_MS = 300;  // ms delay when user appears to be entering submenu

  $.fn.popupMenuArch = function (opts) {
    // Initialize popup-menu-arch for all elements in jQuery collection
    this.each(function () {
      init_arch.call(this, opts);
    });
    return this;
  };

  function init_arch(opts) {
    var $dropdown_menu = $(this),
      current_focus = null,
      mouse_locs = [],
      last_delay_loc = null,
      timeout_id = null,
      arch_options = $.extend({
        listitem_selector: "> li",
        submenu_selector: "*",
        submenu_direction: "right",
        // default 75, larger = more forgiveness(less possible to trigger switch) when entering submenu
        tolerance: 75,
        // empty function by default
        enter: $.noop,
        exit: $.noop,
        focus: $.noop,
        blur: $.noop,
        exit_menu: $.noop
      }, opts);

    function mousemove_monitor(e) {
      mouse_locs.push({x: e.pageX, y: e.pageY});
      if (mouse_locs.length > CURSOR_MAX_TRACKED_COUNT) {
        mouse_locs.shift();
      }
    }

    /**
     * @define: Decider: shall we focus a submenu?
     * @description:
     * If `mouse movement detect algorithm` indicates that ww should not focus yet
     * (because user may be trying to enter submenu's content(along a curve line)),
     * then delay and check again later(by one-time timer: setTimeout).
     */
    function decide_focus(e) {
      var that = this,
        delay = focus_delay.apply(that, [e]);

      if (delay) {
        timeout_id = setTimeout(function () {
          decide_focus.apply(that, [e]);
        }, delay);
      } else {
        focus.apply(that, [e]);
      }
    }

    function focus(e) {
      var listitem = this;
      if (listitem === current_focus && $(listitem).is('.open')) {
        return;
      }
      if (current_focus) {
        arch_options.blur.apply(current_focus, [e]);
      }

      arch_options.focus.apply(listitem, [e]);
      current_focus = listitem;
    }

    /**
     * clear possible listitem focuses when leaving the menu entirely
     */
    function mouseleave_menu(e) {
      if (timeout_id) {
        clearTimeout(timeout_id);
      }

      // If exitMenu is supplied and returns true, blur the
      // currently focus listitem on menu exit.
      if (arch_options.exit_menu(this)) {
        if (current_focus) {
          arch_options.blur(current_focus);
        }
        current_focus = null;
      }
      e.stopPropagation();
    }

    function click_listitem(e) {
      // If user manual click, then trigger focus immediately
      // console.log('# user click explicitly');
      focus.apply(this, [e]);
      e.stopPropagation();
    }

    function mouseenter_listitem(e) {
      if (timeout_id) { // Cancel any previous focus delays
        clearTimeout(timeout_id);
      }

      arch_options.enter(this);
      decide_focus.apply(this, [e]);
    }

    function mouseleave_listitem(e) {
      arch_options.exit.apply(this, [e]);
    }

    function slope_rate(a, b) {
      return Math.abs((b.y - a.y) / (b.x - a.x));
    }

    /**
     * @desc
     * Return the amount of time that should be used as a delay before the
     * currently hovered listitem is focused.
     *
     * @return {int}
     * - 0:
     * Returns 0 if the focus should happen immediately.
     * - >0:
     *  Otherwise, returns the number of milliseconds that should be delayed before
     * checking again to see if the listitem should be focused.
     */
    var focus_delay = function (e) {
      // If there is no other submenu listitem already focus, then exit and focus immediately.
      if (!current_focus || !$(current_focus).is(arch_options.submenu_selector)) {
        return 0;
      }
      var submenu, currentTarget = $(e.currentTarget), popover;
      if (currentTarget.is('.open')) {
        submenu = currentTarget;
      } else {
        submenu = currentTarget.siblings('.open');
      }
      // If this is the first mouse-click event that user click `filter` button,
      // the `opened` submenu must equal zero, then go ahead and switch submenu promptly
      if (submenu.length === 0) {
        return 0;
      }
      // try to find the 'popover' layer in direct children nodes
      popover = submenu.children('.popover');
      // if failed, seek the next alternate
      if (popover.length === 0) {
        popover = submenu.children('.dropdown-menu');
      }
      var menu_offset = submenu.offset(),
        pop_offset = popover.offset(),
        upper_left = {
          x: menu_offset.left,
          y: Math.min(menu_offset.top, pop_offset.top) - arch_options.tolerance
        },
        upper_right = {
          x: menu_offset.left + submenu.outerWidth(),
          y: upper_left.y
        },
        lower_left = {
          x: menu_offset.left,
          y: Math.max(menu_offset.top + submenu.outerHeight(), pop_offset.top + popover.outerHeight()) + arch_options.tolerance
        },
        lower_right = {
          x: menu_offset.left + submenu.outerWidth(),
          y: lower_left.y
        },
        loc = mouse_locs[mouse_locs.length - 1],
        prev_loc = mouse_locs[0];

      if (!loc) {
        return 0;
      }

      if (!prev_loc) {
        prev_loc = loc;
      }

      if (prev_loc.x < menu_offset.left || prev_loc.x > lower_right.x ||
          prev_loc.y < menu_offset.top || prev_loc.y > lower_right.y) {
        // If the previous mouse location was outside of the entire
        // menu's bounds, immediately focus.
        return 0;
      }

      if (last_delay_loc && loc.x === last_delay_loc.x && loc.y === last_delay_loc.y) {
        // If the mouse hasn't moved since the last time we checked for focus status, immediately focus.
        return 0;
      }

      // default direction is `right`
      var decreasingCorner = upper_right,
        increasingCorner = lower_right;

      if (arch_options.submenu_direction === "left") {
        decreasingCorner = lower_left;
        increasingCorner = upper_left;
      } else if (arch_options.submenu_direction === "below") {
        decreasingCorner = lower_right;
        increasingCorner = lower_left;
      } else if (arch_options.submenu_direction === "above") {
        decreasingCorner = upper_left;
        increasingCorner = upper_right;
      }

      var decreasingSlope = slope_rate(loc, decreasingCorner),
        increasingSlope = slope_rate(loc, increasingCorner),
        prevDecreasingSlope = slope_rate(prev_loc, decreasingCorner),
        prevIncreasingSlope = slope_rate(prev_loc, increasingCorner);

      if (decreasingSlope > prevDecreasingSlope && increasingSlope > prevIncreasingSlope) {
        // Mouse is moving from previous location towards the currently focused submenu.
        // Delay before focusing a new menu listitem, because user may be moving into submenu.
        last_delay_loc = loc;
        return DELAY_TIME_IN_MS;
      }

      last_delay_loc = null;
      return 0;
    };

    /**
     * Monitor bootstrap dropdown menu related events
     * - mouseenter: required
     * - mouseleave: required
     * - click: optional
     */
    $dropdown_menu
      .mouseleave(mouseleave_menu)
      .find(arch_options.listitem_selector)
      .click(click_listitem)
      .mouseenter(mouseenter_listitem)
      .mouseleave(mouseleave_listitem);

    /**
     * Collect last `CURSOR_MAX_TRACKED_COUNT` mouse locations
     */
    $(document).mousemove(mousemove_monitor);
  }

  function FilterError(message) {
    this.name = "FilterError";
    this.message = message;
  }

  function FilterUpdate(message) {
    this.name = "FilterOverride";
    this.message = message;
  }


  FilterUpdate.prototype = new Error();
  FilterError.prototype = new Error();

  /**
   * entrance
   * @param options
   */
  $.fn.adminFilters = function (options) {
    var opts = $.extend({}, $.fn.adminFilters.defaults, options);
    // let the conditions of each tab isolated respectively
    opts.filter_map = {};
    var $filter_group_str = '#' + opts.model + '_filters_group.filters-group',
      $navbar_str = '#' + opts.model + '_navbar',
      $filter_menu_str = '#' + opts.model + '_filter_menu',
      $bookmark_menu_str = '#' + opts.model + '_bookmark_menu',
      $btn_clear_filter_str = 'div#' + opts.model + '_clear_filters',
      $btn_apply_filter_str = 'div#' + opts.model + '_apply_filters',
      $btn_bk_submit = '#' + opts.model + '_bk_submit';
      $ul_menu_str='div#'+opts.model+'_navbar ul.navbar-boot-nav'
    /**
     * get filter's code name from filter parameter
     * @param s
     * @returns {*}
     */
    function get_code_name(s) {
      var regex = opts.filter_code_name_pattern,
        m, result = null;

      while ((m = regex.exec(s)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }
        // The result can be accessed through the `m`-variable.
        result = m[1];
        // m.forEach(function (match, groupIndex) {
        //   console.log('Found match, group ' + groupIndex + ' '+ match);
        // });
      }
      return result;
    }

    function get_filter_option() {
      return {
        model: opts.model,
        table: opts.table,
        table_id: opts.curTable.config.id,
        where: opts.where
      };
    }

    function reset_object_properties(map) {
      for (var prop in map) {
        if (map.hasOwnProperty(prop)) {
          delete map[prop];
        }
      }
    }

    function reset_filters() {
      reset_object_properties(opts.filter_map);
      $($filter_group_str).find('>a').remove();
      $('.navbar-btn.filters-apply, .navbar-btn.filters-clear', $navbar_str).addClass('layui-hide');
      $($.fn.adminFilters.defaults.$input_multi_switch, $filter_menu_str).val(0);
      $('#' + opts.model + '_drop_filter').find('span.badge').remove();
      var newwhere = $.extend({}, opts.curTable.config.where,data_grid_opts[opts.curTable.config.id]&&data_grid_opts[opts.curTable.config.id].init_where);
      opts.table.reload(opts.curTable.config.id, {where: newwhere});
      // $.fn.reload_layui_data_grid({to_first: true,});
    }

    function update_active(that) {
      that.closest('.dropdown-menu').find('li.active').removeClass('active');
      that.closest('li').addClass('active');
    }


    var $popup_menu = $($filter_menu_str);

    // jQuery-menu-arch: <meaningful part of the example>
    // Hook up events to be fired on menu list-item focus
    $popup_menu.popupMenuArch({
      focus: focusSubmenu,
      // blur: blurSubmenu,
      exit: exitSubmenu,
      listitem_selector: "li.dropdown-submenu"
    });

    function exitSubmenu(e) {
      var target = $(e.target),
        currentTarget = $(e.currentTarget);

      if (!target.is('input') && (currentTarget.is('.menu-choice-date.open') || currentTarget.is('.menu-date-range.open'))) {
        currentTarget.removeClass('open');
      }
    }

    function focusSubmenu(e) {
      // console.log('this', $(this));
      var that = $(this),
        submenu = $(e.target).closest('.dropdown-submenu');

      if (!(submenu.is('.menu-choice-date') || submenu.is('.menu-date-range'))) {
        that.parent().find('li.dropdown-submenu.open').removeClass('open');
      } else {
        submenu.siblings('li.dropdown-submenu.open').removeClass('open');
      }
      // console.log($(this).parent().find('>.dropdown-submenu.open'));
      // console.log($(this).parent().find('.dropdown-submenu.open'));
      that.addClass('open');
      e.stopPropagation();
    }

    //dropdown submenu plugin
    // $(document)
    //   .on('click.dropdown touchstart.dropdown', '.dropdown-submenu', function (e) {
    //     e.stopPropagation();
    //   })
    //   .on('click.xa.dropdown.data-api', function (/*e*/) {
    //     $('.dropdown-submenu.open').removeClass('open');
    //   });

    // simple event handler for New Bookmark
    if ('ontouchstart' in document.documentElement) {
      $('.dropdown-submenu a', $bookmark_menu_str).on('click.xa.dropdown.data-api', function (/*e*/) {
        $(this).parent().toggleClass('open');
      });
    } else {
      var $sub_menu = $('.dropdown-submenu', $bookmark_menu_str);
      $sub_menu.on('click.dropdown mouseover.dropdown', function (e) {
        $(this).parent().find('li.dropdown-submenu.open').removeClass('open');
        $(this).addClass('open');
        e.stopPropagation();
      });
    }

    //toggle class button
    $('body').on('click.xa.togglebtn.data-api', '[data-toggle=class]', function (e) {
      var $this = $(this), href;
      var target = $this.attr('data-target')
                   || e.preventDefault()
                   || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, ''); //strip for ie7
      var className = $this.attr('data-class-name');
      $(target).toggleClass(className);
    });


    //.nav-content bar nav-menu
    $('.navbar-xs .navbar-nav > li')
      .on('shown.bs.dropdown', function (/*e*/) {
        $(this).find('>.dropdown-menu').css('max-height', $(window).height() - 120);
        $(this).parent().find('>li').addClass('hidden-xs');
        $(this).removeClass('hidden-xs');
      })
      .on('hidden.bs.dropdown', function (/*e*/) {
        $(this).parent().find('>li').removeClass('hidden-xs');
      });

    $($filter_group_str).on('click', 'a>i.layui-close', function (/*e*/) {
      var original_param = decodeURIComponent($(this).parent().data("filter-params")),
        field_code_name = get_code_name(original_param),
        conditions = get_conditions(original_param, field_code_name);

      $.each(conditions, function (idx, item) {
        var _t = item.split('='),
          c_query = _t[0],
          existed = opts.filter_map[field_code_name];
        if (existed && existed[c_query]) {
          delete existed[c_query];
        }
      });
      $(this).parent().remove();  // .addClass('layui-hide');
      filter_button('minus', opts.model);
    });

    $($filter_group_str).on('click', 'a>i.fa-filter,a>i.fa-eraser', function (e) {
      var elem = $(e.target),
        filter_item = elem.closest('a.filters__item'),
        filter_data = filter_item.data('filter-params');
      if (elem.hasClass('fa-filter')) {
        filter_data = filter_data.replace(opts.filter_reverse_pattern, '$10$2');
        elem.removeClass('fa-filter').addClass('fa-eraser');
      } else {
        filter_data = filter_data.replace(opts.filter_reverse_pattern, '$11$2');
        elem.removeClass('fa-eraser').addClass('fa-filter');
      }
      filter_item.data('filter-params', filter_data);
    });

    // filter-option
    $('a.filter-option', $navbar_str).on('click.filter', function () {
      var that = $(this),
        context = {},
        callback = prepare_basic_filter_data(that, context);

      context['filter_repr'] = 'is';
      context['filter_params'] = that.data('ref');
      context['field_repr'] = that.text();

      if (add_new_filter_to_queue(context)) {
        update_active(that);
        callback();
      }
    });

    $('li.dropdown.bookmarks ul#' + opts.model + '_bookmark_menu', $navbar_str).on('click', 'a.filter-bk-link', function (event) {
      var target = $(event.target),
        filters_json = JSON.parse(b64DecodeUnicode(target.data('filters'))),
        messages = [],
        cnt = 1;
      $.each(filters_json, function (key, val) {
        var msg = restore_filters_from_bookmark({
          "filter_name": key,
          "filter_type": val[0],
          "filter_params": val[1],
          "field_repr": val[2]
        });
        if (msg) {
          messages.push(cnt + ': ' + msg);
          cnt += 1;
        }
      });
      messages.length > 0 && error_prompt(messages.join('\n'));
    });

    $('.filter-search-input', $filter_menu_str).on('keyup', function () {
      filter_input_search_handler.call(this);
    });


    /**
     *
     * @param param_type
     * @private
     */
    function _get_number_filter_op(param_type) {
      var op_symbol = null;
      switch (param_type) {
        case 'lt':
          op_symbol = '<';
          break;
        case 'lte':
          op_symbol = '≤';
          break;
        case 'gt':
          op_symbol = '>';
          break;
        case 'gte':
          op_symbol = '≥';
          break;
        case 'exact':
          op_symbol = '=';
          break;
        case 'ne':
          op_symbol = '!=';
          break;
        default:
          op_symbol = ' ';
      }
      return op_symbol;
    }

    /**
     * handler for form submit
     * @param e: event
     * @returns {boolean}
     */
    function form_submit_handler(e) {
      var context = {},
        that = $(this),
        $form = $(e.target),
        after_submit = null;

      var parent_submenu = that.parents(".dropdown-submenu").last();
      if (parent_submenu.hasClass('filter-date') || parent_submenu.hasClass('filter-time')) {
        var callback = prepare_basic_filter_data(that, context),
          formInput = that.closest('form').find('input'),
          date_str = [];
          formData = {};
        $.each(formInput, function (idx, elem) {
          var pattern = new RegExp('[<>]|[\uD83C-\uDBFF\uDC00-\uDFFF]');
          if (pattern.test(elem.value)) {
            layer.msg('Illegal representation of Date filter', {icon: 2});
            return false;
          } else {
            date_str.push(elem.value);
            formData[elem.name] = elem.value;
          }
        });

        context['field_repr'] = date_str.join(' ');
        context['filter_repr'] = parent_submenu.hasClass('filter-date') ? 'date' : 'time';
        context['filter_params'] =  $.param(formData);
        if (add_new_filter_to_queue(context)) {
          update_active(that);
          callback();
        }
      } else if (parent_submenu.hasClass('filter-number')) {
        var active_number_input = $form.find('input[type="number"][class~=active]');
        if (active_number_input.length === 0) {
          error_prompt(gettext('Please enter the number,then click on Apply button.'), '500px');
          return false;
        } else if (active_number_input.length > 1) {
          error_prompt(gettext('One number filter one time.'), 'auto');
          return false;
        }

        callback = prepare_basic_filter_data(active_number_input, context);

        var field_repr = active_number_input.val(),
          filter_params = active_number_input.attr('name'),
          _type = null;

        if (field_repr.length === 0) {
          error_prompt(gettext('Please input valid number'), 'auto');
          return false;
        }

        if (filter_params.indexOf('__') !== -1) {
          _type = filter_params.split('__')[1];
        } else {
          error_prompt(gettext('Illegal filter parameters.'), 'auto');
          return false;
        }

        context['field_repr'] = field_repr;
        context['filter_params'] = filter_params;
        context['filter_repr'] = _get_number_filter_op(_type);

        if (add_new_filter_to_queue(context)) {
          callback();
        }

        after_submit = function () {
          active_number_input.removeClass('active');
        };
      } else {
        $form.find('input[type="text"],input[type="number"]').each(function (/*e*/) {
          var elem = $(this),
            name = elem.prop('name'),
            prefix = name.replace(/_[^_]*$/, '');
          callback = prepare_basic_filter_data(elem, context);
          var pattern = new RegExp('[<>]|[\uD83C-\uDBFF\uDC00-\uDFFF]');
          if (!pattern.test(elem.val())) {
            var select_filter_type = $form.find('select[name=' + prefix + '_type] option:selected');
            if (select_filter_type) {
              var params = select_filter_type.val();
              context['filter_repr'] = select_filter_type.text();
              context['filter_params'] = params;
              if (params.endsWith('__in')) {
                var _tmp = [];
                elem.siblings('span.zk-type-helper-item').each(function () {
                    _tmp.push($.trim($(this).clone().children().remove().end().text()));
                });
                  val=elem.val()
                  if (val!=undefined&&val!='')
                    _tmp.push(val)

                context['field_repr'] = JSON.stringify(_tmp);

                after_submit = function () {
                  elem.siblings('span.zk-type-helper-item').remove();
                };
              } else {
                context['field_repr'] = elem.val();
              }
              if (add_new_filter_to_queue(context)) {
                callback();
              }
            } else {
              error_prompt('Illegal Filter Type');
            }
          } else {
            layer.msg('Illegal representation of filter', {icon: 2});
            return false;
          }
        });
      }

      $form.trigger("reset");

      if (after_submit !== null) { // typeof after_submit === 'function'
        after_submit.call(this);
      }
      e.stopPropagation();
      do_filter(get_filter_option());
      $('#' + opts.model + '_filter_menu').trigger('click');
      return false;
    }

    $('form', $filter_menu_str).submit(form_submit_handler);

    /**
     * handler for date range selector
     */
    $('.menu-date-range form', $filter_menu_str).each(function () {
      var el = $(this),
        start_date = el.find('.calendar.date-start').datepicker({format: 'yyyy-mm-dd', language: 'xadmin'}),
        end_date = el.find('.calendar.date-end').datepicker({format: 'yyyy-mm-dd', language: 'xadmin'}),
        dates = {'start': start_date, 'end': end_date};

      // ensure start_date <- end_date
      var checkAvailable = function () {
        if (start_date.data('datepicker').getDate().valueOf() <= end_date.data('datepicker').getDate().valueOf()) {
          el.find('button[type=submit]').removeAttr('disabled');
        } else {
          el.find('button[type=submit]').attr('disabled', 'disabled');
        }
      };

      var dual_direction_date = function (dates, $target_str) {
        var is_reverse = false;
        if ($target_str.indexOf('end') !== -1) {
          is_reverse = true;
        }

        var select_date = null;
        if (!is_reverse) {
          select_date = dates.start.data('date');
        } else {
          select_date = dates.end.data('date');
        }
        el.find($target_str).val(select_date);
        if (!is_reverse) {
          dates.end.data('datepicker').setStartDate(select_date);
        } else {
          dates.start.data('datepicker').setEndDate(select_date);
        }
        checkAvailable();
      };
      start_date.on('changeDate', function (/*ev*/) {
        dual_direction_date(dates, '.start_input');
        // var data_date = start_date.data('date');
        // el.find('.start_input').val(data_date);
        // end_date.data('datepicker').setStartDate(data_date);
        // checkAvailable();
      });
      end_date.on('changeDate', function (/*ev*/) {
        dual_direction_date(dates, '.end_input');
        // var data_date = end_date.data('date');
        // el.find('.end_input').val(data_date);
        // start_date.data('datepicker').setEndDate(data_date);
        // checkAvailable();
      });
    });

    /*
     * handle those multi-state switch
     */
    $(opts.$input_multi_switch, $filter_menu_str).multiSwitch({
      textChecked: 'Filter',
      textNotChecked: 'Exclude',
      functionOnChange: function ($elem) {
        // console.log('multi-switch-callback');
        var $switch = $elem.closest('div.multi-switch'),
          $target = $switch.next('i');
        if ($elem.val() === '1') {
          // $elem.closest('a').find('i').removeClass('fa-eraser').addClass('fa-filter');
          $target.removeClass('fa-eraser filter-deactivated').addClass('fa-filter filter-active');
          $switch.children('.switch-content').removeClass('deactivated initial').addClass('active');
        } else if ($elem.val() === '2') {
          $target.removeClass('fa-filter filter-active').addClass('fa-eraser filter-deactivated');
          $switch.children('.switch-content').removeClass('active initial').addClass('deactivated');
        } else if ($elem.val() === '0') {
          $target.removeClass('fa-eraser filter-active filter-deactivated').addClass('fa-filter');
          $switch.children('.switch-content').removeClass('active deactivated').addClass('initial');
        }
      }
    });

    // handler for clock picker
    if ($.fn.clockpicker) {
      var f = $('form.time-span');
      f && f.find('.input-group.bootstrap-clockpicker').each(function (/*e*/) {
        var elem = $(this).find('input');
        // noinspection SpellCheckingInspection
        elem.clockpicker({
          'autoclose': true,
          'default': 'now',
          'placement': 'right',
          'align': 'left',
          'donetext': 'Done'
        });

        $(this).find('button').click(function (/*e*/) {
          var now = new Date()
            , value = now.getHours() + ':' + now.getMinutes();
          elem.attr('value', value);
        });
        $(this).find('button').trigger('click');
      });
    }

    // filter
    $('.filter-multiselect input[type=checkbox]').on('click.filter', function (/*e*/) {
      console.log('clicked', $(this));
    });

    // number filter
    $('.filter-number .remove', $filter_menu_str).on('click', function (/*e*/) {
      $(this).parent().parent().find('input[type=number]').val('');
    });

    $('.dropdown-submenu.filter-number input[type=number]', $filter_menu_str).on('focus', function () {
      var that = $(this),
        radio_input = '.input-group-addon>input[type=radio]',
        number_input = 'input[type=number]',
        input_field = that.closest('.input-group').find(radio_input),
        all_peer_field = that.closest('form').find(number_input);
      input_field.prop('checked', true);
      all_peer_field.removeClass('active');
      that.addClass('active');
    }).on('keydown', function (e) {
      e = e || window.event;
      var that = $(this),
        key_code = e['keyCode'],
        shift_key = e['shiftKey'],
        alt_key = e['altKey'],
        ctrl_key = e['ctrlKey'],
        val = that.val(),
        new_val = val,
        unit = 0;

      if (val.length > 0) {
        var n = null;
        if (val.indexOf('.') !== -1) {
          n = parseFloat(val);
        } else {
          n = parseInt(val);
        }
        if (key_code === 38 || key_code === 40) { // up or down
          // noinspection IfStatementWithTooManyBranchesJS

          switch (true) {
            case ctrl_key:
              unit = 100;
              break;
            case alt_key:
              unit = 10;
              break;
            case shift_key:
              unit = 0.1;
              break;
            default:
              unit = 1;
              break;
          }
        }
        if (key_code === 40) { // down
          unit = -unit;
        } // down
        new_val = String(n + unit);
        if (val !== new_val) {
          that.val(new_val);
        }
      }
      return true;
    });


    $('.filter-number .toggle', $filter_menu_str).on('click', function (/*e*/) {
      var that = $(this),
        new_name = $(this).attr('data-on-name');
      if (that.hasClass('active')) {
        new_name = that.attr('data-off-name');
      }

      that.parent().parent().find('input[type="number"]').attr('name', new_name);
      that.toggleClass('active');
    });

    /**
     *
     * @param f_params
     * @param field_code_name
     * @returns {string[]}
     */
    function get_conditions(f_params, field_code_name) {
      var prefix_pattern = new RegExp("_p\\d?_" + field_code_name, "g");
      return decodeURIComponent(f_params.replace(prefix_pattern, '')).split('&');
    }


    function update_filter_in_group(opts, new_value) {
      var the_a_tag = $("a[data-filter-params*=" + opts['characteristic'] + ']', $filter_group_str),
        org_data_filter = decodeURIComponent(the_a_tag.data("filter-params")),
        org_data_field_repr = decodeURIComponent(the_a_tag.data('field-repr')),
        arr_field_repr = JSON.parse(org_data_field_repr),
        the_span_tag = the_a_tag.find('span'),
        span_text = the_span_tag.text(),
        colon_loc = span_text.indexOf(':'),
        prefix_loc = span_text.substring(colon_loc + 1).indexOf(new_value['filter_repr']),
        condition = org_data_filter.split('=')[0], // each condition include an equal sign
        need_insert = false, span_repr_prefix, _prefix, _condition; // span_repr_suffix,

      if (!$.isArray(arr_field_repr)) {
        arr_field_repr = [arr_field_repr];
      }

      if (prefix_loc === -1) {
        prefix_loc = colon_loc + 1;
        need_insert = true;
      } else {
        prefix_loc += colon_loc + 1 + new_value['filter_repr'].length;
      }

      span_repr_prefix = span_text.substring(0, prefix_loc);

      // span_repr_suffix = span_text.substring(prefix_loc);

      function _update_attribute(arr_repr, text_prefix, params) {
        the_span_tag.text(text_prefix + arr_repr.join(', '));
        the_a_tag.data('filter-params', params);
        the_a_tag.data('field-repr', encodeURIComponent(JSON.stringify(arr_repr)));
      }

      _prefix = span_repr_prefix + (need_insert ? new_value['filter_repr'] : '') + ' ';
      _condition = condition + encodeURIComponent('=' + new_value['filter_value']);
      switch (opts['op']) {
        case 'append':
          arr_field_repr.push(new_value['field_repr']);
          _update_attribute(arr_field_repr, _prefix, _condition);
          break;
        case 'override':
          arr_field_repr = [new_value['field_repr']];
          _update_attribute(arr_field_repr, _prefix, _condition);
          break;
        case 'remove':
          var remove_item_loc = arr_field_repr.indexOf(new_value['field_repr']);
          // remove item must in the array. this assumption assured in caller
          arr_field_repr.splice(remove_item_loc, 1);
          _update_attribute(arr_field_repr, _prefix, _condition);
          break;
        default:
          break;
      }
    }

    /**
     * @param f_params
     * @param filter_opts
     * @returns {boolean}
     */
    function record_into_map(f_params, filter_opts) {
      var temp_dict = {},
        field_code_name = get_code_name(f_params),
        conditions = get_conditions(f_params, field_code_name);

      if (filter_opts === undefined) {
        filter_opts = {};
      }

      $.each(conditions, function (idx, elem) {
        var _tuple = elem.split('='),
          c_query = _tuple[0],
          c_value = _tuple[1],
          lay_idx;

        temp_dict[c_query] = c_value;
        // check duplicate and conflict
        var existed = opts.filter_map[field_code_name];

        function handle_many_to_many_field(key, value) {
          var parsed_value = JSON.parse(value),
            value_array = $.isArray(parsed_value) ? parsed_value : [];
          if (value_array.length === 0) {
            value_array.push(value);
            value_array.push(c_value);
          } else {
            var loc = value_array.indexOf(c_value);
            if (value_array.length === 1) {
              if (loc !== -1) {
                throw new FilterError('Attention, Duplicated filter condition(' + filter_opts.field_name + ') is detected.');
              }
            } else {
              if (loc !== -1) {
                lay_idx = layer.confirm(gettext('Duplicated filter condition. Do you want to remove it?'), {
                  title: gettext('Confirm'), icon: 3, btn: [gettext('dialog_confirm_btn_yes'), gettext('dialog_confirm_btn_no')]
                }, function () {
                  value_array.splice(loc, 1);
                  var repr_of_value_array = JSON.stringify(value_array);
                  temp_dict[c_query] = repr_of_value_array;
                  update_filter_in_group({
                    characteristic: field_code_name + c_query,
                    op: 'remove'
                  }, {
                    field_repr: filter_opts.field_repr,
                    filter_repr: filter_opts.filter_repr,
                    filter_value: repr_of_value_array
                  });
                  opts.filter_map[field_code_name] = _.extend({}, opts.filter_map[field_code_name], temp_dict);
                  layer.close(lay_idx);
                });
                throw new FilterUpdate('Override in ' + field_code_name + ') is detected.');
              }
            }
            value_array.push(c_value);
          }
          lay_idx = layer.confirm(gettext('More than one option have been selected. How to continue?'), {
            title: gettext('Confirm'), icon: 3, btn: [gettext('Append'), gettext('Override')]
          }, function () {
            var repr_of_value_array = JSON.stringify(value_array);
            temp_dict[c_query] = repr_of_value_array;
            update_filter_in_group({
              characteristic: field_code_name + c_query,
              op: 'append'
            }, {
              field_repr: filter_opts.field_repr,
              filter_repr: filter_opts.filter_repr,
              filter_value: repr_of_value_array
            });
            opts.filter_map[field_code_name] = _.extend({}, opts.filter_map[field_code_name], temp_dict);
            layer.close(lay_idx);
          }, function () {
            var last_item_loc = value_array.length - 1,
              repr_of_value_array = JSON.stringify(value_array.splice(last_item_loc));
            temp_dict[c_query] = repr_of_value_array;
            update_filter_in_group({
              characteristic: field_code_name + c_query,
              op: 'override'
            }, {
              field_repr: filter_opts.field_repr,
              filter_repr: filter_opts.filter_repr,
              filter_value: repr_of_value_array
            });
            opts.filter_map[field_code_name] = _.extend({}, opts.filter_map[field_code_name], temp_dict);
            layer.close(lay_idx);
          });
          throw new FilterUpdate('Override in ' + field_code_name + ') is detected.');
        }

        if (existed !== undefined) {
          $.each(existed, function (key, value) {
            if (key === c_query) {
              if (value !== c_value) {
                if (c_query.endsWith('__in')) {
                  handle_many_to_many_field(key, value);
                } else {
                  throw new FilterError(gettext('conflict_filter_condition(') + filter_opts.field_name + gettext(') is_detected.'));
                }
              } else {
                throw new FilterError(gettext('duplicated_filter_condition(') + filter_opts.field_name +gettext( ') is_detected.'));
              }
            }
          });
        }
      });
      opts.filter_map[field_code_name] = _.extend({}, opts.filter_map[field_code_name], temp_dict);
    }

    /**
     * build a new filter from raw meat
     * @param f
     *  f.field_name
     *  f.field_repr
     *  f.filter_type
     *  f.filter_repr
     *  f.filter_params
     * @return {boolean}
     *  true: It will update active item
     *  false: It will not update
     */
    function add_new_filter_to_queue(f) {
      var segment_start = f.filter_params.indexOf('=');
      if (segment_start === -1) {
        f.filter_params = f.filter_params + '=' + encodeURIComponent(f.field_repr);
      } else {
        var params = [],
          original_params = f.filter_params;
        do {
          var segment_end = original_params.indexOf('&');
          if (segment_end !== -1) {
            params.push(original_params.substring(0, segment_start) + encodeURIComponent(original_params.substring(segment_start, segment_end)));
            original_params = original_params.substring(segment_end + 1);
          } else {
            params.push(original_params.substring(0, segment_start) + encodeURIComponent(original_params.substring(segment_start)));
            break;
          }
          segment_start = original_params.indexOf('=');
        } while (segment_start !== -1);
        f.filter_params = params.join('&');
      }

      var f_params = f.filter_params
                      .replace(opts.extra_trim_pattern, '')
                      .replace(opts.filter_prefix_pattern, '$1' + f.filter_type + '$2');

      try {
        record_into_map(f_params, f);
      } catch (e) {
        if (e instanceof FilterError) {
          error_prompt(e.message);
        } else if (e instanceof FilterUpdate) {
          return true;
        } else {
          console.trace(e);
        }
        return false;
      }

      try {
        var parsed_field_repr = parse_field_repr(f);
      } catch (e) {
        if (e instanceof FilterError) {
          error_prompt(e.message);
        } else {
          console.trace(e);
        }
        return false;
      }

      // interject `filter_repr` as an data attribute into DOM
      $($filter_group_str).append(interject($.fn.get_filter_template(), {
        'field_repr': encodeURIComponent(JSON.stringify(parsed_field_repr)),
        'filter_text': titleCase(f.field_name) + ' ' + f.filter_repr.toLowerCase() + ' <span class="filter-item">' + parsed_field_repr.join(', ')+' </span>',
        'filter_params': f_params,
        'filter_type': opts.filter_type_dict[f.filter_type]
      }, true));

      maintain_filter_status(opts.model);
      return true;
    }

    /**
     * Because we are restore json-represented filters from bookmark, So it is fully cooked, is not listitem meat
     * anymore.
     * @param f
     *  f.filter_name
     *  f.filter_type
     *  f.filter_params
     * @return {null,String}
     */
    function restore_filters_from_bookmark(f) {
      try {
        record_into_map(f.filter_params);
      } catch (e) {
        if (e instanceof FilterError) {
          return e.message;
        } else {
          console.warn(e);
          return null;
        }
      }

      $($filter_group_str).append(interject($.fn.get_filter_template(), {
        'filter_text': f.filter_name,
        'field_repr': f.field_repr,
        'filter_type': opts.filter_type_dict[f.filter_type],
        'filter_params': f.filter_params
      }, true));

      maintain_filter_status(opts.model);
      return null;
    }

    var bk_submit_handler = function () {
      $($btn_bk_submit, $bookmark_menu_str).on('click.bookmark', function () {
        var that = $(this),
          query_dict = {},
          form = that.closest('form'),
          all_enqueued_filters = $($filter_group_str).find('a.filters__item'),
          field_filters = form.find('input[name=filters]'),
          field_title_val = form.find('input[name=title]').val(),
          url = that.data('action');
          var pattern = new RegExp("[=<>]|[\uD83C-\uDBFF\uDC00-\uDFFF]");
          if (pattern.test(field_title_val)) {
            layer.msg('Illegal representation of bookmark name', {icon: 2});
            return false;
          }
        if (field_title_val.length === 0 || all_enqueued_filters.length === 0) {
          show_prompt(gettext('missing_valid_parameters') + ': ' + gettext('Please add some filter first, then input a sensible name'), {
            time: 0,
            closeBtn: 2,
          });
          return;
        }

        $.each(all_enqueued_filters, function (idx, elem) {
          var $elem = $(elem),
            f_type = $elem.find('>i.fa').hasClass('fa-filter') ? '1' : '0',
            f_text = $elem.find('>span').text(),
            f_params = $elem.data('filter-params'),
            f_repr = $elem.data('field-repr');
          // f_repr = $elem.get(0).dataset['fieldRepr']

          if (f_repr.indexOf('"') !== -1) {
            f_repr = encodeURIComponent(f_repr);
          }

          query_dict[f_text] = [f_type || '0', f_params, f_repr];
        });
        field_filters.val(JSON.stringify(query_dict));
        var form_data = formObjectify(form),
          request_func = function (_data) {
            recursive_func = arguments.callee;
            $.ajax({
              url: url,
              data: _data,
              type: "POST",
              dataType: 'json',
              success: function (resp) {
                console.log('save bookmark successful', resp);
                if (resp.code >= 0) {
                  var payload = resp.msg;
                  if (_data.op  && _data.op === 'override') {
                    show_prompt(gettext('override_successful'), {
                      icon: 1
                    });
                    $($bookmark_menu_str).find('a[title=' + _data.title + ']').closest('li').remove();
                  }
                  $($bookmark_menu_str + ' li > a.mute').closest('li').remove();
                  $($bookmark_menu_str).find(".divider.add-bookmark").before('<li><a href="javascript:void(0)" class="filter-bk-link" title="' + payload.title + '" data-filters=' + payload.filters + '><i class="fa fa-bookmark"></i> ' + payload.title + '</a></li>');
                } else {
                  switch (resp.code) {
                    case -1: // missing valid parameter
                      show_prompt(resp.msg, {time: 0});
                      break;
                    case -2: // duplicated bookmark name
                      layer.confirm(
                        resp.msg,
                        {
                          title: gettext('Confirm'), icon: 3, btn: [gettext('change_name'), gettext('Override')]
                        }, function (lay_index) {
                          layer.close(lay_index);
                        }, function (lay_index) {
                          request_func(_.extend({}, _data, {
                            'op': 'override'
                          }));
                          layer.close(lay_index);
                        });
                      break;
                    default:
                      break;
                  }
                }
              }, error: function () {
                // console.log('#error', arguments);
                layer.msg("Something Wrong", {icon: 2});
              }
            });
          };
        request_func(form_data);
      });
    };

    function append_text(title, inputHelper) {
      //var type_helper = $('.zk-type-helper', $filter_menu_str)[0];
      // var type-helper = document.querySelectorAll(".zk-type-helper")[0];
      //var input_helper = $(".zk-type-helper input.zk-type-helper-input", $filter_menu_str)[0];
      // var inputHelper = document.querySelectorAll(".zk-type-helper input.zk-type-helper-input")[0];
      var type_helper = $(inputHelper).parent().get(0);
      var input_helper = $(inputHelper).get(0);
      var new_title = $.fn.make_dom_element("span", {
        "class": "zk-type-helper-item",
        "innerText": title + " "
      });
      var titleRemove = new_title.appendChild($.fn.make_dom_element("span", {
        "class": "remove",
        "innerText": "×"
      }));
      titleRemove.addEventListener("click", function (event) {
        var title = event.currentTarget;
        title.parentNode.remove();
      }, false);
      type_helper.insertBefore(new_title, input_helper);
    }

    $('.input-group select[name^=_f_][name$=_type]', $filter_menu_str).on('change', function () {
      var that = $(this),
        p = 'placeholder',
        t = 'title',
        _name = that.attr('name').replace(/type/, 'str'),
        target = $('[name=' + _name + ']', $filter_menu_str),
        default_placeholder = gettext('Enter Keyword...'),
        tag_placeholder = gettext('Enter Option, use comma or semicolon to separate multiple option.');
        target.val('');

      if (that.val().endsWith('__in')) {
        target.addClass('enable-tag');
        target.prop(p, tag_placeholder).prop(t, tag_placeholder);
      } else {
        if (target.hasClass('enable-tag')) {
          target.removeClass('enable-tag');
        }
        target.prop(p, default_placeholder).prop(t, default_placeholder);
        $('.zk-type-helper span').remove()
      }
    }).trigger('change');

    $('.zk-type-helper', $filter_menu_str).on('input', 'input.zk-type-helper-input.enable-tag', function () {
      var value = this.value;
      // if (value[value.length - 1] === "," || value[value.length - 1] === ";") {
      //   append_text(value.substring(0, value.length - 1), this);
      //   this['value'] = "";
      // }
      var choices;
      if (value.includes(',')){
        choices = value.split(',');
      }
      if (value.includes(';')){
        choices = value.split(';');
      }

      if (choices !== undefined) {
        for (let i = 0; i < choices.length; i++) {
          if (choices[i] !== "") {
            append_text(choices[i], this);
            this['value'] = "";
          }
        }
      }
    });
    // var input = document.querySelectorAll(".zk-type-helper input.zk-type-helper-input")[0];

    setTimeout(bk_submit_handler, opts.delay_time);


    $($btn_clear_filter_str).on('click.filters', 'a', reset_filters);
    $($btn_apply_filter_str).on('click.filters', 'a', function () {
        do_filter(get_filter_option());
      }
    );

    // add filters auto-apply event
    // $('.layui-laypage-prev:not(.layui-disabled),.layui-laypage-curr,.layui-laypage-next:not(.layui-disabled),.layui-table-page
    // a[href="javascript:;"]', $fluid).on('click', function () $('.layui-table-page', $fluid).on('click', '
    // a[href="javascript:;"][data-page]:not(.layui-disabled)',function() monitor layui page click event
    // $('.layui-table-page', $fluid).on('click', function (e) { var $elem = $(e.target), can_apply =
    // _can_apply(opts.model);  if ($elem.prop('nodeName') === 'I') { $elem = $elem.closest('a[href=javascript:;]'); }
    // if (can_apply && $elem.attr('data-page') !== undefined && !$elem.hasClass('layui-disabled')) {
    // setTimeout(do_filter, 50, get_filter_option()); } });
  };

  function parse_field_repr(f) {
    var parsed_field_repr;
    if (typeof f.field_repr === 'string') {
      try {
        parsed_field_repr = JSON.parse(f.field_repr);
      } catch (e) {
      }
      if (!parsed_field_repr || !$.isArray(parsed_field_repr)) {
        parsed_field_repr = [f.field_repr];
      }
    } else {
      if ($.isArray(f.field_repr)) {
        parsed_field_repr = f.field_repr;
      } else {
        var msg = 'Warning, Illegal representation of filter';
        error_prompt(msg);
        console.warn(msg);
        throw new FilterError(msg);
      }
    }
    return parsed_field_repr;
  }

  $.fn.parse_field_repr = parse_field_repr;

  function _can_apply(model) {
    return !$('#' + model + '_apply_filters').hasClass('layui-hide');
  }

  /**
   *
   * @param that
   * @param f
   * @returns {Function}
   */
  function prepare_basic_filter_data(that, f) {
    var submenu = that.parents('.dropdown-submenu').last(),
      $checkbox = submenu.find($.fn.adminFilters.defaults.$input_multi_switch);

    f.field_name = $.trim(submenu.find('>a').text());
    f.filter_type = submenu.find('>a>i').hasClass('fa-filter') ? '1' : '0';
    // default: using filter
    return function () {
      if ($checkbox.val() === '0') {
        $checkbox.val('1');
      }
    };
  }

  $.fn.prepare_basic_filter_data = prepare_basic_filter_data;


  function filter_button(op, model) {
    var defaults = $.fn.adminFilters.defaults,
      $drop_filter = interject(defaults.$drop_filter_tmp, {model: model}),
      $filter_group_str = interject(defaults.$filter_group_str_tmp, {model: model}),
      $navbar_str = interject(defaults.$navbar_str_tmp, {model: model}),
      $btn_clear_filter_str = interject(defaults.$btn_clear_filter_str_tmp, {model: model});


    if (op === undefined) {
      op = 'plus';
    }
    var drop_filter = $($drop_filter),
      match = drop_filter.find('span.badge');
    if (op === 'plus') {
      if (match.length === 0) {
        var caret = drop_filter.find('span.caret');
        caret.before($(defaults.badge));
      } else {
        match.html(Number(match.text()) + 1);
      }
    } else {
      if (match.length !== 0) {
        var next = Number(match.text()) - 1;
        if (next === 0) {
          match.remove();
        } else {
          match.html(next);
        }
      }
    }

    var selector = '.navbar-btn.filters-{}{}';
    if ($('.filters__item', $filter_group_str).length > 0) {
      var $apply_f = $(interject(selector, ['apply', '.layui-hide']), $navbar_str),
        $clear_f = $(interject(selector, ['clear', '.layui-hide']), $navbar_str);
      $apply_f && $apply_f.removeClass('layui-hide');
      $clear_f && $clear_f.removeClass('layui-hide');
//salert($($ul_menu_str).width())
       $( $filter_group_str).width($('#zk-layui-tab').width()-$($ul_menu_str).width()-50)
    } else {
      // match.remove();
      // $(interject(selector, ['apply', '']), $navbar_str).addClass('layui-hide');
      // $(interject(selector, ['clear', '']), $navbar_str).addClass('layui-hide');
      // $.fn.reload_layui_data_grid({to_first: true,});
      $('a', $btn_clear_filter_str).trigger('click');
    }
  }

  function maintain_filter_status(model) {
    filter_button('plus', model);

    // $('.filters__item i.layui-close').on('click', function (e) {
    //   $(this).parent().remove();  // .addClass('layui-hide');
    //   filter_button();
    // });
  }

  $.fn.maintain_filter_status = maintain_filter_status;
  $.fn.filter_button = filter_button;

  $.fn.get_filter_template = function () {
    return $.fn.adminFilters.defaults["filter_template"];
  };

  function get_filter_params(model) {
    var filter_params = {};
    $(interject($.fn.adminFilters.defaults.$filter_group_str_tmp, {'model': model}))
      .find("a.filters__item")
      .each(function () {
        var $elem = $(this),
          original = decodeURIComponent($elem.data('filter-params')),
          trim_pattern = /^\?|^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
          all_params = original.replace(trim_pattern, '').split('&');
        $.each(all_params, function (idx, cur_elem) {
          var key_val = cur_elem.split('=');
          if (key_val && key_val.length >= 2) {
            var condition = key_val[0], query = cur_elem.replace(condition+'=','');
            if (condition.endsWith('in')) {
              var parsed_query = JSON.parse(JSON.stringify(query));
              if (!$.isArray(parsed_query)) {
                query = JSON.stringify([parsed_query]);
              }
            }
            filter_params[condition] = query;
          } else {
            console.error('filter parse error: ', cur_elem);
          }
        });
      });
    return filter_params;
  }

  function do_filter(out_opts) {
    var model = undefined, table = undefined, table_id = undefined, preset_where = undefined;

    if (out_opts !== undefined) {
      model = out_opts.model;
      table = out_opts.table;
      table_id = out_opts.table_id;
      preset_where = out_opts.where || {};
    }
    if (!model || table === undefined || Object.keys(table).length === 0) { // inner option
      error_prompt('illegal argument');
      return;
    }

    var params = get_filter_params(model);
    table.reload(table_id, {where: $.extend(params, preset_where)});
  }

  $.fn.get_filter_params = get_filter_params;

  $.fn.do_filter = function (out_opts) {
    if (_can_apply(out_opts.model)) {
      do_filter(out_opts);
    } else {
      out_opts.table.reload(out_opts.table_id);
    }
  };

  function filter_input_search_handler(options) {
    var input, keyword, len_keyword, container, all_a_item, txt_value, tag, closest;
    input = $(this);
    keyword = input.val().toLowerCase();
    len_keyword = keyword.length;
    if (options !== undefined) {
      tag = options['tag'];
      closest = options['closest'];
    }
    if (!tag) {
      tag = 'a';
    }
    if (!closest) {
      closest = '.dropdown-menu';
    }

    container = input.closest(closest);
    all_a_item = $(tag, container);

    $.each(all_a_item, function (idx, elem) {
      txt_value = (elem.textContent || elem.innerText).toLowerCase();
      if (len_keyword === 0 || txt_value.indexOf(keyword) > -1) {
        elem.style.display = "";
      } else {
        elem.style.display = "none";
      }
    });
  }

  $.fn.input_search = filter_input_search_handler;

  $.fn.adminFilters.defaults = {
    // filter_prefix_pattern: /(?<=^_p)(?=_)/,
    filter_value_pattern: /(=)(.*?)(&|$)/g,
    filter_code_name_pattern: /(?:^_p\d_)(.*?)(?:__)(?:\w+)/g,
    filter_prefix_pattern: /((?:^|&?)_p)(_)/g,  // for browser which does not support look-behinds
    filter_reverse_pattern: /((?:^|&?)_p)\d(_)/g,
    filter_reverse_pattern_single: /((?:^|&?)_p)(\d)(_)/,
    extra_trim_pattern: /^\?|^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/,
    filter_type_dict: {
      '0': 'fa-eraser',
      '1': 'fa-filter'
    },
    delay_time: 100,
    $navbar_str_tmp: '#{model}_navbar',
    $filter_menu_str_tmp: '#{model}_filter_menu',
    $bookmark_menu_str_tmp: '#{model}_bookmark_menu',
    $btn_clear_filter_str_tmp: 'div#{model}_clear_filters',
    $btn_apply_filter_str_tmp: 'div#{model}_apply_filters',
    $btn_bk_submit_tmp: '#{model}_bk_submit',
    $drop_filter_tmp: '#{model}_drop_filter',
    $filter_group_str_tmp: '#{model}_filters_group.filters-group',
    badge: '<span class="badge layui-bg-zk">1</span>',
    filter_template: '<a class="filters__item" href="javascript:void(0)" data-filter-params="{filter_params}" data-field-repr="{field_repr}"><i class="fa fa-fw {filter_type}"></i><span>{filter_text}</span><i class="layui-icon layui-unselect layui-close">ဆ</i></a>',
    $input_multi_switch: 'input.multi-switch-input[type=checkbox]'
  };
})(jQuery);

