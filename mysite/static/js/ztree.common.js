(function ($) {
  $.tree = {};
  $.extend(
    $.tree, {
      _check_box_cascade: function (setting, type, parent_or_child) {
        var v = setting['check']['chkboxType'][type];
        if (v.indexOf(parent_or_child) === -1) {
          v = parent_or_child + v;
        }
        setting['check']['chkboxType'][type] = v;
      },

      getZTreeSetting: function (attr) {
        // defaul setting with check
        var mode = 'sync',
          check_style = null,
          parent_cascade = false,
          children_cascade = false;

        if (typeof attr === 'object') {
          if (attr.hasOwnProperty('mode')) {
            mode = attr.mode;
          }

          if (attr.hasOwnProperty('checkStyle')) {
            check_style = attr.checkStyle;
          }
          if (attr.hasOwnProperty('parentCascade')) {
            parent_cascade = attr.parentCascade;
          }
          if (attr.hasOwnProperty('childrenCascade')) {
            children_cascade = attr.childrenCascade;
          }
        }

        var default_sync_setting = {
          data: {
            simpleData: {
              enable: true, idKey: "id", pIdKey: "pid", rootPId: 0
            }
          }
        };
        var setting = {};
        if (mode === 'sync') {
          setting = default_sync_setting;
          if (typeof attr === 'object' && attr.hasOwnProperty('setting')) {
            setting = $.extend(setting, attr.setting);
          }
        } else {
          // console.log(typeof attr, attr.hasOwnProperty('setting'), attr.setting);
          if (typeof attr === 'object' && attr.hasOwnProperty('setting')) {
            setting = $.extend(setting, attr.setting);
          }

        }
        if (check_style) {
          setting['check'] = {
            enable: true,
            chkStyle: "checkbox",
            chkboxType: {"Y": "", "N": ""}
          };
          if (parent_cascade) {
            $.tree._check_box_cascade(setting, 'Y', 'p');
            $.tree._check_box_cascade(setting, 'N', 'p');
          }
          if (children_cascade) {
            $.tree._check_box_cascade(setting, 'Y', 's');
            $.tree._check_box_cascade(setting, 'N', 's');
          }
        }
        // console.log('#setting', setting, attr, mode);
        return setting;
      }, all_leaf_nodes_filter_generator: function (cond) {
        if (cond === undefined) {
          cond = true;
        }
        return function (node) {
          return !node.isParent && cond;
        };
      }, checked_leaf_nodes_filter_generator: function () {
        return function (node) {
          return !node.isParent && node.checked;
        };
      }, clickHandlerWrap: function (field) {
        return function (event, treeId, treeNode) {
          // console.log('zTreeObjID', treeId);
          var zTree = $.fn.zTree.getZTreeObj(treeId);
          if (zTree.setting.check.enable === true) {
            // 若当前树结点未选中的话，将其选中；否则取消选中
            // 第三个参数表示联动处理父结点
            zTree.checkNode(treeNode, !treeNode.checked, true);
            $.tree.sync_to_select_field(field, zTree, treeNode);
          }
        };
      },
      checkHandlerWrap: function (field) {
        return function (event, treeId, treeNode) {
          var zTree = $.fn.zTree.getZTreeObj(treeId);
          $.tree.sync_to_select_field(field, zTree, treeNode);
        };
      },

      sync_to_select_field: function (field, zTree, treeNode) {
        // console.log('treeNode', treeNode);
        if (!treeNode.isParent) {
          // console.log('#', treeNode.checked ? 'add' : 'del', treeNode.id);
          field.children(interject('option[value={}]', [treeNode.id])).prop('selected', treeNode.checked);
        } else {
          /**
           * @desc 获取当前选中的虚拟结点的下属子结点
           * @param filter -> children_filter search all children node
           * @param isSingle -> false means: search the array of the nodes
           * @param Specific the search range, you can search node from a parent node's child nodes.
           */
          var allChildren = zTree.getNodesByFilter($.tree.all_leaf_nodes_filter_generator(), false, treeNode);
          allChildren.push(treeNode);
          allChildren.forEach(function (tNode/*, i*/) {
            // console.log('#', treeNode.checked ? 'add' : 'del', tNode.id);
            field.children(interject('option[value={}]', [tNode.id])).prop('selected', treeNode.checked);
          });
        }
      },
      autoLoadNode: function (maxLevel, alternativeDOM) {
        return function (event, treeId, treeNode, msg) {
          if (msg === null || msg === 'null') {
            // console.log(msg, alternativeDOM);
            alternativeDOM.parent().show();
          }
          if (treeNode && treeNode.level >= maxLevel - 1) {
            return;
          }
          var zTreeObj = $.fn.zTree.getZTreeObj(treeId);
          var i, n, node;
          // 加载根节点时，treeNode 是不存在的，所以一定要做处理
          var nodes = treeNode ? treeNode.children : zTreeObj.getNodes();
          for (i = 0, n = nodes.length; i < n; i++) {
            node = nodes[i];
            if (node.isParent) {
              // 自动展开
              // zTreeObj.expandNode(node, true, false, false);
              // 只自动加载
              zTreeObj.reAsyncChildNodes(node, "refresh", true);
            }
          }
        };
      },
      /**
       * @param zTreeId: the ztree id that used to get the ztree object
       * @param searchField: the selector of input field for fuzzy search
       * @param options
       *  * is_highlight: whether highlight the match words, default true
       *  * is_expand whether to expand the node, default false
       *  * has_percent: whether to record check/all percent
       *
       * @returns
       */
      nodeFuzzySearch: function fuzzy_search(zTreeId, searchField, options) {
        var is_highlight = true, // default true, only use false to disable highlight
          is_expand = false,
          has_percent = false,
          callback = null,  // not to expand in default
          percent_pattern = /\s*(\(\d+\/\d+\))$/;
        if (options) {
          is_highlight = !!options['highlight'];
          is_expand = !!options['expand'];
          has_percent = !!options['percent'];
          callback = options['callback'];
        }

        var zTreeObj = $.fn.zTree.getZTreeObj(zTreeId);  // get the ztree object by ztree id
        if (!zTreeObj) {
          layer.alert("Fail to get ztree object");
        }
        var nameKey = zTreeObj.setting.data.key.name; //get the key of the node name
        // is_highlight = is_highlight !== false;
        // is_expand = !!is_expand;
        zTreeObj.setting.view.nameIsHTML = is_highlight; //allow use html in node name for highlight use

        var metaChar = '[\\[\\]\\\\\^\\$\\.\\|\\?\\*\\+\\(\\)]'; //js meta characters
        var rexMeta = new RegExp(metaChar, 'gi');//regular expression to match meta characters

        // keywords filter function
        function ztree_node_filter(tree_obj, _keywords, callback) {
          if (!_keywords) {
            _keywords = ''; //default blank for _keywords
          }

          // function to find the matching node
          function filter_func(node) {
            if (node && node.oldname && node.oldname.length > 0) {
              node[nameKey] = node.oldname; //recover oldname of the node if exist
            }
            var node_name = node[nameKey],
              percent = '';
            if (has_percent && node.isParent && node_name) {
              var match = percent_pattern.exec(node_name);
              if (match) {
                percent = match[0];
                node_name = node_name.replace(percent_pattern, '');
              }
            }
            tree_obj.updateNode(node); //update node to for modifications take effect
            if (_keywords.length === 0) {
              //return true to show all nodes if the keyword is blank
              tree_obj.showNode(node);
              tree_obj.expandNode(node, is_expand);
              return true;
            }
            //transform node name and keywords to lowercase
            if (node_name && node_name.toLowerCase().indexOf(_keywords.toLowerCase()) !== -1) {
              if (is_highlight) { //highlight process
                //a new variable 'newKeywords' created to store the keywords information
                //keep the parameter '_keywords' as initial and it will be used in next node
                //process the meta characters in _keywords thus the RegExp can be correctly used in str.replace
                var newKeywords = _keywords.replace(rexMeta, function (matchStr) {
                  //add escape character before meta characters
                  return '\\' + matchStr;
                });
                node.oldname = node_name + percent; //store the old name
                var rexGlobal = new RegExp(newKeywords, 'gi');//'g' for global,'i' for ignore case
                // use replace(RegExp,replacement) since replace(/substr/g,replacement) cannot be used here
                node[nameKey] = node_name.replace(rexGlobal, function (originalText) {
                  // highlight the matching words in node name
                  return '<span style="color: #fff;background-color: #5fb878;">' + originalText + '</span>';
                }) + percent;
                tree_obj.updateNode(node); //update node for modifications take effect
              }
              tree_obj.showNode(node);//show node with matching keywords
              return true; //return true and show this node
            }

            tree_obj.hideNode(node); // hide node that not matched
            return false; //return false for node not matched
          }

          var nodesShow = tree_obj.getNodesByFilter(filter_func); //get all nodes that would be shown
          process_show_nodes(nodesShow, _keywords, callback);//nodes should be reprocessed to show correctly
        }

        /**
         * reprocess of nodes before showing
         */
        function process_show_nodes(nodesShow, _keywords) {
          var path_list = [];
          if (nodesShow && nodesShow.length > 0) {
            //process the ancient nodes if _keywords is not blank
            if (_keywords.length > 0) {
              $.each(nodesShow, function (n, obj) {
                var pathOfOne = obj.getPath();//get all the ancient nodes including current node
                if (pathOfOne && pathOfOne.length > 0) {
                  //i < pathOfOne.length-1 process every node in path except self
                  for (var i = 0; i < pathOfOne.length - 1; i++) {
                    path_list.push(pathOfOne[i]);
                    zTreeObj.showNode(pathOfOne[i]); //show node
                    zTreeObj.expandNode(pathOfOne[i], true); //expand node
                  }
                }
                obj && path_list.push(obj);
              });
            } else { //show all nodes when _keywords is blank and expand the root nodes
              var rootNodes = zTreeObj.getNodesByParam('level', '0');//get all root nodes
              $.each(rootNodes, function (n, obj) {
                zTreeObj.expandNode(obj, true); //expand all root nodes
              });
            }
          }
          if (callback !== undefined && typeof callback === 'function') {
            callback(path_list);
          }
        }

        //listen to change in input element
        $(searchField).bind('input propertychange change', function () {
          var _keywords = $(this).val();
          search_node_lazy(_keywords, callback); //call lazy load
        });

        var timeoutId = null;

        // execute lazy load once after input change, the last pending task will be cancled
        function search_node_lazy(_keywords, callback) {
          if (timeoutId) {
            //clear pending task
            clearTimeout(timeoutId);
          }
          timeoutId = setTimeout(function () {
            ztree_node_filter(zTreeObj, _keywords, callback); //lazy load ztreeFilter function
            $(searchField).focus();//focus input field again after filtering
          }, 500);
        }
      }, fixCheckState: function fix_check_state(zTreeId, options) {
        var zTreeObj = null, parentList, parent, count = 0, checked_count,
          filter_all, filter_checked, include_parent;

        if (typeof zTreeId === 'string') {
          zTreeObj = $.fn.zTree.getZTreeObj(zTreeId);
        } else {
          zTreeObj = zTreeId;
        }

        if (options) {
          filter_all = options['all'];
          filter_checked = options['checked'];
          include_parent = options['include_parent'];
        }
        if (!filter_all) {
          filter_all = $.tree.all_leaf_nodes_filter_generator();
        }
        if (!filter_checked) {
          filter_checked = $.tree.checked_leaf_nodes_filter_generator();
        }
        include_parent = !!include_parent;

        parentList = zTreeObj.getNodesByParam('isParent', true);

        for (var i = parentList.length - 1; i >= 0; i--) {
          parent = parentList[i];
          var all_checked_children = zTreeObj.getNodesByFilter(filter_checked, false, parent);

          // console.log('all_checked_children', all_checked_children);
          if (!parent.children) {
            count = 0;
          }
          // count = zTreeObj.transformToArray(parent.children).length;
          count = zTreeObj.getNodesByFilter(filter_all, false, parent).length;
          checked_count = all_checked_children.length;

          // srcName 的作用就是把原始的节点数据获取到，为了便于在编辑时动态更换数量
          if (!parent.srcName) {
            parent.srcName = parent.name;
          }
          if (count === checked_count) {
            // 去除选择了所以子节点后父节点自动被勾选功能
            // zTreeObj.checkNode(parent, true, true, false);
          }
          if (include_parent) {
            count += 1;
            if (parent.checked) {
              checked_count += 1;
            }
          }

          parent.name = interpolate('%(source_name)s (%(checked)s/%(all)s)', {
            'source_name': parent.srcName,
            'checked': checked_count,
            'all': count
          });
          zTreeObj.updateNode(parent);
        }
      }
    }
  );
})(jQuery);
