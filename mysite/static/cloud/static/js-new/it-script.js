                            /*---------------------------------------- Intelligent Time - Time-Attendance Dashboard -----------------------------------------*/


/*-- Overall Attendance --*/
// google.charts.load('current', {'packages':['corechart']});
// google.charts.setOnLoadCallback(drawVisualization_attendance);
//
// function drawVisualization_attendance() {
//     // Some raw data (not necessarily accurate)
//     var data = google.visualization.arrayToDataTable([
//         [   'Date',       'Early Logout', 'Late Login',    'Absent'],
//         ['01/05/2020',         938,          165,             522  ],
//         ['02/05/2020',         1120,         135,             599  ],
//         ['03/05/2020',         1167,         157,             587  ],
//         ['04/05/2020',         1110,         139,             615  ],
//         ['05/05/2020',         691,          136,             629  ],
//         ['06/05/2020',         691,          136,             629  ],
//         ['07/05/2020',         938,          165,             522  ],
//         ['08/05/2020',         1120,         135,             599  ],
//         ['09/05/2020',         1167,         157,             587  ],
//         ['10/05/2020',         1110,         139,             615  ],
//         ['11/05/2020',         691,          136,             629  ],
//         ['12/05/2020',         691,          136,             629  ],
//         ['13/05/2020',         938,          165,             522  ],
//         ['14/05/2020',         1120,         135,             599  ],
//         ['15/05/2020',         1167,         157,             587  ],
//         ['16/05/2020',         1110,         139,             615  ],
//         ['17/05/2020',         691,          136,             629  ],
//         ['18/05/2020',         691,          136,             629  ],
//         ['19/05/2020',         938,          165,             522  ],
//         ['20/05/2020',         1120,         135,             599  ],
//         ['21/05/2020',         1167,         157,             587  ],
//         ['22/05/2020',         1110,         139,             615  ],
//         ['23/05/2020',         691,          136,             629  ],
//         ['24/05/2020',         691,          136,             629  ],
//         ['25/05/2020',         938,          165,             522  ],
//         ['26/05/2020',         1120,         135,             599  ],
//         ['27/05/2020',         1167,         157,             587  ],
//         ['28/05/2020',         1110,         139,             615  ],
//         ['29/05/2020',         691,          136,             629  ],
//         ['30/05/2020',         691,          136,             629  ],
//         ['31/05/2020',         136,          691,             136  ]
//     ]);
//
//     var options = {
//         //title : 'Monthly Attendance Report',
//         //titlePosition: 'in', //in, out, none
//         titleTextStyle: {
//             //color: '#F7931E',
//             //fontName: <string>,
//             //fontSize: 16,
//             //bold: true,
//             //italic: true
//             //format: 'decimal'
//         },
//         vAxis: {
//             title: 'Employees',
//             titleTextStyle: {
//                 color: '#FFFFFF',
//                 //fontName: <string>,
//                 fontSize: 16,
//                 bold: true,
//                 //italic: <boolean>
//             },
//             baselineColor: '#FFFFFF',
//             textStyle: {
//                 color: '#FFFFFF',
//                 //fontName: <string>,
//                 fontSize: 10,
//                 //bold: true,
//                 //italic: true
//                 //format: 'decimal'
//             },
//             gridlines: {
//                 color: '#00a1d4',
//                 //minSpacing: 20
//             }
//         },
//         hAxis: {
//             title: 'Date',
//             titleTextStyle: {
//                 color: '#FFFFFF',
//                 //fontName: <string>,
//                 fontSize: 16,
//                 bold: true,
//                 //italic: <boolean>
//             },
//             baselineColor: '#FFFFFF',
//             //textPosition: 'out',
//             scaleType: {
//                 logscale: true,
//             },
//             textStyle: {
//                 color: '#FFFFFF',
//                 //fontName: <string>,
//                 fontSize: 10,
//                 //bold: true,
//                 //italic: true
//                 //format: 'decimal'
//             }
//         },
//         colors: ['#FF7BAC', '#F7931E', '#F15A24'],
//         //width: 1450,
//         //height: 400,
//         //backgroundColor: 'transparent',
//         backgroundColor: {
//             fill: 'transparent',
//             //stroke: '#166a96',
//             //strokeWidth: 3,
//         },
//         seriesType: 'bars',
//         //series: {31: {type: 'line'}},
//         isStacked: true,
//         legend: {
//             //position: 'top',
//             //alignment: 'center',
//             textStyle: {
//                 color: '#FFFFFF',
//                 fontSize: 10,
//                 bold: true
//             }
//         },
//         // bar: {
//         //     groupWidth: '50%',
//         // },
//         animation: {
//             duration: 1000,
//             easing: 'in',
//             startup: true
//         },
//         tooltip: {
//             textStyle: {
//                 //color: '#1b9e77',
//                 fontSize: 12,
//             },
//             showColorCode: true,
//             //trigger: 'selection',
//             //isHtml: true
//         }
//     };
//
//     var chart_attendance = new google.visualization.ComboChart(document.getElementById('overallAttendance'));
//     chart_attendance.draw(data, options);
// }
/*-- //End --*/


                            /*---------------------------------------- Intelligent Time - Pandemic Dashboard -----------------------------------------*/


/*-- Overall Statistics --*/

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart_overall_stats_it);
function drawChart_overall_stats_it() {
    var data = google.visualization.arrayToDataTable(pandemic_graph_data);
    var options = {
        //title: 'My Daily Activities',
        //is3D: true,
        pieHole: 0.5,
        pieSliceTextStyle: {
            color: '#384862',
        },
        pieSliceText: 'value', // percentage(default), value, label, none
        slices: {
            0: { color: '#FF000A' }, // High Temprature
            1: { color: '#FF7308' }, // Warning
            2: { color: '#38ED1C' }, // Normal
            3: { color: '#EFFF00' }, // No Mask
            4: { color: 'transparent' } // null
        },
        pieSliceBorderColor: 'transparent',

        //sliceVisibilityThreshold: 0.2,
        backgroundColor: 'transparent',
        //colors: ['red','#004411'],
        chartArea: {
            left: 0,
            top: 0,
            width: '100%',
            height: '90%',
        },
        pieStartAngle: -90,
        legend: {
            alignment: 'center',
            position: 'bottom',
            textStyle: {
                //fontSize: 16,
                //fontName: '',
                //italic: true,
                color: '#000',
                bold: true,
            },
        },
        tooltip: {
            trigger: 'selection', // focus(default), none, selection
            showColorCode: true,
            text: 'value', // both(default), value, percentage
            //isHtml: true
        },
        //chartArea:{left:0, top:40, width:'100%', height:'100%'},
        //chartArea: {top: 40},
    };
    var chart_overall_stats_it = new google.visualization.PieChart(document.getElementById('overall-statistics-pandemic'));
    chart_overall_stats_it.draw(data, options);
    //Hide the Error Message
    document.getElementById("google-visualization-errors-all-1").style.display = "none";
}




/*-- Overall Statistics Show More & Less --*/
//   $(function() {
//     var moretext = "Show more";
//     var lesstext = "Show less";
//     //var showDiv = $(this).find('.filter-form');
//     //var borderTop = $(this).find('.search-area');
//     var borderTop1 = $(this).find('.search-area-date');
//
//     $(".btn-viewmore1").click(function(){
//         if($(this).hasClass("less")) {
//             $(this).removeClass("less");
//             $(this).html(moretext);
//             //borderTop.css('border-top', '2px groove transparent');
//             borderTop1.css('border-top', '2px groove transparent');
//             $(".filter-date").hide(1000);
//         } else {
//             $(this).addClass("less");
//             $(this).html(lesstext);
//             ///borderTop.css('border-top', '2px groove rgba(118, 158, 185, 0.7)');
//             borderTop1.css('border-top', '2px groove rgba(118, 158, 185, 0.7)');
//             $(".filter-date").show(1000);
//         }
//         return false;
//     });
// });
/*-- //End --*/

//   $(function() {
//     var moretext = "Show more";
//     var lesstext = "Show less";
//     //var showDiv = $(this).find('.filter-form');
//     var borderTop = $(this).find('.search-area');
//
//
//     $(".btn-viewmore").click(function(){
//         if($(this).hasClass("less")) {
//             $(this).removeClass("less");
//             $(this).html(moretext);
//             borderTop.css('border-top', '2px groove transparent');
//             $(".filter-form").hide(1000);
//
//         } else {
//             $(this).addClass("less");
//             $(this).html(lesstext);
//             borderTop.css('border-top', '2px groove rgba(118, 158, 185, 0.7)');
//             $(".filter-form").show(1000);
//
//
//         }
//
//         return false;
//     });
// });
/* end */

// google.load("visualization", "1", {packages:["corechart"]});
// google.setOnLoadCallback(initChart);
// $(window).on("resize", function (event) {
//   initChart();
// });
//
// function initChart() {
//   var options = {
//     legend:'none',
//     // legend: {
//     //   alignment: 'center',
//     //   position: 'top',
//     //   textStyle: {
//     //       fontSize: 10,
//     //       color: '#FFFFFF',
//     //       bold: true,
//     //   },
//     // },
//     pieSliceBorderColor: 'transparent',
//     pieSliceTextStyle: {
//         color: '#FFFFFF',
//         bold: true,
//     },
//     backgroundColor: 'transparent',
//     width: '100%',
//     height: '100%',
//     tooltip: {
//       //isHtml: true,
//       trigger: 'selection', // focus(default), none, selection
//       showColorCode: true,
//       text: 'value', // both(default), value, percentage
//     },
//     chartArea: {left: "3%", top: "3%", height: "100%", width: "100%"},
//     //colors: ['#FF000A', '#FF7308', '#38ED1C', '#EFFF00', 'transparent'],
//     colors: ['#FF000A', '#FF7308', '#38ED1C', '#EFFF00', 'transparent'],
//     pieHole: 0.50,
//     pieStartAngle: -90,
//     is3D: false,
//     //pieSliceText: 'none'
//     pieSliceText: 'percentage', // percentage(default), value, label, none
//   };
//   var data = google.visualization.arrayToDataTable(
//     [
//       ['Temprature',      'value'],
//       ['High Temprature',      20],
//       ['Warning',              30],
//       ['Normal',               80],
//       ['No Mask',              10],
//       [null,      (20+30+80+10)] //addition of value of all elements
//     ]
//   );
//   drawChart(data, options);
// }
//
// function drawChart(data, options) {
//   var tooltip = [
//     Math.round((20/(20+30+80+10))*100) + "%",
//     Math.round((30/(20+30+80+10))*100) + "%",
//     Math.round((80/(20+30+80+10))*100) + "%",
//     Math.round((10/(20+30+80+10))*100) + "%",
//     "Hiii5",
//   ];
//   var chart = new google.visualization.PieChart(document.getElementById('easy-overall-stats'));
//   var sliceid = 0;
//   function eventHandler(e){
//     chart.setSelection([e]);
//     try {
//       selection = chart.getSelection();
//       sliceid = selection[0].row;
//     }
//     catch(err) {
//       ;
//     }
//     $(".google-visualization-tooltip-item-list li:eq(0)").css("font-weight", "bold");
//     $(".google-visualization-tooltip-item-list li:eq(1)").html(tooltip[sliceid]).css("font-family", "Arial");
//   }
//   google.visualization.events.addListener(chart, 'onmousedown', eventHandler);
//   google.visualization.events.addListener(chart, 'onmouseover', eventHandler);
//   chart.draw(data, options);
// }

/*-- //End --*/