var vendor_records_list = [];
$(function() {
    $.ajax({
    url: '/cloud/api/v1/internal/companies/?page_size=9999',
    type: 'GET',
    success: function (res, status, xhr) {
        // console.log("All Feature: ", res);
        for (var j = 0; j < res.data.length; j++) {
            var records = res.data[j];
            vendor_records_list.push(records);
            $("#priceStrategiesVendor_post").append(
                '<option value="' + res.data[j].id + '">' + res.data[j].name + '</option>'
            );
            $("#priceStrategiesVendor_edit").append(
                '<option value="' + res.data[j].id + '">' + res.data[j].name + '</option>'
            );
        }
    }
    });
});

$(function() {
    /*--********** PRICE STRATEGIES **********--*/
    /*-- Get - Price Strategies --*/
    $.ajax({
        url: '/cloud/api/v1/internal/price_strategies/for_vendor/?page_size=5',
        type: 'GET',
        success: function (res) {
            //console.log(res);
            var next_price_strategy = res.next;
            var prev_price_strategy = res.previous;
            document.getElementById('price_strategies_count').innerHTML = res.count;
            $('#getPricestrategies').html('');
            for (var p = 0; p < res.data.length; p++) {
                var records = res.data[p];
                var price_feature_records = '';
                for(var q = 0; q < records.feature_name.length; q++) {
                    price_feature_records += records.feature_name[q] + ', ';
                }
                $('#getPricestrategies').append(
                    '<tr>' +
                    '<td>' + records.type_name + '</td>' +
                    '<td>' + records.vendor_name + '</td>' +
                    '<td>' + records.create_user_username + '</td>' +
                    '<td>' + records.subscription_duration_unit_price_pre_month + '</td>' +
                    '<td>' + records.employee_threshold + '</td>' +
                    '<td>' + records.employee_unit_price + '</td>' +
                    '<td>' + records.device_threshold + '</td>' +
                    '<td>' + records.device_unit_price + '</td>' +
                    '<td>' + records.whatsapp_push_counts_limit_status + '</td>' +
                    '<td>' + records.whatsapp_push_threshold + '</td>' +
                    '<td>' + records.whatsapp_push_unit_price + '</td>' +
                    '<td>' + records.mobile_app_counts_limit_status + '</td>' +
                    '<td>' + records.mobile_applications_threshold + '</td>' +
                    '<td>' + records.mobile_applications_unit_price + '</td>' +
                    '<td>' + records.transaction_counts_limit_status + '</td>' +
                    '<td>' + records.transaction_threshold + '</td>' +
                    '<td>' + records.transaction_unit_price + '</td>' +
                    '<td>' + records.country + '</td>' +
                    //'<td>' + records.currency + '</td>' +
                    '<td>' + records.effective_status + '</td>' +
                    '<td>' + records.discount_ratio + '</td>' +
                    '<td>' + price_feature_records + '</td>' +
                    '<td class="text-center">' +
                    '<a href="javascript:void(0);" data-toggle="modal" data-target="#editPriceStrategies" onclick="editPriceStrategyRecords('+records.id+')">' +
                    '<i class="fa fa-edit fa-lg fa-fw text-success"></i></a>&nbsp;' +
                    '<a href="javascript:void(0);" onclick="deletePriceStrategyRecords('+records.id+')">' +
                    '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
                    '</td>' +
                    '</tr>'
                );
            }
            /*-- Next&Prev-Discount(step1) --*/
            if(next_price_strategy) {
                $('.next-prev-price-strategy').append("<button class='btn-transition btn btn-outline-success next-data-link-price-strategy'" +
                    "value='"+next_price_strategy+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
            }
            if(prev_price_strategy) {
                $('.next-prev-price-strategy').append("<button class='btn-transition btn btn-outline-success next-data-link-price-strategy'" +
                    "value='"+prev_price_strategy+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
            }
            /*-- //End --*/
        }
    });
    /*-- //End --*/
    /*-- Next&Prev-Discount(step2) --*/
    $(document.body).on('click', '.next-data-link-price-strategy', function() {
        $('.next-prev-price-strategy').html('');
        var link = $(this).val();
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_price_strategy = res.next;
                var prev_price_strategy = res.previous;
                $('#getPricestrategies').html('');
                for (var p = 0; p < res.data.length; p++) {
                    var records = res.data[p];
                    var price_feature_records = '';
                    for(var q = 0; q < records.feature_name.length; q++) {
                        price_feature_records += records.feature_name[q] + ', ';
                    }
                    $('#getPricestrategies').append(
                        '<tr>' +
                        '<td>' + records.type_name + '</td>' +
                        '<td>' + records.vendor_name + '</td>' +
                        '<td>' + records.create_user_username + '</td>' +
                        '<td>' + records.subscription_duration_unit_price_pre_month + '</td>' +
                        '<td>' + records.employee_threshold + '</td>' +
                        '<td>' + records.employee_unit_price + '</td>' +
                        '<td>' + records.device_threshold + '</td>' +
                        '<td>' + records.device_unit_price + '</td>' +
                        '<td>' + records.whatsapp_push_counts_limit_status + '</td>' +
                        '<td>' + records.whatsapp_push_threshold + '</td>' +
                        '<td>' + records.whatsapp_push_unit_price + '</td>' +
                        '<td>' + records.mobile_app_counts_limit_status + '</td>' +
                        '<td>' + records.mobile_applications_threshold + '</td>' +
                        '<td>' + records.mobile_applications_unit_price + '</td>' +
                        '<td>' + records.transaction_counts_limit_status + '</td>' +
                        '<td>' + records.transaction_threshold + '</td>' +
                        '<td>' + records.transaction_unit_price + '</td>' +
                        '<td>' + records.country + '</td>' +
                        //'<td>' + records.currency + '</td>' +
                        '<td>' + records.effective_status + '</td>' +
                        '<td>' + records.discount_ratio + '</td>' +
                        '<td>' + price_feature_records + '</td>' +
                        '<td class="text-center">' +
                        '<a href="javascript:void(0);" data-toggle="modal" data-target="#editPriceStrategies" onclick="editPriceStrategyRecords('+records.id+')">' +
                        '<i class="fa fa-edit fa-lg fa-fw text-success"></i></a>&nbsp;' +
                        '<a href="javascript:void(0);" onclick="deletePriceStrategyRecords('+records.id+')">' +
                        '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
                        '</td>' +
                        '</tr>'
                    );
                }
                if(next_price_strategy) {
                    $('.next-prev-price-strategy').append("<button class='btn-transition btn btn-outline-success next-data-link-price-strategy'" +
                        "value='"+next_price_strategy+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: 14px;'>Next</button>");
                }
                if(prev_price_strategy) {
                    $('.next-prev-price-strategy').append("<button class='btn-transition btn btn-outline-success next-data-link-price-strategy'" +
                        "value='"+prev_price_strategy+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: 14px;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/
});

/*-- Post - Price Strategies --*/
$('#postPriceStrategies').on('click', function (event) {
    event.preventDefault();
    /*var msg;
    var yes = prompt('Are you sure you want to add this item?');
    if(yes != null) {
        msg = "You pressed OK!";
        alert(msg);*/
        var price_strat_type = $('#priceStrategiesType_post').val();
        var price_strat_subs = $('#priceStrategiesSubscription_post').val();
        var price_strat_emp_thr = $('#priceStrategiesEmpThr_post').val();
        var price_strat_emp_prc = $('#priceStrategiesEmpPrc_post').val();
        var price_strat_dvc_thr = $('#priceStrategiesDvcThr_post').val();
        var price_strat_dvc_prc = $('#priceStrategiesDvcPrc_post').val();
        var price_strat_what_status = $('#priceStrategiesWhatStatus_post').val();
        var price_strat_what_thr = $('#priceStrategiesWhatThr_post').val();
        var price_strat_what_prc = $('#priceStrategiesWhatPrc_post').val();
        var price_strat_mob_status = $('#priceStrategiesMobStatus_post').val();
        var price_strat_mob_thr = $('#priceStrategiesMobThr_post').val();
        var price_strat_mob_prc = $('#priceStrategiesMobPrc_post').val();
        var price_strat_trans_status = $('#priceStrategiesTrnsStatus_post').val();
        var price_strat_trans_thr = $('#priceStrategiesTrnsThr_post').val();
        var price_strat_trans_prc = $('#priceStrategiesTrnsPrc_post').val();
        var price_strat_country = $('#priceStrategiesCountry_post').val();
        var price_strat_effective = $('#priceStrategiesEffective_post').val();
        var price_strat_discount = $('#priceStrategiesDiscount_post').val();
        // var price_strat_feature = $('#priceStrategiesFeature_post').val();
        var price_strat_feature = [];
        $.each($("#priceStrategiesFeature_post option:selected"), function(){
            price_strat_feature.push($(this).val());
        });
        var price_strat_vendor = $('#priceStrategiesVendor_post').val();
        var obj = {
            type: price_strat_type,
            subscription_duration_unit_price_pre_month: price_strat_subs,
            employee_threshold: price_strat_emp_thr,
            employee_unit_price: price_strat_emp_prc,
            device_threshold: price_strat_dvc_thr,
            device_unit_price: price_strat_dvc_prc,
            whatsapp_push_counts_limit_status: price_strat_what_status,
            whatsapp_push_threshold: price_strat_what_thr,
            whatsapp_push_unit_price: price_strat_what_prc,
            mobile_app_counts_limit_status: price_strat_mob_status,
            mobile_applications_threshold: price_strat_mob_thr,
            mobile_applications_unit_price: price_strat_mob_prc,
            transaction_counts_limit_status: price_strat_trans_status,
            transaction_threshold: price_strat_trans_thr,
            transaction_unit_price: price_strat_trans_prc,
            country: price_strat_country,
            effective_status: price_strat_effective,
            discount: price_strat_discount,
            feature: price_strat_feature,
            vendor: price_strat_vendor
        };
        $.ajax({
            url: '/cloud/api/v1/internal/price_strategies/for_vendor/',
            type: 'POST',
            data: JSON.stringify(obj),
            dataType: "json",
            contentType: "application/json",
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                $('#addPriceStrategies').modal('hide');
                $('.modal-backdrop').remove();
                location.reload();
            },
            error: function(xhr, status, error) {
                if(xhr) {
                    $('#priceStrategiesType_post').css("border-color", "red");
                    $('#priceStrategiesCountry_post').css("border-color", "red");
                    $('#priceStrategiesVendor_post').css("border-color", "red");
                    $('#priceStrategiesEffective_post').css("border-color", "red");
                    var err_msg = JSON.parse(xhr.responseText);
                    for(var i = 0; i < err_msg.non_field_errors.length; i++) {
                        $('#errorPriceStrategy1').html(err_msg.non_field_errors[i]);
                    }
                }
            }
        });
    /*} else {
        msg = "You pressed Cancel!";
        alert(msg);
    }*/
});
/*-- //End --*/
/*-- Update - Price Strategies --*/
$('#updatePriceStrategies').on('click', function (event) {
    event.preventDefault();
    /*var msg;
    var yes = prompt('Are you sure you want to edit this item?', 'yes');
    if(yes != null) {
        msg = "You pressed OK!";
        alert(msg);*/
        var id = $('#price_strat_id').val();
        var price_strat_type = $('#priceStrategiesType_edit').val();
        var price_strat_subs = $('#priceStrategiesSubscription_edit').val();
        var price_strat_emp_thr = $('#priceStrategiesEmpThr_edit').val();
        var price_strat_emp_prc = $('#priceStrategiesEmpPrc_edit').val();
        var price_strat_dvc_thr = $('#priceStrategiesDvcThr_edit').val();
        var price_strat_dvc_prc = $('#priceStrategiesDvcPrc_edit').val();
        var price_strat_what_status = $('#priceStrategiesWhatStatus_edit').val();
        var price_strat_what_thr = $('#priceStrategiesWhatThr_edit').val();
        var price_strat_what_prc = $('#priceStrategiesWhatPrc_edit').val();
        var price_strat_mob_status = $('#priceStrategiesMobStatus_edit').val();
        var price_strat_mob_thr = $('#priceStrategiesMobThr_edit').val();
        var price_strat_mob_prc = $('#priceStrategiesMobPrc_edit').val();
        var price_strat_trans_status = $('#priceStrategiesTrnsStatus_edit').val();
        var price_strat_trans_thr = $('#priceStrategiesTrnsThr_edit').val();
        var price_strat_trans_prc = $('#priceStrategiesTrnsPrc_edit').val();
        var price_strat_country = $('#priceStrategiesCountry_edit').val();
        var price_strat_effective = $('#priceStrategiesEffective_edit').val();
        var price_strat_discount = $('#priceStrategiesDiscount_edit').val();
        // var price_strat_feature = $('#priceStrategiesFeature_post').val();
        var price_strat_feature = [];
        $.each($("#priceStrategiesFeature_edit option:selected"), function(){
            price_strat_feature.push($(this).val());
        });
        var price_strat_vendor = $('#priceStrategiesVendor_edit').val();
        var obj_data = {
            type: price_strat_type,
            subscription_duration_unit_price_pre_month: price_strat_subs,
            employee_threshold: price_strat_emp_thr,
            employee_unit_price: price_strat_emp_prc,
            device_threshold: price_strat_dvc_thr,
            device_unit_price: price_strat_dvc_prc,
            whatsapp_push_counts_limit_status: price_strat_what_status,
            whatsapp_push_threshold: price_strat_what_thr,
            whatsapp_push_unit_price: price_strat_what_prc,
            mobile_app_counts_limit_status: price_strat_mob_status,
            mobile_applications_threshold: price_strat_mob_thr,
            mobile_applications_unit_price: price_strat_mob_prc,
            transaction_counts_limit_status: price_strat_trans_status,
            transaction_threshold: price_strat_trans_thr,
            transaction_unit_price: price_strat_trans_prc,
            country: price_strat_country,
            effective_status: price_strat_effective,
            discount: price_strat_discount,
            feature: price_strat_feature,
            vendor: price_strat_vendor
        };
        $.ajax({
            url: '/cloud/api/v1/internal/price_strategies/for_vendor/'+id+'/',
            type: 'PUT',
            data: JSON.stringify(obj_data),
            dataType: "json",
            contentType: "application/json",
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                $('#editPriceStrategies').modal('hide');
                $('.modal-backdrop').remove();
                location.reload();
            }
        });
    /*} else {
        msg = "You pressed Cancel!";
        alert(msg);
    }*/
});
/*-- //End --*/
function editPriceStrategyRecords (id, event) {
    $.ajax({
        url: `/cloud/api/v1/internal/price_strategies/for_vendor/${id}`,
        type: 'GET',
        success: function (res, status, xhr) {
            //console.log("Response: ", res);
            $('.price_strat_id').val(res.id);
            $('.priceStrategiesSubscription').val(res.subscription_duration_unit_price_pre_month);
            $('.priceStrategiesEmpThr').val(res.employee_threshold);
            $('.priceStrategiesEmpPrc').val(res.employee_unit_price);
            $('.priceStrategiesDvcThr').val(res.device_threshold);
            $('.priceStrategiesDvcPrc').val(res.device_unit_price);
            $('.priceStrategiesWhatThr').val(res.whatsapp_push_threshold);
            $('.priceStrategiesWhatPrc').val(res.whatsapp_push_unit_price);
            $('.priceStrategiesMobThr').val(res.mobile_applications_threshold);
            $('.priceStrategiesMobPrc').val(res.mobile_applications_unit_price);
            $('.priceStrategiesTrnsThr').val(res.transaction_threshold);
            $('.priceStrategiesTrnsPrc').val(res.transaction_unit_price);
            $('.priceStrategiesCountry').val(res.country);

            if(res.type_name == 'Free Trial') {
                $('select #edit_prc_strat_trail').attr('selected', true);
            } else if(res.type_name == 'Professional') {
                $('select #edit_prc_strat_professional').attr('selected', true);
            } else if(res.type_name == 'Premium') {
                $('select #edit_prc_strat_premium').attr('selected', true);
            } else if(res.type_name == 'Enterprise') {
                $('select #edit_prc_strat_enterprise').attr('selected', true);
            } else {
                alert('Status Empty!');
            }

            if(res.whatsapp_push_counts_limit_status == true) {
                $('select #edit_prc_strat_what_true').attr('selected', true);
            } else if(res.whatsapp_push_counts_limit_status == false) {
                $('select #edit_prc_strat_what_false').attr('selected', true);
            } else {
                alert('Status Empty!');
            }

            if(res.mobile_app_counts_limit_status == true) {
                $('select #edit_prc_strat_mob_true').attr('selected', true);
            } else if(res.mobile_app_counts_limit_status == false) {
                $('select #edit_prc_strat_mob_false').attr('selected', true);
            } else {
                alert('Status Empty!');
            }

            if(res.transaction_counts_limit_status == true) {
                $('select #edit_prc_strat_trns_true').attr('selected', true);
            } else if(res.transaction_counts_limit_status == false) {
                $('select #edit_prc_strat_trns_false').attr('selected', true);
            } else {
                alert('Status Empty!');
            }

            if(res.effective_status == true) {
                $('select #edit_prc_strat_effective_true').attr('selected', true);
            } else if(res.effective_status == false) {
                $('select #edit_prc_strat_effective_false').attr('selected', true);
            } else {
                alert('Status Empty!');
            }

            for(var i = 0; i < discounts_records_edit.length; i++) {
                if(res.discount_ratio == discounts_records_edit[i].discount_ratio) {
                    $('#priceStrategiesDiscount_edit').val(discounts_records_edit[i].id);
                }
            }

            for(var i = 0; i < vendor_records_list.length; i++) {
                if(res.vendor_name == vendor_records_list[i].name) {
                    $('#priceStrategiesVendor_edit').val(vendor_records_list[i].id);
                }
            }

            var selected_features = [];
            for(var i = 0; i < features_records_edit.length; i++) {
                if(res.feature.includes(features_records_edit[i].id)) {
                    selected_features.push(features_records_edit[i].id);
                }
            }
            $('#priceStrategiesFeature_edit').val(selected_features);
        }
    });
}

/*-- Delete - Price Strategies --*/
function deletePriceStrategyRecords(id){
    /*var msg;
    var yes = prompt('Are you sure you want to delete this item?');
    if(yes != null) {
        msg = "You pressed OK!";
        alert(msg);*/
        $.ajax({
            url: '/cloud/api/v1/internal/price_strategies/for_vendor/'+id+'/',
            type: "DELETE",
            data: '',
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                location.reload();
            }
        });
    /*} else {
        msg = "You pressed Cancel!";
        alert(msg);
    }*/
}
/*-- //End --*/

/*-- Form Validatio --*/
$('#validatePriceStrategy').on('click', function() {
    var value_price_strategy1 = $('#priceStrategiesType_post').val();
    var value_price_strategy2 = $('#priceStrategiesSubscription_post').val();
    var value_price_strategy3 = $('#priceStrategiesEmpThr_post').val();
    var value_price_strategy4 = $('#priceStrategiesEmpPrc_post').val();
    var value_price_strategy5 = $('#priceStrategiesDvcThr_post').val();
    var value_price_strategy6 = $('#priceStrategiesDvcPrc_post').val();
    var value_price_strategy7 = $('#priceStrategiesWhatStatus_post').val();
    var value_price_strategy8 = $('#priceStrategiesWhatThr_post').val();
    var value_price_strategy9 = $('#priceStrategiesWhatPrc_post').val();
    var value_price_strategy10 = $('#priceStrategiesMobStatus_post').val();
    var value_price_strategy11 = $('#priceStrategiesMobThr_post').val();
    var value_price_strategy12 = $('#priceStrategiesMobPrc_post').val();
    var value_price_strategy13 = $('#priceStrategiesTrnsStatus_post').val();
    var value_price_strategy14 = $('#priceStrategiesTrnsThr_post').val();
    var value_price_strategy15 = $('#priceStrategiesTrnsPrc_post').val();
    var value_price_strategy16 = $('#priceStrategiesCountry_post').val();
    var value_price_strategy17 = $('#priceStrategiesEffective_post').val();
    var value_price_strategy18 = $('#priceStrategiesDiscount_post').val();
    var value_price_strategy19 = $('#priceStrategiesFeature_post').val();
    if (value_price_strategy1 == "") {
        $('#priceStrategiesType_post').css("border-color", "red");
        $('#errorPriceStrategy1').html("*This field is required!");
    }
    if (value_price_strategy2 == "" || isNaN(value_price_strategy2)) {
        $('#priceStrategiesSubscription_post').css("border-color", "red");
        $('#errorPriceStrategy2').html("*This field is required!");
    }
    if (value_price_strategy3 == "" || isNaN(value_price_strategy3)) {
        $('#priceStrategiesEmpThr_post').css("border-color", "red");
        $('#errorPriceStrategy3').html("*This field is required!");
    }
    if (value_price_strategy4 == "" || isNaN(value_price_strategy4)) {
        $('#priceStrategiesEmpPrc_post').css("border-color", "red");
        $('#errorPriceStrategy4').html("*This field is required!");
    }
    if (value_price_strategy5 == "" || isNaN(value_price_strategy5)) {
        $('#priceStrategiesDvcThr_post').css("border-color", "red");
        $('#errorPriceStrategy5').html("*This field is required!");
    }
    if (value_price_strategy6 == "" || isNaN(value_price_strategy6)) {
        $('#priceStrategiesDvcPrc_post').css("border-color", "red");
        $('#errorPriceStrategy6').html("*This field is required!");
    }
    if (value_price_strategy7 == "") {
        $('#priceStrategiesWhatStatus_post').css("border-color", "red");
        $('#errorPriceStrategy7').html("*This field is required!");
    }
    if (value_price_strategy8 == "" || isNaN(value_price_strategy8)) {
        $('#priceStrategiesWhatThr_post').css("border-color", "red");
        $('#errorPriceStrategy8').html("*This field is required!");
    }
    if (value_price_strategy9 == "" || isNaN(value_price_strategy9)) {
        $('#priceStrategiesWhatPrc_post').css("border-color", "red");
        $('#errorPriceStrategy9').html("*This field is required!");
    }
    if (value_price_strategy10 == "") {
        $('#priceStrategiesMobStatus_post').css("border-color", "red");
        $('#errorPriceStrategy10').html("*This field is required!");
    }
    if (value_price_strategy11 == "" || isNaN(value_price_strategy11)) {
        $('#priceStrategiesMobThr_post').css("border-color", "red");
        $('#errorPriceStrategy11').html("*This field is required!");
    }
    if (value_price_strategy12 == "" || isNaN(value_price_strategy12)) {
        $('#priceStrategiesMobPrc_post').css("border-color", "red");
        $('#errorPriceStrategy12').html("*This field is required!");
    }
    if (value_price_strategy13 == "") {
        $('#priceStrategiesTrnsStatus_post').css("border-color", "red");
        $('#errorPriceStrategy13').html("*This field is required!");
    }
    if (value_price_strategy14 == "" || isNaN(value_price_strategy14)) {
        $('#priceStrategiesTrnsThr_post').css("border-color", "red");
        $('#errorPriceStrategy14').html("*This field is required!");
    }
    if (value_price_strategy15 == "" || isNaN(value_price_strategy15)) {
        $('#priceStrategiesTrnsPrc_post').css("border-color", "red");
        $('#errorPriceStrategy15').html("*This field is required!");
    }
    if (value_price_strategy16 == "") {
        $('#priceStrategiesCountry_post').css("border-color", "red");
        $('#errorPriceStrategy16').html("*This field is required!");
    }
    if (value_price_strategy17 == "") {
        $('#priceStrategiesEffective_post').css("border-color", "red");
        $('#errorPriceStrategy17').html("*This field is required! Value must be between 0 and 1.");
    }
    if (value_price_strategy18 == "" || isNaN(value_price_strategy18)) {
        $('#priceStrategiesDiscount_post').css("border-color", "red");
        $('#errorPriceStrategy18').html("*This field is required!");
    }
    if (value_price_strategy19 == "") {
        $('#priceStrategiesFeature_post').css("border-color", "red");
        $('#errorPriceStrategy19').html("*This field is required! Select your features.");
    }
    else {
        $('#priceStrategiesType_post').css("border-color", "green");
        $('#errorPriceStrategy1').html("");
        $('#priceStrategiesSubscription_post').css("border-color", "green");
        $('#errorPriceStrategy2').html("");
        $('#priceStrategiesEmpThr_post').css("border-color", "green");
        $('#errorPriceStrategy3').html("");
        $('#priceStrategiesEmpPrc_post').css("border-color", "green");
        $('#errorPriceStrategy4').html("");
        $('#priceStrategiesDvcThr_post').css("border-color", "green");
        $('#errorPriceStrategy5').html("");
        $('#priceStrategiesDvcPrc_post').css("border-color", "green");
        $('#errorPriceStrategy6').html("");
        $('#priceStrategiesWhatStatus_post').css("border-color", "green");
        $('#errorPriceStrategy7').html("");
        $('#priceStrategiesWhatThr_post').css("border-color", "green");
        $('#errorPriceStrategy8').html("");
        $('#priceStrategiesWhatPrc_post').css("border-color", "green");
        $('#errorPriceStrategy9').html("");
        $('#priceStrategiesMobStatus_post').css("border-color", "green");
        $('#errorPriceStrategy10').html("");
        $('#priceStrategiesMobThr_post').css("border-color", "green");
        $('#errorPriceStrategy11').html("");
        $('#priceStrategiesMobPrc_post').css("border-color", "green");
        $('#errorPriceStrategy12').html("");
        $('#priceStrategiesTrnsStatus_post').css("border-color", "green");
        $('#errorPriceStrategy13').html("");
        $('#priceStrategiesTrnsThr_post').css("border-color", "green");
        $('#errorPriceStrategy14').html("");
        $('#priceStrategiesTrnsPrc_post').css("border-color", "green");
        $('#errorPriceStrategy15').html("");
        $('#priceStrategiesCountry_post').css("border-color", "green");
        $('#errorPriceStrategy16').html("");
        $('#priceStrategiesEffective_post').css("border-color", "green");
        $('#errorPriceStrategy17').html("");
        $('#priceStrategiesDiscount_post').css("border-color", "green");
        $('#errorPriceStrategy18').html("");
        $('#priceStrategiesFeature_post').css("border-color", "green");
        $('#errorPriceStrategy19').html("");
    }
});
/*-- //End --*/