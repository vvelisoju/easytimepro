 /*---------------------------------------- Easy TimePro - Pandemic Dashboard -----------------------------------------*/

/*-- Overall Statistics --*/

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart_overall_stats_easy);
function drawChart_overall_stats_easy() {
    var data = google.visualization.arrayToDataTable(pandemic_graph_data);
    var options = {
        //title: 'My Daily Activities',
        //is3D: true,
        pieHole: 0.5,
        pieSliceTextStyle: {
            color: '#FFFFFF',
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
                color: '#000000',
                bold: true,
            },
        },
        tooltip: {
            trigger: 'focus', // focus(default), none, selection
            showColorCode: true,
            text: 'value', // both(default), value, percentage
            //isHtml: true
        },
        //chartArea:{left:0, top:40, width:'100%', height:'100%'},
        //chartArea: {top: 40},
    };
    var chart_overall_stats_easy = new google.visualization.PieChart(document.getElementById('easy-overall-stats'));
    chart_overall_stats_easy.draw(data, options);
    //Hide the Error Message
    $("#google-visualization-errors-all-1").hide();
    $("#google-visualization-errors-0").hide();
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