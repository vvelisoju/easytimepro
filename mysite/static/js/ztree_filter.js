(function () {
  $.fn.zTreeFilter = function (options) {
    var zTreeObj, cur_expand_node = null, is_single_expand = true,
      cur_show = {},
      check_percent_pattern = /\s*\(\d+\/\d+\)$/;

    var opts = $.extend({}, $.fn.zTreeFilter.defaults, options),
      uniqueId = opts.name + opts.stamp,
      zTreeId = uniqueId + '_tree';

    function init_select_tree(isMultiple, checkStyle, checkboxType) {
      var target, that = $(this);

      var callback = {
        beforeExpand: before_expand,
        onClick: on_click,
        onCheck: on_check,
        onRightClick: on_right_click
      };

      var setting = {
        view: {
          nameIsHTML: true, // allow html in node name for highlight usage
          dblClickExpand: false,
          showLine: true
        }, data: {
          simpleData: {
            enable: true
          }
        }, check: {
          enable: false,
          chkboxType: opts.non_children_checkbox_type,
          radioType: "all"
        }, edit: {
          enable: false,
          editNameSelectAll: false
        }, callback: callback
      };
      if (isMultiple) {
        setting.check.enable = isMultiple;
      }
      if (checkboxType !== undefined && checkboxType != null) {
        setting.check.chkboxType = checkboxType;
      }
      setting.check.chkStyle = checkStyle;

      opts.filters_group = $('.navbar-collapse .filters-group:visible:first'); //that.closest('.navbar-collapse').siblings('.filters-group');
      opts.characteristic = opts.lookup['in'].replace('_p_', '');
      opts.model = opts.filters_group.attr('id').split('_')[0];

      target = $('#' + uniqueId);

      target.parent().append('<div class="tree-content-filter">' +
        '<div id="' + uniqueId + '-tree-control">' + '</div>' +
        '<div style="display:none;" id="' + uniqueId + '_hide"></div>' +
        '<ul id="' + uniqueId + '_tree" class="ztree scrollbar" style="margin-top:0;"></ul>' +
        '</div>');

      var control_panel_for_general_propose =
        '<span data-name="single" class="selected"><a href="javascript:void(0);" title="' + gettext('expand_only_single_path') + '">' +
        '<i class="fa fa-fw fa-minus"></i></a></span>' +
        '<span data-name="search" ><a href="javascript:void(0);" title="' + gettext('search_node') + '">' +
        '<i class="fa fa-fw fa-search"></i></a></span>',
        control_panel_for_multiple_select =
          '<span class="" data-name="all"><a href="javascript:void(0);" title="' + gettext('select_all') + '">' +
          '<i class="fa fa-fw fa-check-square-o"></i></a></span>' +
          '<span data-name="children"><a href="javascript:void(0);" title="' + gettext('select_sub_department') + '">' +
          '<i class="fa fa-fw fa-sitemap"></i></a></span>' +
          '<span data-name="radio"><a href="javascript:void(0);" title="' + gettext('multiple_or_single') + '">' +
          '<i class="fa fa-fw fa-square-o"></i></a></span>',
        $control_panel = $('#' + uniqueId + '-tree-control');

      var search_field = $.fn.make_dom_element('input', {
        id: uniqueId + '_search',
        style: 'width: auto;margin: 5px 15px 0 15px;display: none;'
      }), ztree_field = $('#' + zTreeId);
      ztree_field.before(search_field);

      // target.closest('.dropdown-menu').find('.tree-content-filter').fadeIn('fast');
      target.closest('.dropdown-menu').css('padding', '0px');

      if (setting.check.chkStyle === 'checkbox') {
        $control_panel.append(control_panel_for_multiple_select);
      }
      $control_panel.append(control_panel_for_general_propose);

      $('#' + uniqueId + '-tree-control span').on('click', function () {
        var that = $(this),
          name = that.data('name'),
          $search_field_str = '#' + uniqueId + '_search', i_tag;

        that.toggleClass('selected');
        // from disable to enable
        if (that.hasClass('selected')) {
          switch (name) {
            case 'all':
              if (zTreeObj.setting.check.chkStyle === 'checkbox') {
                zTreeObj.checkAllNodes(true);
                assignment.call(event.currentTarget, zTreeObj.getCheckedNodes());
              }
              break;
            case 'children':
              zTreeObj.setting.check.chkboxType = opts.children_checkbox_type;
              break;
            case 'radio':
              var nodes = zTreeObj.getCheckedNodes();
              if (nodes.length > 1) {
                error_prompt('More than one node had been checked. Uncheck first, then try again.');
                that.toggleClass('selected');
              } else {
                zTreeObj.setting.check.chkStyle = 'radio';
                i_tag = that.find('i');
                if (i_tag.hasClass('fa-square-o')) {
                  i_tag.removeClass('fa-square-o');
                  i_tag.addClass('fa-circle-o');
                }
                $(opts.$control_panel_all).hide();
                $(opts.$control_panel_children).hide();
              }
              break;
            case 'single':
              is_single_expand = true;
              break;
            case 'search':
              $($search_field_str).fadeIn('slow');
              break;
            default:
              console.log('undefined operation.');
          }
        } else { // from enable to disable
          switch (name) {
            case 'all':
              if (zTreeObj.setting.check.chkStyle === 'checkbox') {
                zTreeObj.checkAllNodes(false);
                assignment.call(event.currentTarget, zTreeObj.getCheckedNodes());
              }
              break;
            case 'children':
              zTreeObj.setting.check.chkboxType = opts.non_children_checkbox_type;
              break;
            case 'radio':
              zTreeObj.setting.check.chkStyle = 'checkbox';
              i_tag = that.find('i');
              if (i_tag.hasClass('fa-circle-o')) {
                i_tag.removeClass('fa-circle-o');
                i_tag.addClass('fa-square-o');
              }
              $(opts.$control_panel_all).show();
              $(opts.$control_panel_children).show();
              break;
            case 'single':
              is_single_expand = false;
              break;
            case 'search':
              $(search_field).val('').trigger('propertychange').fadeOut('fast');
              break;
            default:
              console.log('undefined operation.');
          }
        }
        zTreeObj.refresh();
      });

      zTreeObj = $.fn.zTree.init(ztree_field, setting, opts.data);
      // assignment.call(event.currentTarget, zTreeObj.getCheckedNodes()); // there is not initial checked nodes

      $.tree.nodeFuzzySearch(zTreeId, search_field, {
        highlight: true, expand: true, percent: true, callback: get_show_nodes
      });

      // Monitor clear filters button to uncheck all checked nodes
      $(interject($.fn.adminFilters.defaults.$btn_clear_filter_str_tmp, {model: opts.model}))
        .on('click.ztree', 'a', function () {
          zTreeObj.checkAllNodes(false); // uncheck all nodes
        });
    }

    function get_show_nodes(show_nodes) {
      if (show_nodes) {
        cur_show = {};
        $.each(show_nodes, function (idx, elem) {
          cur_show[elem.id] = $("<div/>").html(elem.name).text().replace(check_percent_pattern, '');
        });
      }
    }

    function before_expand(treeId, treeNode) {
      if (is_single_expand) {
        var p_node_cur = cur_expand_node ? cur_expand_node.getParentNode() : null;
        var p_node_new = treeNode.parentTId ? treeNode.getParentNode() : null;
        for (var i = 0, l = !p_node_new ? 0 : p_node_new.children.length; i < l; i++) {
          if (treeNode !== p_node_new.children[i]) {
            zTreeObj.expandNode(p_node_new.children[i], false);
          }
        }
        while (p_node_cur) {
          if (p_node_cur === treeNode) {
            break;
          }
          p_node_cur = p_node_cur.getParentNode();
        }
        // if didn't have common parent
        if (!p_node_cur) {
          single_path(treeNode);
        }
      }
    }

    function single_path(new_node) {
      if (new_node === cur_expand_node) {
        return;
      }

      var root_new, root_new_id;

      // first time to expand node
      if (!cur_expand_node) {
        // try to get the root node of new expand node
        root_new = new_node;
        while (root_new) {
          root_new_id = root_new.tId;
          root_new = root_new.getParentNode();
        }
        var root_nodes = zTreeObj.getNodes();
        for (var i = 0, n = root_nodes.length; i < n; i++) {
          var node = root_nodes[i];
          if (node.tId !== root_new_id) {
            zTreeObj.expandNode(node, false);
          }
        }
      } else if (cur_expand_node && cur_expand_node.open) {
        if (new_node.parentTId === cur_expand_node.parentTId) {
          zTreeObj.expandNode(cur_expand_node, false);
        } else {
          var newParents = [];
          while (new_node) {
            new_node = new_node.getParentNode();
            if (new_node === cur_expand_node) {
              newParents = null;
              break;
            } else if (new_node) {
              newParents.push(new_node);
            }
          }
          if (newParents != null) {
            var oldNode = cur_expand_node;
            var oldParents = [];
            while (oldNode) {
              oldNode = oldNode.getParentNode();
              if (oldNode) {
                oldParents.push(oldNode);
              }
            }
            if (newParents.length > 0) {
              zTreeObj.expandNode(oldParents[Math.abs(oldParents.length - newParents.length) - 1], false);
            } else {
              zTreeObj.expandNode(oldParents[oldParents.length - 1], false);
            }
          }
        }
      }
      cur_expand_node = new_node;
    }

    // function filter_children(treeNode) {
    //   return function (node) {
    //     return node.level > treeNode.level;
    //   };
    // }

    function on_right_click(event, treeId, treeNode) {
      if (treeNode === null) {
        var _tid = $(event.target).attr('id').replace(new RegExp(treeId + '_(\\d+)(_.+)?'), '$1');
        if (_tid.length === 0 || !/\d+/.test(_tid)) {
          error_prompt('Right click above node or checkbox.');
        }
        treeNode = zTreeObj.getNodeByTId(_tid);
      }

      if (treeNode && treeNode.isParent) {
        zTreeObj.expandNode(treeNode, !treeNode.open, true);
      }
    }

    function on_click(event, treeId, treeNode) {
      if (zTreeObj.setting.check.enable === true) {
        zTreeObj.checkNode(treeNode, !treeNode.checked, false);
        assignment.call(event.currentTarget, zTreeObj.getCheckedNodes());
        if (zTreeObj.setting.check.chkStyle !== 'checkbox') {
          hide_menu();
        }
      } else {
        assignment.call(event.currentTarget, zTreeObj.getSelectedNodes());
        hide_menu();
      }
    }

    function on_check(event/*, treeId, treeNode*/) {
      assignment.call(event.currentTarget, zTreeObj.getCheckedNodes());
      if (zTreeObj.setting.check.chkStyle !== 'checkbox') {
        hide_menu();
      }
    }

    function hide_menu() {
      // $(".tree-select").removeClass("layui-form-selected");
      // $(".tree-content-filter").fadeOut('fast');
    }

    function assignment(nodes) {
      var that = $(this),
        cur_names = [],
        cur_selected = [],
        search_field = '#' + uniqueId + '_search',
        is_accumulate = $(search_field).val().length !== 0 && zTreeObj.setting.check.chkStyle === 'checkbox',
        cur_show_clone = JSON.parse(JSON.stringify(cur_show));
      //var ids = "";

      for (var i = 0, l = nodes.length; i < l; i++) {
        var a_id = nodes[i].id;
        if (cur_show_clone[a_id]) {
          delete cur_show_clone[a_id];
        }

        if (cur_selected.indexOf(a_id) === -1) {
          cur_selected.push(a_id);
          cur_names.push($("<div/>").html(nodes[i].name).text().replace(check_percent_pattern, ''));
        }
      }
      var existed_filter = opts.filters_group.find('a[data-filter-params*=' + opts.characteristic + ']').eq(0),
        is_existed_filter = existed_filter && existed_filter.length > 0,
        org_filter_params, org_field_repr, total_select, total_names;
      if (is_accumulate) {
        if (is_existed_filter) {
          org_filter_params = decodeURIComponent(existed_filter.data('filter-params'));
          org_field_repr = decodeURIComponent(existed_filter.data('field-repr'));
        } else {
          org_filter_params = '';
          org_field_repr = '';
        }
        if (org_filter_params.length > 0 && org_field_repr.length > 0) {
          var arr = org_filter_params.split('='),
            org_ids = JSON.parse(arr[1]),
            org_names = JSON.parse(org_field_repr);

          if (cur_names.length > 0) { // add
            total_select = org_ids.concat(cur_selected);
            total_names = org_names.concat(cur_names);
          } else {
            $.each(cur_show_clone, function (elem_id, elem_name) {
              var loc = org_names.indexOf(elem_name);
              if (loc !== -1) {
                org_names.splice(loc, 1);
              }
              loc = org_ids.indexOf(parseInt(elem_id));
              if (loc !== -1) {
                org_ids.splice(loc, 1);
              }
            });
            total_select = org_ids;
            total_names = org_names;
          }
        } else {
          total_select = cur_selected;
          total_names = cur_names;
        }
      } else {
        total_select = cur_selected;
        total_names = cur_names;
      }

      var context = {},
        callback = $.fn.prepare_basic_filter_data(that, context);

      context['filter_repr'] = 'in';

      if (is_existed_filter) {
        if (total_select.length === 0 && total_names.length === 0) {
          existed_filter.find('.layui-close').trigger('click');
        } else {
          org_filter_params = existed_filter.data('filter-params');
          var key = org_filter_params.split('=')[0],
            the_span_tag = existed_filter.find('span'),
            span_text = the_span_tag.text(),
            colon_loc = span_text.indexOf(':'),
            prefix_loc = span_text.substring(colon_loc + 1).indexOf(context['filter_repr']),
            need_insert = false, span_repr_prefix, _prefix;

          if (prefix_loc === -1) {
            prefix_loc = colon_loc + 1;
            need_insert = true;
          } else {
            prefix_loc += colon_loc + 1 + context['filter_repr'].length;
          }
          span_repr_prefix = span_text.substring(0, prefix_loc);
          _prefix = span_repr_prefix + (need_insert ? context['filter_repr'] : '') + ' ';
          the_span_tag.text(_prefix + total_names.join(', '));
          existed_filter.data('filter-params', key + '=' + encodeURIComponent(JSON.stringify(total_select)));
          existed_filter.data('field-repr', encodeURIComponent(JSON.stringify(total_names)));
        }
      } else {
        context['filter_params'] = opts.lookup['in'] + '=' + encodeURIComponent(JSON.stringify(total_select));
        context['field_repr'] = encodeURIComponent(JSON.stringify(total_names));

        var f_params = context.filter_params
          .replace($.fn.adminFilters.defaults.extra_trim_pattern, '')
          .replace($.fn.adminFilters.defaults.filter_prefix_pattern, '$1' + context.filter_type + '$2');

        opts.filters_group.append(interject($.fn.get_filter_template(), {
          'field_repr': context.field_repr,
          'filter_text': context.field_name + ': ' + context.filter_repr + ' ' + total_names.join(', '),
          'filter_params': f_params,
          'filter_type': $.fn.adminFilters.defaults.filter_type_dict[context.filter_type]
        }, true));
        $.fn.filter_button('plus', opts.model);
        callback();
      }


      // $tree_to_hide.attr("value", ids);
      $.tree.fixCheckState(zTreeId, {
        all: function () {
          return true;
        }, checked: function (node) {
          return node.checked;
        }, include_parent: true
      });
    }

    var input_type = opts.input_type, is_multiple = true; //!(input_type === 'radio');
    // initSelectTree($(this).attr('id'), is_multiple, input_type);
    init_select_tree.call(this, is_multiple, input_type);
  };

  // used to save constant data(as default value)
  $.fn.zTreeFilter.defaults = {
    selected_template: '<input name="%s" value="%s"/>',
    children_checkbox_type: {"Y": "s", "N": "s"},
    non_children_checkbox_type: {"Y": "", "N": ""},
    $control_panel_all: 'span[data-name=all]',
    $control_panel_children: 'span[data-name=children]'
  };
})(jQuery);
