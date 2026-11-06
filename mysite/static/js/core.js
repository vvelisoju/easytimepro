// noinspection ThisExpressionReferencesGlobalObjectJS
var type = (function (global) {
  var cache = {};
  return function (obj) {
    var key;
    return (
      obj === null
      ? 'null' // null
      : obj === global
        ? 'global' // window in browser or global in nodejs
        : (key = typeof obj) !== 'object'
          ? key // basic: string, boolean, number, undefined, function
          : obj.nodeType
            ? 'object' // DOM element
            // cached. date, regexp, error, object, array, math
            : cache[key = Object.prototype.toString.call(obj)] ||
              // get XXXX from [object XXXX], and cache  it
              (cache[key] = key.replace(/(?:\[object )(.*)(?:])/, '$1').toLowerCase())
    );
  };
}(this));


/**
 * @summary Remove duplicate element
 * @author Boyce
 * @description
 * >>> arr = Array.prototype.slice.call('12414111', '')
 * --> Array(8) [ "1", "2", "4", "1", "4", "1", "1", "1" ]
 * >>> arr.toUnique()
 * --> Array(3) [ "1", "2", "4" ]
 * @returns unique array
 */
function toUnique(arr) {
  var _arr = arr.concat();
  for (var i = 0, n = _arr.length; i < n; ++i) {
    for (var j = i + 1; j < _arr.length; ++j) {
      if (_arr[i] === _arr[j]) {
        // say: you remove this guy from queue,
        // and next loop you will continue progress from current index again
        _arr.splice(j--, 1);
      }
    }
  }
  return _arr;
}

function _string_format() {
  var _pattern_dict = {
    '%s': {
      'slice': [2, -2],
      'array': new RegExp('%s', 'g'),
      'object': new RegExp('%\\(\\w+\\)s', 'g')
    },
    '{}': {
      'slice': [1, -1],
      'array': new RegExp('{}', 'g'),
      'object': new RegExp('[{]\\w+?[}]', 'g')
    }
  }, _missing_check = function (res, sentry) {
    if (res === undefined) {
      res = sentry;
    } else if (type(res) !== 'string') {
      res = String(res);
    }
    return res;
  }, _format = function (trait, fmt, obj, sentry) {
    if (sentry === undefined || type(sentry) !== 'string') {
      sentry = null;
    }
    var conf = _pattern_dict[trait],
      obj_type = type(obj),
      callbacks = {
        'object': function (match) {
          return _missing_check(obj[String.prototype.slice.apply(match, conf['slice'])], sentry === null ? match : sentry);
        },
        'array': function (match) {
          return _missing_check(obj.shift(), sentry === null ? match : sentry);
        }
      };
    return fmt.replace(conf[obj_type], callbacks[obj_type]);
  };

  return {
    'interpolate': function (fmt, obj, sentry) {
      return _format('%s', fmt, obj, sentry);
    },
    'interject': function (fmt, obj, sentry) {
      return _format('{}', fmt, obj, sentry);
    }
  };
}

_string_format_obj = _string_format();

/**
 * @author Boyce
 * @date 20180907
 * @summary 类似 python % 的字符格式化方法
 * @desc 仅支持 %s, 因为 String 最常见, 非 str, toString() 一步转换
 *
 * @param fmt 格式字符所组成的串
 * @param obj {Array|Object} 如果是用 named 具名参数，则 obj instanceof Object 成立，否则 obj instanceof Array 成立
 * @param [sentry] {String}
 * @returns {*} 返回`格式字符`已被`对应的实际字符`替换后的字符串
 *
 * @example
 * ``` javascript
 * // 未使用具名参数
 * result = interpolate('%s, %s', ['hello', 'boyce'])
 * hello, boyce
 * // 使用具名参数
 * result = interpolate('%(msg)s, %(name)s', {'msg':'goodbye', 'name':'boyce'}, true)
 * goodbye, boyce
 * ```
 * @tutorial:
 * Note that: we cannot use `sentry || match` in case that sentry is ''(empty string)
 */
function interpolate(fmt, obj, sentry) {
  return _string_format_obj['interpolate'](fmt, obj, sentry);
}

/**
 * @author Boyce
 * @date 20180907
 * @summary 和 interpolate 类似, 差异点在于模拟的是 python 的 format 方法
 *
 * @param fmt
 * @param obj
 * @param sentry
 * @returns {String|*|void|string}
 */
function interject(fmt, obj, sentry) {
  return _string_format_obj['interject'](fmt, obj, sentry);
}

/**
 * @author Boyce
 * @date 20180914
 * @param that -- Tips 所依附的 DOM or jQuery 选择器
 * @param is_html -- 量否以 html 内容来显示
 */
function tipsPrompt(that, is_html) {
  // console.log('call `tips_prompt`', this, arguments);
  var $that = $(that),
    box_target = $that.data('boxTarget'),
    text;

  if (is_html === undefined || (type(is_html) !== 'boolean' || is_html === false) ) {
    text = $(box_target).text();
  } else {
    text = $(box_target).html();
  }

  layer.tips(text, that, {
    tips: [2, '#393d49'],
    time: 3000,
    closeBtn: 2
  });

  /* // traditional tips layer
   layer.open({
   content: text,
   time: 3000,
   btn: [gettext('Okay'),],
   title: gettext('Tips'),
   });
   */
}

/**
 * @author Boyce
 * @desc check whether support html5 storage or not
 * @returns {boolean}
 */
function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

/**
 * @author Boyce
 * @param str: the original string to encode
 * @returns {string} standard base64 encoded string
 * @example:
 * b64EncodeUnicode('✓ à la mode'); // "4pyTIMOgIGxhIG1vZGU="
 * b64EncodeUnicode('\n'); // "Cg=="
 */
function b64EncodeUnicode(str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into `btoa`.
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
}

/**
 * @author Boyce
 * @param str: standard base64 encoded string
 * @returns {string} the original string
 * @example:
 * b64DecodeUnicode('4pyTIMOgIGxhIG1vZGU='); // "✓ à la mode"
 * b64DecodeUnicode('Cg=='); // "\n"
 */
function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

/**
 * let a form become a JSON
 * @param form: form selector or form obj
 */
function formObjectify(form) {
  if (typeof form === "string") {
    form = $(form);
  }
  var result = {};
  if (form instanceof Object && form.length > 0) {
    // form.serializeArray().map(function (x) {
    //   result[x.name] = x.value;
    // });
    // return result;
    return form.serializeArray().reduce(function (o, x) {
      o[x.name] = x.value;
      return o;
    }, result);
  } else {
    return result;
  }
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}
