/**
 * Created by Arvin on 2018-08-08.
 */
var pandemic_graph_data = [];
$(function () {
    $.fn.dashboard_timer = {
        'refreshFull': null,
        'refreshPie': refreshPie,
        'refreshMonitor': refreshMonitor,
        'refreshException':refreshException,
        'refreshTemp': null,
        'refreshMask': null,
        'refreshBaseCrard':refreshBaseCrard,
        'dashboardRefresh':dashboardRefresh,
        'dashboardRefreshID':null,
        'refreshBaseCrardID':refreshBaseCrard,
        'refreshPieID': null,



    };
    var timer_map = $.fn.dashboard_timer;
    var department_icon = 'M109.634,164.452c20.179,0,37.402-7.135,51.674-21.411c14.277-14.275,21.416-31.503,21.416-51.678    c0-20.173-7.139-37.401-21.416-51.678c-14.272-14.275-31.496-21.414-51.674-21.414c-20.177,0-37.401,7.139-51.676,21.414    C43.684,53.962,36.545,71.186,36.545,91.363c0,20.179,7.139,37.403,21.413,51.678C72.233,157.313,89.457,164.452,109.634,164.452z    M196.569,278.519c21.413,21.406,47.248,32.114,77.516,32.114c30.269,0,56.103-10.708,77.515-32.114    c21.409-21.42,32.117-47.258,32.117-77.52c0-30.264-10.708-56.101-32.117-77.515c-21.412-21.414-47.246-32.121-77.515-32.121    c-30.268,0-56.105,10.709-77.516,32.121c-21.411,21.411-32.12,47.248-32.12,77.515S175.158,257.102,196.569,278.519zM438.543,164.452c20.17,0,37.397-7.135,51.671-21.411c14.274-14.275,21.409-31.503,21.409-51.678    c0-20.173-7.135-37.401-21.409-51.678c-14.273-14.275-31.501-21.414-51.671-21.414c-20.184,0-37.407,7.139-51.682,21.414    c-14.271,14.277-21.409,31.501-21.409,51.678c0,20.179,7.139,37.403,21.409,51.678    C401.136,157.313,418.359,164.452,438.543,164.452zM512.763,164.456c-1.136,0-5.276,1.999-12.415,5.996c-7.132,3.999-16.416,8.044-27.833,12.137    c-11.416,4.089-22.747,6.136-33.972,6.136c-12.758,0-25.406-2.187-37.973-6.567c0.945,7.039,1.424,13.322,1.424,18.842    c0,26.457-7.71,50.819-23.134,73.089c30.841,0.955,56.056,13.134,75.668,36.552h38.256c15.605,0,28.739-3.863,39.396-11.57    c10.657-7.703,15.989-18.986,15.989-33.83C548.172,198.047,536.376,164.452,512.763,164.456zM470.096,395.284c-1.999-11.136-4.524-21.464-7.57-30.978c-3.046-9.521-7.139-18.794-12.271-27.836    c-5.141-9.034-11.044-16.748-17.706-23.127c-6.667-6.379-14.805-11.464-24.414-15.276c-9.609-3.806-20.225-5.708-31.833-5.708    c-1.906,0-5.996,2.047-12.278,6.14c-6.283,4.089-13.224,8.665-20.841,13.702c-7.615,5.037-17.789,9.609-30.55,13.702    c-12.762,4.093-25.608,6.14-38.544,6.14c-12.941,0-25.791-2.047-38.544-6.14c-12.756-4.093-22.936-8.665-30.55-13.702    c-7.616-5.037-14.561-9.613-20.841-13.702c-6.283-4.093-10.373-6.14-12.279-6.14c-11.609,0-22.22,1.902-31.833,5.708    c-9.613,3.812-17.749,8.897-24.41,15.276c-6.667,6.372-12.562,14.093-17.705,23.127c-5.137,9.042-9.229,18.315-12.275,27.836    c-3.045,9.514-5.564,19.842-7.566,30.978c-2,11.136-3.331,21.505-3.997,31.121c-0.667,9.613-0.999,19.466-0.999,29.554    c0,22.836,6.945,40.874,20.839,54.098c13.899,13.223,32.363,19.842,55.389,19.842h249.535c23.028,0,41.49-6.619,55.392-19.842    c13.894-13.224,20.841-31.262,20.841-54.098c0-10.088-0.335-19.938-0.992-29.554C473.418,416.789,472.087,406.419,470.096,395.284    zM169.303,274.088c-15.418-22.27-23.125-46.632-23.122-73.089c0-5.52,0.477-11.799,1.427-18.842    c-12.564,4.377-25.221,6.567-37.974,6.567c-11.23,0-22.552-2.046-33.974-6.136c-11.417-4.093-20.699-8.138-27.834-12.137    c-7.138-3.997-11.281-5.996-12.422-5.996C11.801,164.456,0,198.051,0,265.24c0,14.844,5.33,26.127,15.987,33.83    c10.66,7.707,23.794,11.563,39.397,11.563h38.26C113.251,287.222,138.467,275.042,169.303,274.088z';
    var area_icon = 'M503.639,336.899c-5.328-5.328-11.8-7.994-19.417-7.994h-27.405v-54.819c0-9.896-3.617-18.466-10.848-25.695   c-7.231-7.236-15.804-10.852-25.7-10.852H274.091v-54.818h27.404c7.618,0,14.089-2.664,19.417-7.994   c5.329-5.327,7.991-11.798,7.991-19.414v-91.36c0-7.614-2.662-14.087-7.991-19.414c-5.328-5.33-11.799-7.993-19.417-7.993h-91.361   c-7.614,0-14.084,2.663-19.414,7.993c-5.33,5.327-7.992,11.799-7.992,19.414v91.36c0,7.616,2.662,14.084,7.992,19.414   c5.327,5.33,11.8,7.994,19.414,7.994h27.408v54.818H91.363c-9.898,0-18.462,3.619-25.697,10.852   c-7.233,7.229-10.848,15.799-10.848,25.695v54.819H27.406c-7.611,0-14.084,2.666-19.414,7.994C2.663,342.229,0,348.696,0,356.313   v91.358c0,7.617,2.663,14.089,7.992,19.417c5.33,5.328,11.803,7.991,19.414,7.991h91.365c7.611,0,14.084-2.666,19.414-7.991   c5.33-5.328,7.992-11.8,7.992-19.417v-91.358c0-7.617-2.662-14.085-7.992-19.414c-5.33-5.328-11.803-7.994-19.414-7.994H91.36   v-54.819h146.179v54.819h-27.408c-7.614,0-14.084,2.666-19.414,7.994c-5.33,5.329-7.992,11.797-7.992,19.414v91.358   c0,7.617,2.662,14.089,7.992,19.417c5.327,5.328,11.8,7.991,19.414,7.991h91.361c7.618,0,14.086-2.666,19.418-7.991   c5.325-5.332,7.994-11.8,7.994-19.417v-91.358c0-7.617-2.662-14.085-7.994-19.414c-5.332-5.328-11.8-7.994-19.418-7.994h-27.404   v-54.819h146.182v54.819h-27.412c-7.61,0-14.086,2.666-19.417,7.994c-5.325,5.329-7.987,11.797-7.987,19.414v91.358   c0,7.617,2.662,14.089,7.987,19.417c5.331,5.328,11.807,7.991,19.417,7.991h91.365c7.61,0,14.082-2.666,19.41-7.991   c5.332-5.328,7.994-11.8,7.994-19.417v-91.358C511.626,348.696,508.964,342.229,503.639,336.899z';//图标
    function refresh(refresh_type) {
        $.ajax({
            url: '/worktable/backend_refresh/',
            type: 'POST',
            data: {'dashboard': refresh_type},
            dataType: 'json',
            success: function (data) {
                var option = {
                    title: gettext("refresh_tip"),
                    icon: 1,
                    btn: [],
                    //shade: 0,
                    success: function (layero) {
                        parent.layer.setTop(layero);
                    }
                };
                if (data === "OK") {
                    parent.layer.alert(gettext("please_refresh_the_page_again"), option)
                } else {
                    parent.layer.alert(data, option)
                }
            },
            error: function () {

            },
            complete: function (XHR, TS) {
                XHR = null;
            }
        });
    }

    var window_size = ['290px', '320px'];
    var pChartContainer = document.getElementById('chartDeviceStatus');
    var cChartContainer = document.getElementById('chartCompare');
    var acChartContainer = document.getElementById('areaCapacity');
    // var maskChartContainer = document.getElementById('chartMaskStatus');
    //用于使chart自适应高度和宽度,通过窗体高宽计算容器高宽
    var dTable = document.getElementById('dashboard-table');
    // var tempTable = document.getElementById('dashboard-table-temp');
    var resizeWorldMapContainer = function () {
        //pChartContainer.style.width = window.innerWidth+'px';
        var avg = (window.innerHeight - 175) / 2 + 'px';
        pChartContainer.style.height = avg;
        cChartContainer.style.height = avg;
        acChartContainer.style.height = avg;
        // maskChartContainer.style.height = avg;
        dTable.style.height = avg;
        // tempTable.style.height = avg;
    };
    //set container height weight
    resizeWorldMapContainer();
    //init for td/md dashboard and hide
    var td_md_dashboard = $("#md_td_dashboard");
    td_md_dashboard.removeClass("layui-hide");
    // var tempChart = echarts.init(document.getElementById('chartTempStatus'));
    // var maskChart = echarts.init(document.getElementById('chartMaskStatus'));
    td_md_dashboard.addClass("layui-hide");
    //device status pie chart start
    var pChart = echarts.init(document.getElementById('chartDeviceStatus'));
    var pDepartments = [];
    var pAreas = [];
    var pie_opt = {
        title: {
            text: '',
            subtext: '',
            x: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        toolbox: {
            showTitle: false,
            feature: {
                myRefresh: {
                    show: true,
                    icon: 'M3.8,33.4 M47,18.9h9.8V8.7 M56.3,20.1 C52.1,9,40.5,0.6,26.8,2.1C12.6,3.7,1.6,16.2,2.1,30.6 M13,41.1H3.1v10.2 M3.7,39.9c4.2,11.1,15.8,19.5,29.5,18 c14.2-1.6,25.2-14.1,24.7-28.5',
                    onclick: function () {
                        // refresh('m');
                        refreshPie();
                    }
                },
                saveAsImage: {show: true}
            }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: ['Online', 'Offline']
        },
        series: [
            {
                name: '',
                type: 'pie',
                radius: '55%',
                center: ['50%', '60%'],
                data: [
                    {
                        name: 'Online',
                        value: 0,
                        itemStyle: {color: '#32CD32', shadowBlur: 100, shadowColor: 'rgba(0, 0, 0, 0.5)'}
                    },
                    {
                        name: 'Offline',
                        value: 0,
                        itemStyle: {color: '#FF6347', shadowBlur: 100, shadowColor: 'rgba(0, 0, 0, 0.5)'}
                    }
                ],
                itemStyle: {
                    normal: {
                        label: {
                            show: true,
                            formatter: '{b} ({c})'
                        },
                        labelLine: {show: true}
                    }
                }
            }
        ]
    };
    //pChart.showLoading({
    //    text: gettext('loading...')
    //});
    pChart.setOption(pie_opt);
    pChart.on('click', function (params) {
        var url = '/base/dashboard_offline/';
        if (params.dataIndex == 0) {
            url = '/base/dashboard_online/';
        }
        layer.open({
            title: params.data.name,
            type: 2,
            area: ['980px', '600px'],
            fixed: false, //不固定
            maxmin: true,
            content: url
        });
    });

    function refreshPie() {
        if ($("#dashboard").hasClass('layui-hide')) {
            return false;
        }
        if (!$("#pandemic").hasClass("d-none")) {
            return false;
        }


        var url = '/iclock/dashboard_device_status/';
        var csrf = $("input[name=csrfmiddlewaretoken]").val();
        $.ajax({
            url: url,
            type: 'POST',
            traditional: true,
            data: {csrfmiddlewaretoken: csrf, Department: pDepartments, Area: pAreas, dashboard: 'p'},
            dataType: 'json',
            success: function (data) {
                var pOpt = $.extend(true, {}, pie_opt);
                $.extend(pOpt, data);
                pChart.setOption(pOpt);
                //pChart.hideLoading();
                timer_map['refreshPieID'] = window.setTimeout(refreshPie, 30000);
            },
            error: function () {
                pChart.hideLoading();
                 window.setTimeout(refreshPie, 30000);
            },
            complete: function (XHR, TS) {
                XHR = null;
            }
        });
    }

    //device status pie chart end
    //temp pie chart start
    var temp_opt = {
        title: {
            text: gettext('dashboard_temp_status'),
            subtext: '',
            x: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)'
        },
        toolbox: {
            showTitle: false,
            feature: {
                myRefresh: {
                    show: true,
                    icon: 'M3.8,33.4 M47,18.9h9.8V8.7 M56.3,20.1 C52.1,9,40.5,0.6,26.8,2.1C12.6,3.7,1.6,16.2,2.1,30.6 M13,41.1H3.1v10.2 M3.7,39.9c4.2,11.1,15.8,19.5,29.5,18 c14.2-1.6,25.2-14.1,24.7-28.5',
                    onclick: function () {
                        refreshTemp();
                    }
                },
                saveAsImage: {show: true}
            }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: [gettext('dashboard_high_temp'), gettext('dashboard_warning'), gettext('dashboard_normal')]
        },
        series: [
            {
                name: '',
                type: 'pie',
                radius: '55%',
                center: ['50%', '60%'],
                data: [
                    {name: gettext('dashboard_high_temp'), value: 0, itemStyle: {color: '#fc97af'}},
                    {name: gettext('dashboard_warning'), value: 0, itemStyle: {color: '#ffb980'}},
                    {name: gettext('dashboard_normal'), value: 0, itemStyle: {color: '#87f7cf'}}
                ],
                itemStyle: {
                    normal: {
                        label: {
                            show: true,
                            formatter: '{b} ({c})'
                        },
                        labelLine: {show: true}
                    }
                }
            }
        ]
    };

    // tempChart.setOption(temp_opt);
    function refreshTemp() {
        if ($("#dashboard").hasClass('layui-hide')) {
            return false;
        }
        if ($("#pandemic").hasClass("d-none")) {
            return false;
        }
        var url = '/iclock/dashboard_card_temp/';
        var csrf = $("input[name=csrfmiddlewaretoken]", "#dashboard").val();
        $.ajax({
            url: url,
            type: 'POST',
            traditional: true,
            data: {csrfmiddlewaretoken: csrf},
            dataType: 'json',
            success: function (datas) {
                var card_datas = datas.card_datas;
                var other_datas = datas.other_datas;
                pandemic_graph_data = [['Temprature', 'value'],
                    ['High Temprature', card_datas['high_temp_count']],
                    ['Warning', card_datas['warning_count']],
                    ['Normal', card_datas['normal_count']],
                    ['No Mask', card_datas['no_mask_count']],
                    [null, (card_datas['high_temp_count'] + card_datas['warning_count'] + card_datas['normal_count'] + card_datas['no_mask_count'])]];

                $('#high-temp-per').attr('data-value', percentage(card_datas['high_temp_count'], card_datas['td_md_empcount']));
                $('#warning-per').attr('data-value', percentage(card_datas['warning_count'], card_datas['td_md_empcount']));
                $('#normal-per').attr('data-value', percentage(card_datas['normal_count'], card_datas['td_md_empcount']));
                $('#no-mask-per').attr('data-value', percentage(card_datas['no_mask_count'], card_datas['td_md_empcount']));
                $('#high-temp-per1').text(percentage(card_datas['high_temp_count'], card_datas['td_md_empcount']) + '%');
                $('#warning-per1').text(percentage(card_datas['warning_count'], card_datas['td_md_empcount']) + '%');
                $('#normal-per1').text(percentage(card_datas['normal_count'], card_datas['td_md_empcount']) + '%');
                $('#no-mask-per1').text(percentage(card_datas['no_mask_count'], card_datas['td_md_empcount']) + '%');
                $(".progress").each(function () {
                    var value = $(this).attr('data-value');
                    var left = $(this).find('.progress-left .progress-bar');
                    var right = $(this).find('.progress-right .progress-bar');
                    if (value > 0) {
                        if (value <= 50) {
                            right.css('transform', 'rotate(' + percentageToDegrees(value) + 'deg)');
                            right.css('transition', 'all 3s');

                        } else {
                            right.css('transform', 'rotate(180deg)');
                            left.css('transform', 'rotate(' + percentageToDegrees(value - 50) + 'deg)');
                            left.css('transition', 'all 3s');
                        }
                    }

                })

                function percentageToDegrees(percentage) {
                    return percentage / 100 * 360
                }

                function percentage(percent, total) {
                    var percentageValue;
                    if (percent > 0 && total > 0) {
                        if (((percent * 100) / total) < 1) {
                            percentageValue = ((percent * 100) / total).toFixed(2);
                        } else {
                            percentageValue = ((percent * 100) / total).toFixed(0);
                        }
                    } else {
                        percentageValue = 0;
                    }
                    return percentageValue
                }

                for (var detail in card_datas) {
                    $('#' + detail).text(card_datas[detail]);
                }
                timer_map['refreshTemp'] = window.setTimeout(refreshTemp, 60000);
                // // fill all dashboard cards
                // for(var detail in card_datas){
                //   $('#' + detail).text(card_datas[detail])
                // }
                // //set temp pie chart
                // temp_opt.series[0]['data'][0]['value'] = card_datas['high_temp_count'];
                // temp_opt.series[0]['data'][1]['value'] = card_datas['warning_count'];
                // temp_opt.series[0]['data'][2]['value'] = card_datas['normal_count'];
                // // tempChart.setOption(temp_opt);
                // //set mask pie chart
                // mask_opt.series[0]['data'][0]['value'] = card_datas['no_mask_count'];
                // mask_opt.series[0]['data'][1]['value'] = other_datas['masked_count'];
                // maskChart.setOption(mask_opt);
            },
            error: function () {

                timer_map['refreshTemp'] = window.setTimeout(refreshTemp, 600000);
            },
            complete: function (XHR, TS) {
                if (TS === 'timeout') {
 
                    refreshTemp()
                }
                XHR = null;
            }
        });
    }

   // refreshTemp()
    // temp pie chart end
    // mask pie chart start
    var mask_opt = {
        title: {
            text: gettext('dashboard_mask_status'),
            subtext: '',
            x: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        toolbox: {
            showTitle: false,
            feature: {
                myRefresh: {
                    show: true,
                    icon: 'M3.8,33.4 M47,18.9h9.8V8.7 M56.3,20.1 C52.1,9,40.5,0.6,26.8,2.1C12.6,3.7,1.6,16.2,2.1,30.6 M13,41.1H3.1v10.2 M3.7,39.9c4.2,11.1,15.8,19.5,29.5,18 c14.2-1.6,25.2-14.1,24.7-28.5',
                    onclick: function () {
                        refreshMask();
                    }
                },
                saveAsImage: {show: true}
            }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: [gettext('dashboard_no_mask'), gettext('dashboard_masked')]
        },
        series: [
            {
                name: '',
                type: 'pie',
                radius: '55%',
                center: ['50%', '60%'],
                data: [
                    {name: gettext('dashboard_no_mask'), value: 0, itemStyle: {color: '#b6a2de'}},
                    {name: gettext('dashboard_masked'), value: 0, itemStyle: {color: '#2ec7c9'}}
                ],
                itemStyle: {
                    normal: {
                        label: {
                            show: true,
                            formatter: '{b} ({c})'
                        },
                        labelLine: {show: true}
                    }
                }
            }
        ]
    };

    // maskChart.setOption(mask_opt);
    function refreshMask() {
        if ($("#dashboard").hasClass('layui-hide')) {
            return false;
        }
    
        if ($("#pandemic").hasClass("d-none")) {
            return false;
        }

        var url = '/iclock/dashboard_card_temp/';
        var csrf = $("input[name=csrfmiddlewaretoken]", "#dashboard").val();
        $.ajax({
            url: url,
            type: 'POST',
            traditional: true,
            data: {csrfmiddlewaretoken: csrf},
            dataType: 'json',
            success: function (datas) {
                var card_datas = datas.card_datas;
                var other_datas = datas.other_datas;
                // fill all dashboard cards
                for (var detail in card_datas) {
                    $('#' + detail).text(card_datas[detail])
                }
                //set temp pie chart
                temp_opt.series[0]['data'][0]['value'] = card_datas['high_temp_count'];
                temp_opt.series[0]['data'][1]['value'] = card_datas['warning_count'];
                temp_opt.series[0]['data'][2]['value'] = card_datas['normal_count'];
                tempChart.setOption(temp_opt);
                //set mask pie chart
                mask_opt.series[0]['data'][0]['value'] = card_datas['no_mask_count'];
                mask_opt.series[0]['data'][1]['value'] = other_datas['masked_count'];
                maskChart.setOption(mask_opt);
            },
            complete: function (XHR, TS) {
                XHR = null;
            }
        });
    }

    //mask pie chart end
    //
    var cChart = echarts.init(document.getElementById('chartCompare'));
    var eDepartments = [];
    var eAreas = [];
    var now = new Date();
    var timeArr = [];
    var dataArr = [];
    var rdataHeads = [];
    var rdataArr = [];
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    for (var i = 0; i < now.getDate(); i++) {
        var d = i + 1;
        timeArr.push(year + "-" + month + "-" + d);
        dataArr.push(0);
    }
    var total_mins = now.getHours() * 60 + now.getMinutes();
    for (var j = 0; j < total_mins; j++) {
        rdataHeads.push((('00' + parseInt(j / 60)).slice(-2) + ':' + ('00' + parseInt(j % 60)).slice(-2)));
        rdataArr.push(0)
    }
    ;

    var option = {
        title: {
            text: gettext('dashboard_exception'),
            subtext: gettext('dashboard_history'),
            left: 0
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line'
            }
        },
        toolbox: {
            showTitle: false,
            feature: {
                myRefresh: {
                    show: true,
                    icon: 'M3.8,33.4 M47,18.9h9.8V8.7 M56.3,20.1 C52.1,9,40.5,0.6,26.8,2.1C12.6,3.7,1.6,16.2,2.1,30.6 M13,41.1H3.1v10.2 M3.7,39.9c4.2,11.1,15.8,19.5,29.5,18 c14.2-1.6,25.2-14.1,24.7-28.5',
                    onclick: function () {
                        // refresh('e');
                        refreshException();
                    }
                },
                magicType: {type: ['line', 'bar']},
                saveAsImage: {show: true}
            }
        },
        legend: {
            //data: []
            data: [gettext('chart_late'), gettext('chart_early_leave'), gettext('chart_absent')]
        },
        grid: {
            left: '5%',
            right: '10%',
            bottom: '20%'
        },
        xAxis: {
            type: 'category',
            //data: [],
            data: timeArr,
            scale: true,
            boundaryGap: false,
            axisLine: {onZero: false},
            splitLine: {show: false},
            splitNumber: 20,
            min: 'dataMin',
            max: 'dataMax'
        },
        yAxis: {
            scale: true,
            splitArea: {
                show: true
            }
        },
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100
            },
            {
                show: true,
                type: 'slider',
                y: '90%',
                start: 50,
                end: 100
            }
        ],
        series: [
            {
                name: gettext('chart_late'),
                type: 'line',
                data: dataArr,
                smooth: true,
                lineStyle: {
                    normal: {opacity: 0.5}
                }
            },
            {
                name: gettext('chart_early_leave'),
                type: 'line',
                data: dataArr,
                smooth: true,
                lineStyle: {
                    normal: {opacity: 0.5}
                }
            },
            {
                name: gettext('chart_absent'),
                type: 'line',
                data: dataArr,
                smooth: true,
                lineStyle: {
                    normal: {opacity: 0.5}
                }
            }
        ]
    };
    //cChart.showLoading({
    //    text: gettext('loading...')
    //});
    cChart.setOption(option);

    function refreshException() {
        if ($("#dashboard").hasClass('layui-hide')) {
            return false;
        }
        if (!$("#pandemic").hasClass("d-none")) {
            return false;
        }

        var url = '/iclock/dashboard_exception/';
        var csrf = $("input[name=csrfmiddlewaretoken]").val();
        $.ajax({
            url: url,
            type: 'POST',
            traditional: true,
            data: {csrfmiddlewaretoken: csrf, Department: pDepartments, Area: pAreas, dashboard: 'p'},
            dataType: 'json',
            success: function (data) {
                var pOpt = $.extend(true, {}, option);
                $.extend(pOpt, data);
                cChart.setOption(pOpt);
                //pChart.hideLoading();
                 window.setTimeout(refreshException, 60000);
            },
            error: function () {
                pChart.hideLoading();
                 window.setTimeout(refreshException, 600000);
            },
            complete: function (XHR, TS) {
                XHR = null;
            }
        });
    }

    var acChart = echarts.init(document.getElementById('areaCapacity'));
    var mDepartments = [];
    var mAreas = [];
    var real_option = {
        title: {
            text: gettext('dashboard_real_time_monitor'),
            //subtext: gettext('今天'),
            left: 0
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line'
            }
        },
        toolbox: {
            showTitle: false,
            feature: {
                myRefresh: {
                    show: true,
                    icon: 'M3.8,33.4 M47,18.9h9.8V8.7 M56.3,20.1 C52.1,9,40.5,0.6,26.8,2.1C12.6,3.7,1.6,16.2,2.1,30.6 M13,41.1H3.1v10.2 M3.7,39.9c4.2,11.1,15.8,19.5,29.5,18 c14.2-1.6,25.2-14.1,24.7-28.5',
                    onclick: function () {
                        // refresh('m');
                        refreshMonitor();
                        dashboardRefresh();
                    }
                },
                magicType: {type: ['line', 'bar']},
                saveAsImage: {
                    show: true
                }
            }
        },
        legend: {
            data: [gettext('P')]
        },
        grid: {
            left: '10%',
            right: '5%',
            bottom: '20%'
        },
        xAxis: {
            type: 'category',
            data: rdataHeads,
            scale: true,
            boundaryGap: false,
            axisLine: {onZero: false},
            splitLine: {show: false},
            splitNumber: 30,
            min: 'dataMin',
            max: 'dataMax'
        },
        yAxis: {
            scale: true,
            splitArea: {
                show: true
            }
        },
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100
            },
            {
                show: true,
                type: 'slider',
                y: '90%',
                start: 0,
                end: 100
            }
        ],
        series: [
            {
                name: gettext('P'),
                type: 'line',
                data: rdataArr,
                smooth: true,
                lineStyle: {
                    normal: {opacity: 0.5}
                }
            }
        ]
    };
    //acChart.showLoading({
    //    text: gettext('loading...')
    //});
    acChart.setOption(real_option);

    function refreshMonitor() {
        if ($("#dashboard").hasClass('layui-hide')) {
            return false;
        }
        if (!$("#pandemic").hasClass("d-none")) {
            return false;
        }

        var url = '/iclock/dashboard_monitor/';
        $.ajax({
            url: url,
            type: 'GET',
            traditional: true,
            data: {Department: pDepartments, Area: pAreas, dashboard: 'p'},
            dataType: 'json',
            success: function (data) {
                var pOpt = $.extend(true, {}, real_option);
                $.extend(pOpt, data);
                acChart.setOption(pOpt);
                //pChart.hideLoading();
                 window.setTimeout(refreshMonitor, 30000);
            },
            error: function () {
                pChart.hideLoading();
                 window.setTimeout(refreshMonitor, 60000);
            },
            complete: function (XHR, TS) {
                XHR = null;
            }
        });
    }

    function FillOutData(data) {
        var content = "";
        var content_temp = "";
        var content_pandamic = '';
        if (data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                var employee_label = 'Emp. Id:';
                var r = data[i];
                var masked_face = '';
                var color_class = '';
                if (!r[6]) {
                    r[6] = '/media/images/userImage.gif';
                }
                if (!r[1]) {
                    r[1] = 'Unknown';
                    employee_label = ''
                }
                if (!r[2]) {
                    r[2] = '';
                }

                if (r[12] == 0) {
                    masked_face = 'NO';
                    color_class = 'high';
                } else if (r[12] == 1) {
                    masked_face = 'YES';
                    color_class = r[10].toLowerCase()
                } else if (r[12] == "None") {
                    masked_face = 'Not Recognized';
                    color_class = r[10].toLowerCase();
                } else {
                    color_class = r[10].toLowerCase();
                }
                var device_class;
                device_class =  r[8].toString().includes('device');
                if(device_class){
                    device_class = 'device-txt device1-txt';
                }else {
                    device_class = 'location-txt location1-txt';
                }
                content_pandamic += '<tr class="'+color_class+'-bg">'
                             +'<td class="seperator-right">'
                             +'<div class="widget-content p-0">'
                             +'<div class="widget-content-wrapper">'
                              +'<div class="widget-content-left mr-3">'
                              +'<div class="widget-content-left">'
                              +'<img class="img-circle emp-img" onerror="this.src=\'/media/images/userImage.gif\'" source="' + r[6] + '" src="' + r[6] + '" alt="employee image">'
                              +'</div>'
                              +'</div>'
                              +'<div class="widget-content-left flex2">'
                              +'<div class="emp-name  text-white">' + r[2] + '</div>'
                               +'<div class="emp-id  text-white" id="employee_id">'+ employee_label + r[1] + '</div>'
                               +'</div>'
                               +'</div>'
                               +'</div>'
                               +'</td>'
                               +'<td>'
                               +'<span class="'+device_class+' text-white" style="width:120px;height:20px:center;text-overflow: ellipsis;white-space: nowrap;overflow:hidden;" title="' + r[7] + '">&nbsp;&nbsp; ' + r[7] + '</span>'
                               +'<div class="punch-time text-white" style="text-align:center;width:120px;text-overflow: ellipsis;white-space: nowrap;overflow:hidden;" title="' + r[3] + '">' + r[3] + '</div>'
                               + '</td>'
                               +'<td class="text-center seperator-left">'
                               +'<div class="row pandemic-temp">'
                               +'<div class="col-md-6 col-sm-6 col-xs-5">'
                               +'<h6 class="title  text-white">Body Temp.</h6>'
                               +'<p class="body-temp  text-white">' + r[9] + '</p>'
                               +'</div>'
                               +'<div class="col-md-6 col-sm-6 col-xs-7">'
                               +'<h6 class="title  text-white">Masked Face</h6>'
                               +'<p class="temp-var  text-white">' + masked_face + '</p>'
                               +'</div>'
                               +'</div>'
                               +'</td>'
                               +'<td class="text-center seperator-left" >'
                               +'<div class="widget-content p-0">'
                               + '<img onerror="this.src=\'/static/cloud/static/images/camera.png\'" source="' + r[5] + '" src="' + r[5] + '" class="camera-img" alt="Camera Ban"/>'
                               +'</div>'
                               +'</td>'
                               +'</tr>';

                content += ''
                    + '<tr>'
                    + '  <td style="width:38%;"><div class="l"  title="' + r[2] + '">'
                    + '      <div class="l user-img"><img class="radius img-user" onerror="this.src=\'/media/images/userImage.gif\'" source="' + r[6] + '" src="' + r[6] + '">' + '' + '</div>'
                    + '      <div class="r" style="margin: 3px 3px 3px 3px;width:135px;">'
                    + '      <div style="text-overflow: ellipsis;white-space: nowrap;overflow:hidden;">' + r[1] + '</div>'
                    + '      <div style="text-overflow: ellipsis;white-space: nowrap;overflow:hidden;">' + r[2] + '</div></div>'
                    + '  </div></td>'
                    + '  <td style="width:29%;"><div class="l">'
                    + '     <div class="l"><img source="' + r[8] + '" src="' + r[8] + '">' + '' + '</div>'
                    + '     <div class="r" style="margin: 3px 3px 3px 3px;width:125px;">'
                    + '     <div style="width:120px;height:20px:center;text-overflow: ellipsis;white-space: nowrap;overflow:hidden;" title="' + r[7] + '">' + r[7] + '</div>'
                    + '     <div style="text-overflow: ellipsis;white-space: nowrap;overflow:hidden;" title="' + r[3] + '">' + r[3] + '</div></div>'
                    + '  </div></td>'
                    + '  <td style="width:18%;">' + r[4] + '</td>'
                    + '  <td style="width:15%;"><img class="radius img-capture" onerror="this.src=\'/media/images/noCapture.png\'" source="' + r[5] + '" src="' + r[5] + '"></td>'
                    + '</tr>';

            }
            $('#pandemic-real-time-data-sample').css('display', 'none');
            $("#dashboard-table tbody").after(content);
            $("#pandamic-dashboard-table-temp tbody").after(content_pandamic);
        }
    }

    var score = 0;

    function dashboardRefresh() {
        if ($("#dashboard").hasClass('layui-hide')) {
            return false
        }
        if (!$("#pandemic").hasClass("d-none")) {
            return false;
        }

        if ($("table.dashboard-table tr").length > 100) {
            $("table.dashboard-table tr tr:gt(100)").remove();
        }
        // $("table.dashboard-table tr img").each(function () {
        //
        // });
        var url = '/iclock/dashboard_transaction/';
        var csrf = $("input[name=csrfmiddlewaretoken]").val();
        $.ajax({
            url: url,
            type: 'POST',
            traditional: true,
            timeout: 20000,
            data: {csrfmiddlewaretoken: csrf, Department: mDepartments, Area: mAreas, dashboard: 'r', bp: score},
            dataType: 'json',
            success: function (data) {
                FillOutData(data['data']);
                score = data['score'];
                timer_map['dashboardRefreshID'] = window.setTimeout(dashboardRefresh, 5000);
            },
            error: function () {
                window.setTimeout(dashboardRefresh, 15000);
            },
            complete: function (XHR, TS) {
                if (TS === 'timeout') {
                    dashboardRefresh()
                }
                XHR = null;
            }
        });
    }

    let dashboardCardURLData;

    const downloadIDs = [
        'totalEmployees',
        'newJoinees',
        'resignedEmployees',
        'totalDevices',
        'presentEmployees',
        'absentEmployees',
        'lateEmployees',
        'earlyEmployees',
        'leaveEmployees',
        'verifications'
    ]
    let setDownloadEventListeners = () => {
        downloadIDs.forEach(id => {
            let downloadElement = document.getElementById(id)
            downloadElement.addEventListener('click', () => {
                window.open(dashboardCardURLData[id], "_blank");
            })
        })
    }

    function refreshBaseCrard() {
        if ($("#dashboard").hasClass('layui-hide')) {
            return false;
        }
        if (!$("#pandemic").hasClass("d-none")) {
            return false;
        }


        var url = '/iclock/dashboard_card_base/';
        var csrf = $("input[name=csrfmiddlewaretoken]", "#dashboard").val();
        $.ajax({
            url: url,
            type: 'POST',
            traditional: true,
            data: {csrfmiddlewaretoken: csrf},
            dataType: 'json',
            success: function (datas) {
                var card_datas = datas.card_datas;
                // fill all dashboard cards
                for (var detail in card_datas) {
                    $('#' + detail).text(card_datas[detail])
                }

                dashboardCardURLData = datas.card_data_download_url;
                setDownloadEventListeners();

                // maskChart.setOption(mask_opt);
                // refresh again after 20s
                timer_map['refreshBaseCrardID'] = window.setTimeout(refreshBaseCrard, 30000);
            },
            error: function () {
                 window.setTimeout(refreshBaseCrard, 30000);
            },
            complete: function (XHR, TS) {
                XHR = null;
            }
        });
    }

    function refreshTempCrard() {
        if ($("#dashboard").hasClass('layui-hide')) {
            return false;
        }

        if ($("#pandemic").hasClass("d-none")) {
            return false;
        }


        var url = '/iclock/dashboard_card_temp/';
        var csrf = $("input[name=csrfmiddlewaretoken]", "#dashboard").val();
        $.ajax({
            url: url,
            type: 'POST',
            traditional: true,
            data: {csrfmiddlewaretoken: csrf},
            dataType: 'json',
            success: function (datas) {
                var card_datas = datas.card_datas;
                var other_datas = datas.other_datas;
                //set temp pie chart
                temp_opt.series[0]['data'][0]['value'] = card_datas['high_temp_count'];
                temp_opt.series[0]['data'][1]['value'] = card_datas['warning_count'];
                temp_opt.series[0]['data'][2]['value'] = card_datas['normal_count'];
                // tempChart.setOption(temp_opt);
                //set mask pie chart
                mask_opt.series[0]['data'][0]['value'] = card_datas['no_mask_count'];
                mask_opt.series[0]['data'][1]['value'] = other_datas['masked_count'];
                // maskChart.setOption(mask_opt);
                // refresh again after 15s
                timer_map['refreshCrard'] = window.setTimeout(refreshTempCrard, 60000);
            },
            error: function () {
                timer_map['refreshCrard'] = window.setTimeout(refreshTempCrard, 2000000);
            },
            complete: function (XHR, TS) {
                XHR = null;
            }
        });
    }

 //   function Refresh() {
 //       refreshPie();
 //       refreshMonitor();
 //   }
    window.setTimeout(refreshBaseCrard, 1000);
    window.setTimeout(refreshPie, 2000);
    window.setTimeout(refreshMonitor, 3000);
    window.setTimeout(dashboardRefresh, 4000);
    window.setTimeout(refreshException, 10000);


    window.onresize = function () {
        resizeWorldMapContainer();
        pChart.resize();
        cChart.resize();
        acChart.resize();
    };
    //window.setTimeout(Refresh, 1000);//第一次刷新等1s执行刷新函数
    //window.onresize = function(){
    //    setTimeout(acChart.resize(),100);
    //}

    $(function () {

        $(".ta-pandemic").click(function () {
            if ($("#pandemic").hasClass("d-none")) {
                $("#pandemic").removeClass("d-none");
                $("#att_dashboard").addClass("d-none");
                $("#switch-id").prop("checked", true);
                window.setTimeout(refreshTemp, 15000);
                window.setTimeout(refreshTempCrard, 5000);
            } else {
                $("#att_dashboard").removeClass("d-none");
                $("#pandemic").addClass("d-none");
                $("#switch-id").prop("checked", false);
                window.setTimeout(refreshBaseCrard, 1000);
                window.setTimeout(refreshPie, 2000);
                window.setTimeout(refreshMonitor, 3000);
                window.setTimeout(dashboardRefresh, 4000);
                window.setTimeout(refreshException, 10000);
                

            }
            return false;
        });
    });

});
