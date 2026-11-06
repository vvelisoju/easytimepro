layui.define(function (exports) {
    $ = layui.jquery;
    var autoColumnWidth = {
        resize: function () {
            var cols, showOverflowX;

            /**
             * 列对象
             * @param index 所在列在当前行中的索引位置（没用上可以不要）
             * @param name 对应表头中设置的field
             * @param minWidth 对象表头中的minWidth
             * @param width 最终的宽度
             * @constructor
             */
            function Column(index, name, minWidth, width) {
                this.index = index;
                this.name = name;
                this.minWidth = minWidth;
                this.width = width;
            }

            /**
             * 计算列宽
             * @param columns column对象数组
             * @param colNum 列数
             * @param tabWidth 表格宽度
             * @param avgWidth 平均宽度
             */
            function calculateColumnWidth(columns, colNum, tabWidth, avgWidth) {
                showOverflowX = false;
                var isComplete = false;
                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
                    if (column["minWidth"] <= avgWidth || isComplete) {
                        column["width"] = parseInt(avgWidth);
                        isComplete = true;
                    } else {
                        column["width"] = column["minWidth"];
                        tabWidth -= column["minWidth"];
                        colNum -= 1;
                        avgWidth = tabWidth / colNum;
                        if (i === columns.length - 1) {
                            showOverflowX = true;
                        }
                    }
                }
            }

            // 表格宽度
            var tabWidth = $(".layui-table-header").width();
            // 列数
            var colNum = $("tr").eq(0).find("th").length;
            // 平均列宽
            var avgWidth = tabWidth / colNum;

            if (cols === undefined) {
                cols = $("tr").eq(0).find("th").map(function (index, item) {
                    var col = new Column(index, $(this).attr("data-field"), $(this).attr("data-minwidth"));
                    return col;
                });
                cols.sort(function (a, b) {
                    return b["minWidth"] - a["minWidth"];
                });
            }

            calculateColumnWidth(cols, colNum, tabWidth, avgWidth);

            for (var i = 0; i < cols.length; i++) {
                var col = cols[i];
                var width = cols[i].width;
                $("[data-field='" + cols[i]["name"] + "']").each(function () {
                    $(this).children().eq(0).animate({width: width}, 200);
                })
            }

            if (showOverflowX) {
                $('.layui-table-body').css({"overflow-x": "auto"});
            } else {
                $('.layui-table-body').css({"overflow-x": "hidden"});
            }
        }
    };
    exports("autoColumnWidth", autoColumnWidth);
});
