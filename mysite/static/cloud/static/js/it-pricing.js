$(function() {
    $('#selectCurrency').on('change', function() {
        var selectedCurrency = $(this).val();
        var country_name;
        switch(selectedCurrency) {
            case 'INR':
            country_name = 'INDIA';
            // code block
            break;
            case 'USD':
            country_name = 'UNITED STATES OF AMERICA';
            break;
            case 'RMB':
            country_name = 'CHINA';
            break;
            default:
            country_name = '';
        }
        //console.log('ATIF ----- Selected Currency ' + selectedCurrency);
        //console.log('ATIF ----- Selected Country ' + country_name);
        $.ajax({
            url: '/cloud/api/v1/internal/price_strategies/for_end_company/?country_name=' + country_name,
            type: 'GET',
            dataType: "json",
            success: function (res) {
                //console.log("Response: ", res);
                for(var i = 0; i < res.data.length; i++) {
                    var records = res.data[i];
                    console.log("Records: ", records);
                    if(records.country === "IN") {
                        $('.currency').find('i').removeClass('fa-usd fa-jpy');
                        $('.currency').find('i').addClass('fa-inr');
                    }
                    else if(records.country === "US") {
                        $('.currency').find('i').removeClass('fa-inr fa-jpy');
                        $('.currency').find('i').addClass('fa-usd');
                    }
                    else if(records.country === "CN") {
                        $('.currency').find('i').removeClass('fa-inr fa-usd');
                        $('.currency').find('i').addClass('fa-jpy');
                    }
                    else {
                        alert('Error in loading API.')
                    }
                }
            }
        });
    });
    //btn//
    //     $("#top_module_menu_nav").click(function() {
    //         if($("#subscription_btn").hasClass("active-subscription")) {
    //                       $("#subscription_btn").removeClass("active-subscription1");
    //                 }
    //         else {
    //         }
    //         return false;
    //     });
});
