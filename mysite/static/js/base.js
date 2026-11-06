// noinspection ES6ModulesDependencies
function titleCase(str, splitter) {
  if (splitter === undefined) {
    // noinspection JSUnusedAssignment
    splitter = ' ';
  }
  return str.toLowerCase().split(splitter).map(function (word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}

function _get_text_width() {
  var default_font_settings = '14px Helvetica Neue, Helvetica, PingFang SC, Tahoma, Arial, sans-serif';
    // browser_info = get_browser_platform();
  return function (text, font, is_real) {
    var _width;
    if (is_real === undefined || type(is_real) !== 'boolean' || is_real === false) {
      if (!get_text_width.fakeEl) {
        get_text_width.fakeEl = $('<span>').hide().appendTo(document.body);
      }
      get_text_width.fakeEl.text(text || this.val() || this.text()).css({
        'font': font || default_font_settings
      });
      get_text_width.fakeEl.show();
      _width =  get_text_width.fakeEl.get(0).getBoundingClientRect().width * window.devicePixelRatio;
      get_text_width.fakeEl.hide();
    } else {
      var elem = this,
        $elem = $(elem),
        original_width = $elem.width(),
        original_max_width = $elem.css('maxWidth'),
        original_min_width = $elem.css('minWidth');
      $elem.css({
        width: 'auto',
        minWidth: 'initial',
        maxWidth: 'initial'
      });
      _width = $elem.get(0).getBoundingClientRect().width;
      $elem.css({
        width: original_width,
        maxWidth: original_max_width,
        minWidth: original_min_width
      });
    }
    // console.log('#width', text, _width);
    return _width;
  };
}

get_text_width = _get_text_width();

function show_error_tips_wrapper() {
  return function (msg, that, color, close_btn, more_tips) {
    var item = that.children().eq(0).get(0);
    if (color === undefined) {
      color = '#db5860';
    }
    if (close_btn === undefined) {
      close_btn = 1;
    }
    if (more_tips === undefined) {
      more_tips = true;
    }

    return function () {
      return layer.tips(msg, function () {
        if (typeof that.attr('lay-ignore') !== 'string') {
          if (/^checkbox|radio$/.test(item.type)) {
            return that.next();
          }
        }
        return that;
      }(), {
        tips: [2, color],
        time: 0,
        fixed: false,
        closeBtn: close_btn,
        tipsMore: more_tips
      });
    };
  };
}

function show_prompt(msg, extra_options) {
  var default_options = {
    icon: 2,
    time: 3000, // 3 seconds
    shade: 0.06,
    //closeBtn: 2,
    //title: gettext('system_exception')
  };
  // noinspection ES6ModulesDependencies
  var opt = $.extend({}, default_options, extra_options);

  layer.msg(msg, opt);
}

// noinspection JSUnusedGlobalSymbols
function show_multi_overlap_window(content, title) {
  if (title === undefined) {
    title = gettext('system_exception');
  }
  layer.open({
    type: 1,
    title: title,
    area: ['390px', '330px'],
    shade: 0,
    offset: [ // random location
      Math.random() * ($(window).height() - 300),
      Math.random() * ($(window).width() - 390)
    ],
    maxmin: true,
    content: content,
    btn: [gettext('btn_closeAll')],
    yes: function () {
      layer.closeAll();
    },
    zIndex: layer.zIndex, // key point 1
    success: function (layero) {
      layer.setTop(layero); // key point 2
    }
  });
}

function parse_msg_show_tips_wrapper() {
  var _index_dict = {};

  return function (where_form_is_at, msg) {
    if (msg === undefined) {
      return;
    }
    if (typeof msg === 'string') {
      if (msg.length === 0) {
        msg = gettext('system_busy_please_try_again_later');
      }

     /* layer.msg(msg, {
        icon: 2,
        time: 0,
        closeBtn: 2,
        title: gettext('system_exception')
      });
      */
     layer.msg(msg, {icon: 5});
      return;
    }
    var general_messages = [];
    var error_message = [];
    // noinspection ES6ModulesDependencies
    $.each(msg, function (key, elem) {
      var messages = [];
      // noinspection ES6ModulesDependencies
      $.each(elem, function (index, detail) {
        messages.push(detail.message);
      });
      // the message is not belong to specific filed
      if ('__all__' === key) {
        general_messages.push(messages);
      } else {
        // console.log('#messages', messages);
        var that;

        // first exact
        // that = where_form_is_at.find('.layui-form-item [id=id_' + key + ']');
        that = where_form_is_at.find('#id_' + key);
        // second fuzzy
        if (that && that.length === 0) {
          that = where_form_is_at.find('.layui-form-item [id*=' + key + ']');
        }
        if (that && that.length) {
          var container = that.closest('.layui-input-inline');
          if (!container || container && container.length === 0) {
            container = that;
          }
          var show_error_tips = show_error_tips_wrapper();
          var closure_func = show_error_tips(messages.join('\n'), container.eq(0));
          var value = that.val();
          if (messages && messages.length !== 0){
            error_message.push(messages[0])
          }
          function msg_disappear_callback() {
            // var elem = $(this);
            // elem.val().length && container.find('input').removeClass('layui-form-danger');
            container.find('input').removeClass('layui-form-danger');
            container.find('textarea').removeClass('layui-form-danger');
            container.off('mouseenter', 'input').off('mouseleave', 'input');
            container.off('mouseenter', 'textarea').off('mouseleave', 'textarea');
          }

          container.find('input').addClass('layui-form-danger');
          container.find('textarea').addClass('layui-form-danger');
          container.on('mouseenter', 'input', function () {
            var existed_tips = _index_dict[key];
            if (existed_tips === undefined || !$.isArray(existed_tips)) {
              existed_tips = [];
            }
            if (existed_tips.length === 0) {
              existed_tips.push(closure_func());
              _index_dict[key] = existed_tips;
            }
          }).on('mouseleave', 'input', function () {
            var existed_tips = _index_dict[key];
            if (existed_tips) {
              existed_tips.forEach(function (value/*, index*/) {
                layer.close(value);
              });
            }
            _index_dict[key] = [];
          }).on('blur', 'input', msg_disappear_callback);
          container.on('mouseenter', 'textarea', function () {
            var existed_tips = _index_dict[key];
            if (existed_tips === undefined || !$.isArray(existed_tips)) {
              existed_tips = [];
            }
            if (existed_tips.length === 0) {
              existed_tips.push(closure_func());
              _index_dict[key] = existed_tips;
            }
          }).on('mouseleave', 'textarea', function () {
            var existed_tips = _index_dict[key];
            if (existed_tips) {
              existed_tips.forEach(function (value/*, index*/) {
                layer.close(value);
              });
            }
            _index_dict[key] = [];
          }).on('blur', 'textarea', msg_disappear_callback);
          // that.on('input change propertychange keyup paste', function () { // event: focus paste
          //   var elem = $(this);
          //   if (elem.val().length) {
          //     container.find('input').removeClass('layui-form-danger');
          //   }
          // });
        } else {
          show_prompt(key + ': ' + messages);
        }
      }
    });
    if (error_message.length > 0) {
      show_prompt(error_message[0]);
    } else if (general_messages.length > 0) {
      // show_multi_overlap_window(general_messages.join('\n'));
      show_prompt(general_messages.join('\n'));
    } else {
      var _key = $.fn.adminSite.const.NOT_MORE_FIELD_HINTS,
        _value = window['get_local_storage'](_key);
      if (!_value) {
        layer.confirm(gettext('msg_check_red_border_field'), {
            icon: 3,
            time: 2000,
            title: false,
            btn: [gettext('btn_confirm'), gettext('not_more_hints')],
            btnAlign: 'c',
            skin: 'zydeco-layer-rim',
            closeBtn: 2
          }, function (index) {
            layer.close(index);
          }, function (index) {
            window['set_local_storage'](_key, true);
          }
        );
      }
    }
  };
}

var parse_msg_show_tips = function () {
  return parse_msg_show_tips_wrapper().apply(this, arguments);
};

/**
 * function factory: make call-back function for submit
 * @param action_url: backend interface url for current submit actions
 * @param options
 *  - extra_field:
 *  @define: extra_field need to interject into form data
 *  @desc: **Note that it will use the `data` field passed by LayUI **
 *  - alternative_form: {type: selector}
 *  @define: use the `alternative_form` to replace the default `data` field(was mentioned above)
 * @returns {Function} callback function
 */
function submit_callback(action_url, options) {
  return function (data) {
    var extra_field = null,
      alternative_form = null;

    if (options && Object.keys(options).length > 0) {
      extra_field = options['extra_field'];
      alternative_form = options['alternative_form'];
    }

    var form_data = null;

    if (alternative_form === undefined || alternative_form == null) {
      form_data = data.field;
    } else {
      form_data = formObjectify(alternative_form);
    }

    form_data.obj_id = 1;

    if (extra_field && Object.keys(extra_field).length > 0) {
      // noinspection ES6ModulesDependencies
      $.each(extra_field, function (key, elem) {
        form_data[key] = elem;
      });
    }

    // noinspection ES6ModulesDependencies
    $.ajax({
      type: "POST",
      url: action_url,
      data: form_data,
      dataType: "json",
      success: function (res) {
        var msg, status;
        if (res.code === 0) {
          msg = gettext("processing_successful");
          status = 1;
          layer.msg(msg, {
            icon: status,
            time: 2000
          });
        } else {
          var f = $('.layui-form', '.layui-show');
          parse_msg_show_tips(f, res.msg);
        }
      }
    });
  };
}

function normal_prompt(msg, area) {
  if (area === undefined) {
    area = '700px';
  }

  show_prompt(msg, {
    //title: 'Info',
    icon: 1,
    shade: 0.1,
    time: 2000,
    //closeBtn: 2,
    area: area,
    shadeClose: true
  });
}

/**
 * internal error prompt(encapsulated)
 */
function error_prompt(msg, area) {
  if (area === undefined) {
    area = '600px';
  }
  show_prompt(msg, {
    title: gettext('action_notification_warning'),
    shade: 0.3,
    time: 2000,
    closeBtn: 2,
    area: area
  });
}

/**
 *
 * @returns {*|jQuery}
 */
function get_module_name() {
  return $('.layui-nav[lay-filter=nav-menu] .layui-nav-item .layui-this>a').attr('app');
}

/**
 *
 * @param str
 * @returns {String|*|void|string}
 * // String.prototype.decodeHex = function() {
 */
function decodeHex(str) {
  try {
    return str.replace(/([0-9A-Fa-f]{2})/g, function () {
      return String.fromCharCode(parseInt(arguments[1], 16));
    });
  } catch (e) {
    return '';
  }
}

// noinspection JSUnusedGlobalSymbols
/**
 *
 * @param byteStream
 * @param utf8
 * @returns {string}
 * @constructor
 */
function encodeHex(byteStream, utf8) {
  if (utf8 === undefined || typeof utf8 !== 'boolean') {
    utf8 = false;
  }
  if (utf8) {
    byteStream = utf8.encode(byteStream);
  }
  var str = '';
  for (var i = 0; i < byteStream.length; i++) {
    str += byteStream[i].charCodeAt(0).toString(16);
  }
  return str;
}

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function (suffix) {
    // ensure the suffix is the last `suffix.length` characters
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (prefix) {
    return this.substring(0, prefix.length).indexOf(prefix, 0) !== -1;
  };
}

// POLYFILL
/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Polyfill
 */
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function (searchElement, fromIndex) {

      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        // c. Increase k by 1.
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

function isArraysEqual(a1, a2, need_sort) {
  if (!Array.isArray(a1) || !Array.isArray(a2) || a1.length !== a2.length) {
    return false;
  }
  if (need_sort === undefined || type(need_sort) !== 'boolean') {
    need_sort = true;
  }

  var _a1 = a1.concat();
  var _a2 = a2.concat();

  if (need_sort) {
    _a1 = _a1.sort();
    _a2 = _a2.sort();
  }

  for (var i = 0, n = _a1.length; i < n; i++) {
    if (_a1[i] !== _a2[i]) {
      return false;
    }
  }
  return true;
}

function isArraysEqualStrict(a1, a2) {
  return isArraysEqual(a1, a2, false);
}


/**
 * intersection of two array or (the prop of )object
 * @param o1
 * @param o2
 * @param prop: if o1 and o2 are Object, then use `prop` to get the iterator
 *  - keys
 *  - values
 * @returns {*} intersection part
 */
function intersection(o1, o2, prop) {
  var list1 = [], list2 = [];

  if (prop === undefined || typeof prop !== 'string') {
    prop = 'keys';
  }

  if ($.isArray(o1)) {
    list1 = o1;
  } else if (o1) {
    list1 = Object[prop](o1);
  }
  if ($.isArray(o2)) {
    list2 = o2;
  } else if (o2) {
    list2 = Object[prop](o2);
  }


  return list1.concat(list2).sort().reduce(function (acc, cur, idx, src) {
    if (idx && src[idx - 1] === cur) {
      acc.push(cur);
    }
    return acc;
  }, []);
}

function _get_reverse_version_params(where) {
  var normal_pat = '_p0_',
    reverse_pat = '_p1_',
    result = [];
  $.each(where, function (param/*, value*/) {
    // reverse of parameter
    var rp = null;
    if (param.startsWith(normal_pat)) {
      rp = param.replace(new RegExp('^' + normal_pat), reverse_pat);
    } else if (param.startsWith(reverse_pat)) {
      rp = param.replace(new RegExp('^' + reverse_pat), normal_pat);
    }
    if (rp) {
      result.push(rp);
    }

  });
  return result;
}

function drop_last_request_parameters(w1, w2) {
  var to_keep = intersection(w1, w2),
    filter_pat = /^_p\d_/;

  $.each(Object.keys(w1), function (idx, elem) {
    // only delete those filter parameters that not includes in this request
    if (filter_pat.test(elem) && $.inArray(elem, to_keep) === -1) {
      delete w1[elem];
    }
  });
  return w1;
}

// noinspection JSUnusedGlobalSymbols
/**
 * remove mutual exclude parameter in the w1 according w2's configures
 * @param w1
 * @param w2
 */
function drop_mutual_exclude_parameters(w1, w2) {
  var reverse_params = _get_reverse_version_params(w2),
    to_remove = intersection(w1, reverse_params);
  $.each(to_remove, function () {
    delete w1[this];
  });
  return w1;
}


(function ($) {
  var proxy = $.fn.serializeArray;
  $.fn.serializeArray = function () {
    var inputs = this.find(':disabled');
    inputs.prop('disabled', false);
    var serialized = proxy.apply(this, arguments);
    inputs.prop('disabled', true);
    return serialized;
  };
})(jQuery);


/**
 * make html element
 * @param tag
 * @param attributes
 * @returns {HTMLElement}
 * @private
 */
function make_dom_element(tag, attributes) {
  var elem = document.createElement(tag);
  for (var attribute in attributes) {
    if (attributes.hasOwnProperty(attribute)) {
      switch (attribute) {
        case 'innerText':
        case 'innerHTML':
          elem[attribute] = attributes[attribute];
          break;
        default:
          elem.setAttribute(attribute, attributes[attribute]);
          break;
      }
    }
  }
  return elem;
}

$.fn.make_dom_element = make_dom_element;


// noinspection JSUnusedGlobalSymbols
/**
 * set an new global css in runtime in first call
 * or replace an original existed css with new value
 * cssText
 * @returns {*}
 */
function set_style(cssText) {
  var sheet = document.createElement('style');
  sheet.type = 'text/css'; /* Optional */
  window.customSheet = sheet;
  (document.head || document.getElementsByTagName('head')[0]).appendChild(sheet);
  return (set_style = function (cssText, node) {
    if (!node || node.parentNode !== sheet) {
      return sheet.appendChild(document.createTextNode(cssText));
    }
    node.nodeValue = cssText;
    return node;
  })(cssText);
}


/**
 * try to insert zero in the left hand side of specific number
 *
 * @param int_num: {int}
 * @return {string}
 */
function leftInsertZero(int_num) {
  return pad(int_num, 2, '0');
}


/**
 * c is the filled character
 *
 * @param s: string
 * @param w: width
 * @param c: character
 * @returns {string}
 */
function pad(s, w, c) {
  s = s + '';
  c = c || '0';
  return s.length >= w
         ? s
         : new Array(w - s.length + 1).join(c) + s;
}

/**
 *
 * @param url: {string}, required
 * @param iterator: {Object, FormData}, required
 * @param exclude: {string, Array} optional, used in iterate the iterator for exclude some unwanted key-value pair
 */
function concatenate_url(url, iterator, exclude) {
  var original_url = url,
    junction = '?',
    request_args = [];

  if (exclude === undefined) {
    exclude = [];
  } else if (typeof exclude === 'string') {
    exclude = [exclude];
  }

  if (original_url.includes('?')) {
    junction = '&';
  }
  var push_function = function (option) {
    var key = option.key,
      value = option.value;
    if (exclude.indexOf(key) === -1) {
      request_args.push(key + '=' + value);
    }
  };

  var push_function_wrapper = function (reverse) {
    if (reverse === undefined || typeof reverse !== 'boolean') {
      reverse = false;
    }
    return function (arg1, arg2) {
      if (reverse) {
        arg2 = [arg1, arg1 = arg2][0];
      }
      push_function({
        'key': arg1,
        'value': arg2
      });
    };
  };

  if (iterator instanceof FormData) {
    iterator.forEach(push_function_wrapper(true));
  } else {
    $.each(iterator, push_function_wrapper());
  }

  return original_url + junction + request_args.join('&');
}


/**
 * @desc: generator a tips which only show when user mouse is hovering around its binding element
 */
function general_hover_tips_generator() {
  var which_index; // closure variable
  return function (text, options) {
    if (options === undefined) {
      options = {};
    }
    var default_opts = {
        hide: false,
        tips: 2, // the default direction is right
        tipsMore: true,
        time: 0
      }, settings = $.extend({}, default_opts, options),
      hide = settings.hide;
    delete settings['hide'];
    // var othis = $(this);
    if (hide) {
      which_index && layer.close(which_index);
    } else if (text) {
      which_index = layer.tips(text, this, settings);
    }
    return true;
  };
}


/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
    length = values.length,
    offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

function xhr_request_with_progress() {
  $.fn.set_progress_bar({
    percent: 0
  });
  return function (disappear_timeout) {
    if (disappear_timeout === undefined) {
      disappear_timeout = 1000;
    }
    var xhr = new window.XMLHttpRequest();
    //Download progress
    xhr.addEventListener("progress", function (evt) {
      if (evt.lengthComputable) {
        var percentComplete = (evt.loaded / evt.total) * 100;
        $.fn.set_progress_bar({'percent': percentComplete});
        if (percentComplete >= 100) {
          setTimeout(function () {
            $.fn.set_progress_bar({
              'hide': true
            });
          }, disappear_timeout);
        }
      }
    }, false);
    return xhr;
  };
}


function get_layui_table_property(category, model_name) {
  return layui.table.thisTable[category]['id_grid_' + model_name];
}

get_layui_table_instance = function (model_name) {
  return get_layui_table_property('that', model_name);
};

get_layui_table_config = function (model_name) {
  return get_layui_table_property('config', model_name);
};

/**
 * get except limit of layui table
 * @param model_name
 * @returns {number}
 */
function get_except_limit(model_name) {
  var has_filter_bar = $('.dropdown', '#' + model_name + '_navbar').length === 2,
    // -68 = - 3 (progress bar) - 52 (tab title bar) + 10 * 2(padding-top and padding-bottom) - 23(preserver_row) - 10
    // (potential scroll-bar) -104 = other part of layui table, tolerant deviation: [+1,-1]
    available_area = $('#main_body.layui-body').get(0).getBoundingClientRect().height - 172 - Math.floor(Math.random() * 3 - 1);
  if (has_filter_bar) {
    // layui-body - 51(filter bar)
    available_area -= 51;
  }
  return 50//available_area > 0 ? Math.floor(available_area / 23) : 20;
  // return 20 //not use get_except_limit now.
}

/**
 * get new height of specific table
 * @param model_name
 * @param new_height
 * @returns {number}
 */
function get_height_of_table_main_native(model_name, new_height) {
  var table_instance = get_layui_table_instance(model_name),
    options = get_layui_table_config(model_name),
    that = table_instance,
    // subtract header height
    body_height = parseFloat(new_height) - (that.layHeader.outerHeight() || 38);

  // toolbar exist?
  if (options.toolbar) {
    body_height = body_height - (that.layTool.outerHeight() || 50);
  }

  // totalRow exist?
  if (options['totalRow']) {
    body_height = body_height - (that.layTotal.outerHeight() || 40);
  }

  // layer page exist?
  if (options.page) {
    body_height = body_height - (that.layPage.outerHeight() || 41) - 2;
  }
  return body_height;
}

function adjust_height_of_table_wrapper() {
  var inn_cache = {};
  return function (model_name, new_height, prefer_way) {
    var fluid_container = '#' + model_name + '_fluid',
      table_main = $('.layui-table-main', fluid_container),
      table_whole = $('.layui-table-view', fluid_container),
      offset_height;

    if (prefer_way === 'native') {
      offset_height = get_height_of_table_main_native();
    } else {
      // get_height_of_table_main_dynamic
      offset_height = inn_cache[model_name];
      if (offset_height === undefined) {
        offset_height = Math.abs(parseFloat(table_whole.css('height')) - parseFloat(table_main.css('height')));
        inn_cache[model_name] = offset_height;
      }
    }
    table_main.css({
      height: new_height - offset_height
    });
    table_whole.css({
      height: new_height
    });
  };
}

adjust_height_of_table = adjust_height_of_table_wrapper();

// noinspection JSUnusedGlobalSymbols
function generate_uuid_v4_random() {
  var d = new Date().getTime(), tpl = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); //use high-precision timer if available
  }
  return tpl.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// noinspection JSUnusedGlobalSymbols
/**
 *
 * @returns {String|string|*|void}
 */
function generate_uuid_v4_flag(
  flag                              // placeholder
) {
  var _crypto = window.crypto || window.msCrypto;
  return flag                       // if the placeholder was passed, return a
         ? (                        // random number from 0 to 15
           flag ^                   // unless b is 8,
           _crypto.getRandomValues(new Uint8Array(1))[0]  // in which case
           % 16                     // a random number from
           >> flag / 4              // 8 to 11
         ).toString(16)       // in hexadecimal
         : (                        // or otherwise a concatenated string:
           // 10000000 + -1000  -4000  -80000000 -100000000000,
           [1e7] + -1e3 + -4e3 + -8e3 + -1e11
         ).replace(                 // replacing
      /[018]/g,                     // zeroes, ones, and eights with
      generate_uuid_v4_flag         // random hex digits
    );
}

function generate_uuid_v4_crypt() {
  var _crypto = window.crypto || window.msCrypto;
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
      return (c ^ _crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
    }
  );
}

/**
 * is iter-able
 * @param obj
 * @returns {boolean}
 */
function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return type(obj[Symbol.iterator]) === 'function';
}

// noinspection JSUnusedGlobalSymbols
/**
 * probe to whether specific session type is available or not
 * @author: Boyce
 * @param type
 * @returns {boolean}
 */
function is_storage_available(type) {
  try {
    var storage = window[type],
      x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return e instanceof DOMException && (
      e.code === 22 || // everything except Firefox
      e.code === 1014 || // Firefox
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
           // acknowledge QuotaExceededError only if there's something already stored
           storage.length !== 0;
  }
}

function _storage_proxy_wrapper() {
  var storage_mapping = {
    'session': window.sessionStorage,
    'local': window.localStorage
  };
  /**
   * @author Boyce
   * @param storage_type:
   * @param op: get, set, del
   * @param data:
   */
  return function (storage_type, op, data) {
    var storage = storage_mapping[storage_type], result = null;
    switch (op) {
      case 'get':
        result = [];
        if (type(data) === 'array') {
          data.forEach(function (key) {
            result.push(storage.getItem(key));
          });
        }
        break;
      case 'set':
        result = true;
        if (type(data) === 'object') {
          try {
            for (var key in data) {
              if (data.hasOwnProperty(key)) {
                storage.setItem(key, data[key]);
              }
            }
          } catch (e) {
            console.trace(e);
            result = false;
          }
        }
        break;
      case 'remove':
        result = true;
        if (type(data) === 'array') {
          try {
            data.forEach(function (key) {
              storage.removeItem(key);
            });
          } catch (e) {
            console.trace(e);
            result = false;
          }
        }
        break;
      default:
        break;
    }
    return result;
  };
}

_storage_proxy = _storage_proxy_wrapper();


// auto inject session auxiliary function into global scope
(function () {
  var available_session_types = ['session', 'local'],
    function_name_tpl = '%(verb)s_%(session_type)s_storage',
    generators = {
      get: function (storage_type) {
        return function (key) {
          if (type(key) === 'string') {
            return _storage_proxy(storage_type, 'get', [key])[0];
          } else if (type(key) === 'array') {
            return _storage_proxy(storage_type, 'get', key);
          } else {
            return null;
          }
        };
      },
      set: function (storage_type) {
        /**
         * set stored value in bulk
         * @param key_value_pair {Object}
         * @returns {*}
         * @description:
         * The keys and the values are always strings (note that, as with objects, boolean, number keys will be
         *   automatically converted to strings).
         */
        return function (key_value_pair) {
          if (arguments.length === 1 && type(arguments[0]) === 'object') {
          } else if (arguments.length === 2 && type(arguments[0]) === 'string') {
            var preset_type = ['boolean', 'number', 'object', 'array'], value;
            value = arguments[1];
            if (type(value) === 'string') {
            } else if (preset_type.includes(type(value))) {
              try {
                value = JSON.stringify(value);
              } catch (e) {
                throw EvalError(e);
              }
            } else {
              throw EvalError('Illegal argument: arguments should be an Object or two string which represent key and value respectively.');
            }

            var tmp_obj = {};
            tmp_obj[arguments[0]] = value;
            key_value_pair = tmp_obj;
          } else {
            throw EvalError('Illegal argument: arguments should be an Object or two string which represent key and value respectively.');
          }
          return _storage_proxy(storage_type, 'set', key_value_pair);
        };
      },
      del: function (storage_type) {
        /**
         * @param key {String|Array}
         * @returns *
         */
        return function (key) {
          if (type(key) === 'string') {
            return _storage_proxy(storage_type, 'remove', [key]);
          } else if (type(key) === 'array') {
            return _storage_proxy(storage_type, 'remove', key);
          } else {
            return null;
          }
        };
      }
    };
  available_session_types.forEach(function (session_type) {
    for (var key in generators) {
      var func_name = interpolate(function_name_tpl, {
        verb: key,
        session_type: session_type
      });
      window[func_name] = generators[key](session_type);
      // console.debug(('# inject ' + func_name), window[func_name]);
    }
  });
})();

/**
 * get values or keys from iterable
 * @param obj
 * @param prop
 * @returns {Array}
 */
function get_prop_from_iterable(obj, prop) {
  var result = [];
  if (prop === undefined) {
    prop = 'values';
  }
  if (type(obj) === 'array') {
    result = obj;
  } else if (isIterable(obj)) {
    var iter = obj[prop](), tmp = iter.next();
    while (!tmp.done) {
      result.push(tmp.value);
      tmp = iter.next();
    }
  } else if (type(obj) === 'object') {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (prop === 'values') {
          result.push(obj[key]);
        } else {
          result.push(key);
        }
      }
    }
  }
  return result;
}

/**
 * detect whether it(browser) is in fullscreen mode or not
 * @returns {boolean}
 */
function is_fullscreen() {
  var maxHeight = window.screen.height,
    maxWidth = window.screen.width,
    curHeight = window.innerHeight,
    curWidth = window.innerWidth;

  return maxWidth <= curWidth && maxHeight <= curHeight;
}


// noinspection JSUnusedGlobalSymbols
function popup_right() {
  var index;
  return function (opts) {
    index = layer.open($.extend({
      type: 1,
      id: "lay_popup_r",
      anim: -1,
      title: !1,
      closeBtn: !1,
      offset: "r",
      shade: .1,
      shadeClose: !0,
      skin: "layui-anim layui-anim-rl layui-layer-adminRight",
      area: "300px"
    }, opts));
  };
}

// noinspection JSUnusedGlobalSymbols
function turn_colored_outline() {
  var css_node, css_text;
  return function (options) {
    if (options === undefined) {
      options = {};
    }
    _.extend(options, {
      width: '1px',
      style: 'dashed',
      color: 'rgba(102, 51, 153, 0.313725)'
    });

    css_text = interpolate('* {outline: %(width)s %(style)s %(color)s !important;}', options);
    if (css_node === undefined) {
      css_node = set_style(css_text);
    } else {
      // noinspection JSCheckFunctionSignatures
      set_style(css_text, css_node);
    }
  };
}

function get_position(elem, _window) {
  _window = _window || window;
  var $ = _window ? _window.layui.$ : layui.$,
    offsetTemp = {},
    body = $('body');
  if (parent !== window) {
    offsetTemp = get_position($(window.frames.frameElement), parent);
  }
  var bodyOffset = body.hasClass('layui-container') ? body.offset() : {
    top: 0,
    left: 0
  };
  return {
    top: (offsetTemp.top || 0) + elem.offset().top - bodyOffset.top - $(_window.document).scrollTop(),
    left: (offsetTemp.left || 0) + elem.offset().left - bodyOffset.left - $(_window.document).scrollLeft()
  };
}

// --------------------
// Array Related Method
// --------------------

/**
 * swap the place of two items in array `arr`
 * @param arr: array
 * @param lhs: left-hand-side item
 * @param rhs: right-hand-side item
 */
function array_swap(arr, lhs, rhs) {
  var tmp = arr[lhs];
  arr[lhs] = arr[rhs];
  arr[rhs] = tmp;
}

function get_all_elements_from_point(x, y, exclude_func) {
  var elements = [];
  var display = [];
  var item = document.elementFromPoint(x, y);
  // noinspection JSValidateTypes
  while (item && item !== document.body && item !== window && item !== document && item !== document.documentElement) {
    elements.push(item);
    display.push(item.style.display);
    item.style.display = "none";
    item = document.elementFromPoint(x, y);
  }
  // restore display property
  for (var i = 0; i < elements.length; i++) {
    elements[i].style.display = display[i];
  }
  if (exclude_func !== undefined) {
    elements = _.remove(elements, exclude_func);
  }
  return elements;
}

function _round(op, value, decimals) {
  var value_length = String(value).length;
  if (value_length < decimals) {
    return value;
  }
  var result;
  switch (op) {
    case 'up':
      result = Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
      break;
    case 'down':
      var divider = Math.pow(10, decimals);
      result = Math.floor(value * divider) / divider;
      break;
    default:
      result = null;
  }
  return result;
}

function round_up(value, decimals) {
  return _round('up', value, decimals);
}

function round_down(value, decimals) {
  return _round('down', value, decimals);
}

function hex_to_rgb(hex) {
  hex = hex.replace(/^#/, '');
  var alpha = 0, max_value = 255, rgba = [], i, n;
  for (i = 0, n = 6; i < n; i += 2) {
    var pole_color = parseInt(hex.slice(i, i + 2), 16);
    rgba.push(pole_color);
  }
  if (hex.length > 6) {
    alpha = round_up(parseInt(hex.slice(6), 16) / max_value, 6);
    rgba.push(alpha);
  }
  return 'rgba(' + rgba.join(', ') + ')';
}

function get_browser_platform(key) {
  var agent = navigator.userAgent.toLowerCase()
    , getVersion = function (label) {
    var exp = new RegExp(label + '/([^\\s\\_\\-]+)');
    label = (agent.match(exp) || [])[1];
    return label || false;
  }

    , result = {
    os: function () {
      switch (true) {
        case /windows/.test(agent):
          return 'windows';
        case /linux/.test(agent):
          return 'linux';
        case /iphone|ipod|ipad|ios/.test(agent):
          return 'ios';
        case /mac/.test(agent):
          return 'mac';
        default:
          return '';
      }
    }(),
    ie: function () {
      return (!!window.ActiveXObject || "ActiveXObject" in window) ? (
        (agent.match(/msie\s(\d+)/) || [])[1] || '11' //由于ie11并没有msie的标识
      ) : false;
    }(),
    wechat: getVersion('micromessenger'),
    chrome: getVersion('chrome'),
    firefox: getVersion('firefox')
  };


  result.android = /android/.test(agent);
  result.ios = result.os === 'ios';

  if (key && !result[key]) {
    result[key] = getVersion(key);
  }

  return result;
}

/**
 * @description:
 * calculate string length by treat ASCII and CJK character differently:
 *  * one ASCII letter counts 1 character;
 *  * one CJK character counts 2 character;
 * @author: Boyce
 * @param str
 */
function str_len(str) {
  var len = 0;
  if (str != null) {
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
        len++;
      } else {
        len += 2;
      }
    }
  }
  return len;
}


/**
 * @description: add format method for date object
 * @author: Boyce
 * @see: bio-security
 * @param: format
 */
Date.prototype.format = function (format) {
  var date_obj = {
    "M+": this.getMonth() + 1, //month
    "d+": this.getDate(), //day
    "H+": this.getHours(), //hour
    "m+": this.getMinutes(), //minute
    "s+": this.getSeconds(), //second
    "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
    "S": this.getMilliseconds()
  };
  if (/(y{4})/.test(format)) {
    format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in date_obj) {
    if (new RegExp("(" + k + ")").test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length === 1
        ? date_obj[k]
        : pad(date_obj[k], 2, '0'));
      // : ("00" + date_obj[k]).substr(("" + date_obj[k]).length));
    }
  }
  return format;
};

/**
 * @description format second to time object
 * @author Boyce
 * @see bio-security
 * @param value: the seconds passed
 * @example
 * 61 = one second over one minute
 */

function format_seconds(value) {
  var ss = Number(value), mm = 0, hh = 0;

  if (ss > 60) {
    mm = ss / 60;
    ss = ss % 60;
    if (mm > 60) {
      hh = mm / 60;
      mm = mm % 60;
    }
  }
  return [
    round_down(hh, 0),
    round_down(mm, 0),
    round_down(ss, 0)
  ].join('');
}


is_rtl_layout = function () {
  return document.querySelectorAll('[dir=rtl]').length > 0;
};


(function ($, undefined) {
  var const_max_class = 3
    , get_selector = function (element, quit_in_time) {
    var pieces = [];

    for (; element && element.tagName !== undefined; element = element.parentNode) {
      if (element.id && !/\s/.test(element.id)) {
        pieces.unshift(element.id);
        pieces.unshift('#');
        if (quit_in_time) {
          break;
        }
      } else if (element.className) {
        var classes = element.className.split(' ').slice(0, const_max_class);
        for (var i in classes) {
          if (classes.hasOwnProperty(i) && classes[i]) {
            pieces.unshift(classes[i]);
            pieces.unshift('.');
          }
        }
      }
      pieces.unshift(element.tagName);
      pieces.unshift(' > ');
    }
    if (!quit_in_time) {
      pieces = pieces.slice(1);
    }
    return pieces.join('');
  };

  $.fn.getSelector = function (options) {
    var opts = $.extend({}, options, {
      'quit_in_time': true,
      'first_one': false
    });
    if (true === opts.first_one) {
      return get_selector(this[0], opts.quit_in_time);
    } else {
      return $.map(this, function (el) {
        return get_selector(el, opts.quit_in_time);
      });
    }
  };
})(window.jQuery);
