var discounts_records_edit = [];
$(function() {
    /*--********** DISCOUNTS **********--*/
    /*-- Get - Discounts --*/
    $.ajax({
        url: '/cloud/api/v1/internal/discounts/?page_size=5',
        type: 'GET',
        success: function (res, status, xhr) {
            var next_discount = res.next;
            var prev_discount = res.previous;
            document.getElementById('discount_count').innerHTML = res.count;
            $('#getDiscountRecords').html('');
            for (var i = 0; i < res.data.length; i++) {
                // console.log(res.data[i].non_field_errors);
                var records = res.data[i];
                discounts_records_edit.push(records);
                $('#getDiscountRecords').append(
                    '<tr>' +
                    // '<td>' + records.id + '</td>' +
                    '<td>' + records.effective_status + '</td>' +
                    '<td>' + records.discount_ratio + '</td>' +
                    '<td class="text-center">' +
                    '<a href="javascript:void(0);" data-toggle="modal" data-target="#editDiscount" onclick="editDiscountRecords('+records.id+')">' +
                    '<i class="fa fa-edit fa-lg fa-fw text-success"></i></a>&nbsp;' +
                    '<a href="javascript:void(0);" onclick="deleteDiscountRecords('+records.id+')">' +
                    '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
                    '</td>' +
                    '</tr>'
                );
                $("#priceStrategiesDiscount_post").append(
                    '<option value="' + res.data[i].id + '">' + res.data[i].discount_ratio + '</option>'
                );
                $("#priceStrategiesDiscount_edit").append(
                    '<option value="' + res.data[i].id + '">' + res.data[i].discount_ratio + '</option>'
                );
            }
            /*-- Next&Prev-Discount(step1) --*/
            if(next_discount) {
                $('.next-prev-discount').append("<button class='btn-transition btn btn-outline-success next-data-link-discount'" +
                    "value='"+next_discount+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
            }
            if(prev_discount) {
                $('.next-prev-discount').append("<button class='btn-transition btn btn-outline-success next-data-link-discount'" +
                    "value='"+prev_discount+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
            }
            /*-- //End --*/
        }
    });
    /*-- //End --*/
    /*-- Next&Prev-Discount(step2) --*/
    $(document.body).on('click', '.next-data-link-discount', function() {
        $('.next-prev-discount').html('');
        var link = $(this).val();
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_discount = res.next;
                var prev_discount = res.previous;
                $('#getDiscountRecords').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var records = res.data[i];
                    $('#getDiscountRecords').append(
                        '<tr>' +
                        '<td>' + records.effective_status + '</td>' +
                        '<td>' + records.discount_ratio + '</td>' +
                        '<td class="text-center">' +
                        '<a href="javascript:void(0);" data-toggle="modal" data-target="#editDiscount">' +
                        '<i class="fa fa-edit fa-lg fa-fw text-success"></i></a>&nbsp;' +
                        '<a href="javascript:void(0);">' +
                        '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
                        '</td>' +
                        '</tr>'
                    );
                }
                if(next_discount) {
                    $('.next-prev-discount').append("<button class='btn-transition btn btn-outline-success next-data-link-discount'" +
                        "value='"+next_discount+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: 14px;'>Next</button>");
                }
                if(prev_discount) {
                    $('.next-prev-discount').append("<button class='btn-transition btn btn-outline-success next-data-link-discount'" +
                        "value='"+prev_discount+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: 14px;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/
});

/*-- Post - Discounts --*/
$('#postDiscount').on('click', function (event) {
    event.preventDefault();
    /*var msg = prompt('Are you sure you want to add this item?');
    if(msg != null) {
        msg = "You pressed OK!";
        alert(msg);*/
        var e_status = $('#effectiveStatus_post').val();
        var d_ratio = $('#discountRatio_post').val();
        var obj = {
            effective_status: e_status,
            discount_ratio: d_ratio,
            //csrfmiddlewaretoken: '{{ csrf_token }}'
            csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val()
        };
        $.ajax({
            url: '/cloud/api/v1/internal/discounts/',
            type: 'POST',
            data: obj,
            success: function (res, status, xhr) {
                $('#addDiscount').modal('hide');
                $('.modal-backdrop').remove();
                location.reload();
            },
            error: function(xhr, status, error) {
                //console.log(xhr);
                if(xhr) {
                    $('#discountRatio_post').css("border-color", "red");
                    var err_msg = JSON.parse(xhr.responseText);
                    for(var i = 0; i < err_msg.non_field_errors.length; i++) {
                        $('#errorDiscount2').html(err_msg.non_field_errors[i] + " please enter new value.");
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
/*-- Update - Discounts --*/
$('#updateDiscount').on('click', function (event) {
    event.preventDefault();
    /*var msg;
    var yes = prompt('Are you sure you want to update this item?');
    if(yes != null) {
        msg = "You pressed OK!";
        alert(msg);*/
        var id = $('#discount_id').val();
        var e_status = $('#effectiveStatus_edit').val();
        var d_ratio = $('#discountRatio_edit').val();
        var obj = {
            effective_status: e_status,
            discount_ratio: d_ratio
        };
        $.ajax({
            url: '/cloud/api/v1/internal/discounts/'+id+'/',
            data: obj,
            type: 'PUT',
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                $('#editDiscount').modal('hide');
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
function editDiscountRecords (id, event) {
    $.ajax({
        url: `/cloud/api/v1/internal/discounts/${id}`,
        type: 'GET',
        success: function (res, status, xhr) {
            $('.discount_id').val(res.id);
            $('.discountRatio').val(res.discount_ratio);

            if(res.effective_status == true) {
                $('select #edit_true').attr('selected', true);
            } else if(res.effective_status == false) {
                $('select #edit_false').attr('selected', true);
            } else {
                alert("Empty Status!");
            }
        }
    });
}

/*-- Delete - Discounts --*/
function deleteDiscountRecords(id) {
    /*var msg;
    var yes = prompt('Are you sure you want to delete this item?');
    if(yes != null) {
        msg = "You pressed OK!";
        alert(msg);*/
        $.ajax({
            url: '/cloud/api/v1/internal/discounts/'+id+'/',
            type: "DELETE",
            data: '',
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                location.reload();
            },
            error(xhr, status, error) {
                if(xhr) {
                    $('#showErrorMsg').html('');
                    var error_msg = JSON.parse(xhr.responseText);
                    if (error_msg.message.length > 0) {
                        $('#errorMsgModal').modal('show');
                            $('#showErrorMsg').html('<b>' + error_msg.message + '</b>');
                    }
                }
            }

        });
    /*} else {
        msg = "You pressed Cancel!";
        alert(msg);
    }*/
}
/*-- //End --*/

/*-- Form Validatio --*/
$('#validateDiscount').on('click', function() {
    var value_discount1 = $('#effectiveStatus_post').val();
    var value_discount2 = $('#discountRatio_post').val();
    if (value_discount1 == "") {
        $('#effectiveStatus_post').css("border-color", "red");
        $('#errorDiscount1').html("*This field is required! Please select an option!");
    }
    if (value_discount2 == "" || isNaN(value_discount2) || value_discount2 < 0 || value_discount2 > 1) {
        $('#discountRatio_post').css("border-color", "red");
        $('#errorDiscount2').html("*This field is required! Value must be between 0 and 1.");
    }
    else {
        $('#effectiveStatus_post').css("border-color", "green");
        $('#errorDiscount1').html("");
        $('#discountRatio_post').css("border-color", "green");
        $('#errorDiscount2').html("");
    }
});
/*-- //End --*/