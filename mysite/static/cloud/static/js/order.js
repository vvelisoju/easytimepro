$(function() {
    /*--********** ORDERS **********--*/
    /*-- Get - Orders --*/
    var order_feature_records;
    $.ajax({
        url: '/cloud/api/v1/internal/orders/?page_size=5',
        type: 'GET',
        success: function (res) {
            //console.log(res);
            var next_order = res.next;
            var prev_order = res.previous;
            document.getElementById('orders_count').innerHTML = res.count;
            $('#getOrderRecords').html('');
            for (var y = 0; y < res.data.length; y++) {
                var records = res.data[y];
                order_feature_records = '';
                for(var z = 0; z < records.feature_name.length; z++){
                    order_feature_records += records.feature_name[z] + ', ';
                }
                $('#getOrderRecords').append(
                    '<tr>' +
                    '<td>' + records.number + '</td>' +
                    '<td>' + records.company_name + '</td>' +
                    '<td>' + records.subscription_duration + '</td>' +
                    '<td>' + records.employees_count + '</td>' +
                    '<td>' + records.devices_count + '</td>' +
                    '<td>' + records.transactions_count + '</td>' +
                    '<td>' + records.mobile_applications_count + '</td>' +
                    '<td>' + records.whatsapp_push_count + '</td>' +
                    '<td>' + records.price_strategy_type + '</td>' +
                    '<td>' + order_feature_records + '</td>' +
                    '<td class="text-center">' +
                    '<a href="javascript:void(0);" onclick="getOrderNoDetails(' + records.id +')">' +
                    '<i class="fa fa-eye fa-lg fa-fw text-success"></i></a>&nbsp;' +
                    '<a href="javascript:void(0);" onclick="deleteOrderRecords('+records.id+')">' +
                    '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
                    '</td>' +
                    '</tr>'
                );
            }
            /*-- Next&Prev-Discount(step1) --*/
            if(next_order) {
                $('.next-prev-order').append("<button class='btn-transition btn btn-outline-success next-data-link-order'" +
                    "value='"+next_order+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
            }
            if(prev_order) {
                $('.next-prev-order').append("<button class='btn-transition btn btn-outline-success next-data-link-order'" +
                    "value='"+prev_order+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
            }
            /*-- //End --*/
        }
    });
    /*-- //End --*/
    /*-- Next&Prev-Discount(step2) --*/
    $(document.body).on('click', '.next-data-link-order', function() {
        $('.next-prev-order').html('');
        var link = $(this).val();
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_order = res.next;
                var prev_order = res.previous;
                $('#getOrderRecords').html('');
                for (var y = 0; y < res.data.length; y++) {
                    var records = res.data[y];
                    order_feature_records = '';
                    for(var z = 0; z < records.feature_name.length; z++){
                        order_feature_records += records.feature_name[z] + ', ';
                    }
                    $('#getOrderRecords').append(
                        '<tr>' +
                        '<td>' + records.number + '</td>' +
                        '<td>' + records.company_name + '</td>' +
                        '<td>' + records.subscription_duration + '</td>' +
                        '<td>' + records.employees_count + '</td>' +
                        '<td>' + records.devices_count + '</td>' +
                        '<td>' + records.transactions_count + '</td>' +
                        '<td>' + records.mobile_applications_count + '</td>' +
                        '<td>' + records.whatsapp_push_count + '</td>' +
                        '<td>' + records.price_strategy_type + '</td>' +
                        '<td>' + order_feature_records + '</td>' +
                        '<td class="text-center">' +
                        '<a href="javascript:void(0);" onclick="getOrderNoDetails(' + records.id +')">' +
                        '<i class="fa fa-eye fa-lg fa-fw text-success"></i></a>&nbsp;' +
                        '<a href="javascript:void(0);" onclick="deleteOrderRecords('+records.id+')">' +
                        '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
                        '</td>' +
                        '</tr>'
                    );
                }
                if(next_order) {
                    $('.next-prev-order').append("<button class='btn-transition btn btn-outline-success next-data-link-order'" +
                        "value='"+next_order+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: 14px;'>Next</button>");
                }
                if(prev_order) {
                    $('.next-prev-order').append("<button class='btn-transition btn btn-outline-success next-data-link-order'" +
                        "value='"+prev_order+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: 14px;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/
});

/*-- //Get Order Details  --*/
 function getOrderNoDetails(order_id) {
       //alert(order_id);
       $('#orderDetailsModal').modal('show');
       $.ajax({
           url: '/cloud/api/v1/internal/orders/'+ order_id,
           type: 'GET',
           success: function (res) {
               //console.log(res);
               var order_number = res.number;
               var expiryDate = myDateFormat(res.expire_date);
               var pricing_features_list = '';
                    for (var a = 0; a < res.feature_name.length; a++) {
                        pricing_features_list += '<li  class="features-list-label" value="'+res.feature_name[a]+'">' + res.feature_name[a] + '</li>';
                    }

                     var status = res.payment_status;
                     var export_billing_button = "";
                     if (status == 2) {
                         var export_billing_url = '/cloud/api/v1/internal/invoice_export/' + order_number + '/';
                         var export_billing_button;
                         export_billing_button = '<a href="'+ export_billing_url +'"  class="btn btn-lg btn-success continue-to-pay-btn">' +
                         '<i class="fa fa-print fa-fw"></i>&nbsp;&nbsp; Export Billing</a>';
                    }
                    else {
                          export_billing_button = "";

                    }

               $('#orderDetailsModal').modal('show');
               $('.modal-open').css('padding', '0');
               $('#orderDetailsModal .modal-title').html('Order Number: '+ order_number );
               $('#orderDetailsTable').html('');
               $('#orderDetailsTable').append(
                        '<tr>'+
                            '<td><b>Plan</b></td>'+
                            '<td>:</td>'+
                            '<td>' + res.price_strategy_type + '</td>'+
                        '</tr>' +

                       '<tr>'+
                            '<td><b>Company Name</b></td>'+
                            '<td>:</td>'+
                            '<td style="text-transform: capitalize;">' + res.company_name + '</td>'+
                        '</tr>' +

                        '<tr>'+
                            '<td><b>Vendor Name</b></td>'+
                            '<td>:</td>'+
                            '<td style="text-transform: capitalize;">' + res.vendor_name + '</td>'+
                        '</tr>' +

                         '<tr>'+
                            '<td><b>Expiry Date</b></td>'+
                            '<td>:</td>'+
                            '<td>' + expiryDate + '</td>'+
                        '</tr>' +
                        '<tr>'+
                            '<td><b>Employees Count</b></td>'+
                            '<td>:</td>'+
                            '<td>' + res.employees_count + '</td>'+
                        '</tr>' +
                        '<tr>'+
                            '<td><b>Devices Count</b></td>'+
                            '<td>:</td>'+
                            '<td>' + res.devices_count + '</td>'+
                        '</tr>' +
                       '<tr>'+
                            '<td><b>Transactions Count</b></td>'+
                            '<td>:</td>'+
                            '<td>' + res.transactions_count + '</td>'+
                        '</tr>' +
                       '<tr>'+
                            '<td><b>Mobile Apps Count</b></td>'+
                            '<td>:</td>'+
                            '<td>' + res.mobile_applications_count + '</td>'+
                        '</tr>' +
                       '<tr>'+
                            '<td><b>WhatsApp Push Count</b></td>'+
                            '<td>:</td>'+
                            '<td>' + res.whatsapp_push_count + '</td>'+
                        '</tr>' +
                        '<tr>'+
                            '<td><b>Original Price</b></td>' +
                            '<td>:</td>' +
                            '<td><i class="fa fa-usd"></i>&nbsp;' + res.original_price + '</td>'+
                        '</tr>' +
                        '<tr>'+
                           '<td><b>Discount Price</b></td>' +
                           '<td>:</td>' +
                           '<td><i class="fa fa-usd"></i>&nbsp;' + res.discount_price + '</td>'+
                        '</tr>' +
                        '<tr>'+
                           '<td><b>Payment Price</b></td>' +
                           '<td>:</td>' +
                           '<td><i class="fa fa-usd"></i>&nbsp;' + res.payment_price + '</td>'+
                        '</tr>' +
                       '<tr>'+
                           '<td><b>Payment Status</b></td>' +
                           '<td>:</td>' +
                           '<td><b class="payment-context-'+ status +'">' + res.payment_status_name + '</b></td>'+
                        '</tr>' +
                       '<tr>'+
                           '<td><b>Features</td></b>' +
                           '<td>:</td>' +
                           '<td>' + pricing_features_list + '</td>'+
                        '</tr>' +
                           '<td><b>&nbsp;</td></b>' +
                           '<td></td>' +
                           '<td>' + export_billing_button + '</td>'+
                        '</tr>'
                    );
                    //Condition for Month & Months
                     if (res.subscription_duration>1) {
                        $('.subsDurUnit').html('months');
                    }
                    else {
                        $('.subsDurUnit').html('month');
                    }
                    //end

           }
       });
   }
//get Order Details End//

/*-- Delete - Orders --*/
function deleteOrderRecords(id){
    /*var msg;
    var yes = prompt('Are you sure you want to delete this item?');
    if(yes != null) {
        msg = "You pressed OK!";
        alert(msg);*/
        $.ajax({
            url: '/cloud/api/v1/internal/orders/'+id+'/',
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

//Date Format
function myDateFormat(userDate) {
        var d = new Date(userDate);
        var year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
        var month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
        var day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
        return  day + '-' + month + '-' + year;

}
//End