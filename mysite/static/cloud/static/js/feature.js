var features_records_edit = [];
$(function() {
    /*--********** FEATURES **********--*/
/*-- Get All - Features --*/
$.ajax({
    url: '/cloud/api/v1/internal/features/?page_size=9999',
    type: 'GET',
    success: function (res, status, xhr) {
        // console.log("All Feature: ", res);
        for (var j = 0; j < res.data.length; j++) {
            var records = res.data[j];
            features_records_edit.push(records);
            $("#priceStrategiesFeature_post").append(
                '<option value="' + res.data[j].id + '">' + res.data[j].name + '/' + res.data[j].country + '</option>'
            );
            $("#priceStrategiesFeature_edit").append(
                '<option value="' + res.data[j].id + '">' + res.data[j].name + '/' + res.data[j].country + '</option>'
            );
        }
    }
});
/*-- //End --*/
    /*-- Get First 5- Features --*/
    $.ajax({
        url: '/cloud/api/v1/internal/features/?page_size=5',
        type: 'GET',
        success: function (res, status, xhr) {
            //console.log(res);
            var next_feature = res.next;
            var prev_feature = res.previous;
            document.getElementById('feature_count').innerHTML = res.count;
            $('#getFeatureRecords').html('');
            for (var j = 0; j < res.data.length; j++) {
                var records = res.data[j];
                //features_records_edit.push(records);
                $('#getFeatureRecords').append(
                    '<tr>' +
                    '<td>' + records.name + '</td>' +
                    '<td>' + records.display_status + '</td>' +
                    '<td>' + records.effective_status + '</td>' +
                    '<td>' + records.type_name + '</td>' +
                    '<td>' + records.country + '</td>' +
                    //'<td>' + records.currency + '</td>' +
                    '<td>' + records.price + '</td>' +
                    '<td>' + records.description + '</td>' +
                    '<td class="text-center">' +
                    '<a href="javascript:void(0);" data-toggle="modal" data-target="#editFeature" onclick="editFeatureRecords('+records.id+')">' +
                    '<i class="fa fa-edit fa-lg fa-fw text-success"></i></a>&nbsp;' +
                    '<a href="javascript:void(0);" onclick="deleteFeatureRecords('+records.id+')">' +
                    '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
                    '</td>' +
                    '</tr>'
                );
                // var html = "";
                // html += '<option value="' + res.data[j].id + '">' + res.data[j].name + '</option>';

            }
            /*-- Next&Prev-Discount(step1) --*/
            if(next_feature) {
                $('.next-prev-feature').append("<button class='btn-transition btn btn-outline-success next-data-link-feature'" +
                    "value='"+next_feature+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
            }
            if(prev_feature) {
                $('.next-prev-feature').append("<button class='btn-transition btn btn-outline-success next-data-link-feature'" +
                    "value='"+prev_feature+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
            }
            /*-- //End --*/
        }
    });
    /*-- //End --*/
    /*-- Next&Prev-Discount(step2) --*/
    $(document.body).on('click', '.next-data-link-feature', function() {
        $('.next-prev-feature').html('');
        var link = $(this).val();
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_feature = res.next;
                var prev_feature = res.previous;
                $('#getFeatureRecords').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var records = res.data[i];
                        $('#getFeatureRecords').append(
                        '<tr>' +
                        '<td>' + records.name + '</td>' +
                        '<td>' + records.display_status + '</td>' +
                        '<td>' + records.effective_status + '</td>' +
                        '<td>' + records.type_name + '</td>' +
                        '<td>' + records.country + '</td>' +
                        //'<td>' + records.currency + '</td>' +
                        '<td>' + records.price + '</td>' +
                        '<td>' + records.description + '</td>' +
                        '<td class="text-center">' +
                        '<a href="javascript:void(0);" data-toggle="modal" data-target="#editFeature" onclick="editFeatureRecords('+records.id+')">' +
                        '<i class="fa fa-edit fa-lg fa-fw text-success"></i></a>&nbsp;' +
                        '<a href="javascript:void(0);" onclick="deleteFeatureRecords('+records.id+')">' +
                        '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
                        '</td>' +
                        '</tr>'
                    );
                }
                if(next_feature) {
                    $('.next-prev-feature').append("<button class='btn-transition btn btn-outline-success next-data-link-feature'" +
                        "value='"+next_feature+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: 14px;'>Next</button>");
                }
                if(prev_feature) {
                    $('.next-prev-feature').append("<button class='btn-transition btn btn-outline-success next-data-link-feature'" +
                        "value='"+prev_feature+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: 14px;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/
});

/*-- Post - Features --*/
$('#postFeature').on('click', function (event) {
    event.preventDefault();
    /*var msg;
    var yes = prompt('Are you sure you want to add this item?');
    if(yes != null) {
        msg = "You pressed OK!";
        alert(msg);*/
        var feature_name = $('#featureName_post').val();
        var feature_display = $('#featureDisplay_post').val();
        var feature_effective = $('#featureEffective_post').val();
        var feature_type = $('#featureType_post').val();
        var feature_description = $('#featureDescription_post').val();
        var feature_country = $('#featureCountry_post').val();
        //var feature_currency = $('#featureCurrency_post').val();
        var feature_price = $('#featurePrice_post').val();
        var obj = {
            name: feature_name,
            display_status: feature_display,
            effective_status: feature_effective,
            type: feature_type,
            country: feature_country,
            //currency: feature_currency,
            price: feature_price,
            description: feature_description,
            csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val()
        };
        $.ajax({
            url: '/cloud/api/v1/internal/features/',
            type: 'POST',
            data: obj,
            success: function (res, status, xhr) {
                $('#addFeature').modal('hide');
                $('.modal-backdrop').remove();
                location.reload();
            },
            error: function(xhr, status, error) {
                if(xhr) {
                    $('#featureName_post').css("border-color", "red");
                    $('#featureCountry_post').css("border-color", "red");
                    var err_msg = JSON.parse(xhr.responseText);
                    for(var i = 0; i < err_msg.non_field_errors.length; i++) {
                        $('#errorFeature1').html(err_msg.non_field_errors[i] + " please enter new feature name.");
                        $('#errorFeature5').html("This country already exists in the feature name. Please select new country.");
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
/*-- Update - Feature --*/
$('#updateFeature').on('click', function (event) {
    event.preventDefault();
    /*var msg;
    var yes = prompt('Are you sure you want to update this item?');
    if(yes != null) {
        msg = "You pressed OK!";
        alert(msg);*/
        var id = $('#feature_id').val();
        var feature_name = $('#featureName_edit').val();
        var feature_display = $('#featureDisplay_edit').val();
        var feature_effective = $('#featureEffective_edit').val();
        var feature_type = $('#featureType_edit').val();
        var feature_country = $('#featureCountry_edit').val();
        //var feature_currency= $('#featureCurrency_edit').val();
        var feature_price = $('#featurePrice_edit').val();
        var feature_description = $('#featureDescription_edit').val();
        var obj = {
            name: feature_name,
            display_status: feature_display,
            effective_status: feature_effective,
            type: feature_type,
            country: feature_country,
            //currency: feature_currency,
            price: feature_price,
            description: feature_description
        };
        $.ajax({
            url: '/cloud/api/v1/internal/features/'+id+'/',
            data: obj,
            type: 'PUT',
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                $('#editFeature').modal('hide');
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
function editFeatureRecords (id, event) {
    $.ajax({
        url: `/cloud/api/v1/internal/features/${id}`,
        type: 'GET',
        success: function (res, status, xhr) {

            $('.feature_id').val(res.id);
            $('.featureName').val(res.name);
            $('.featureCountry').val(res.country);
            //$('.featureCurrency').val(res.currency);
            $('.featurePrice').val(res.price);
            $('.featureDescription').val(res.description);

            if(res.display_status == true) {
                $('select #status_feature_true').attr('selected', true);
            } else if(res.display_status == false) {
                $('select #status_feature_false').attr('selected', true);
            } else {
                alert('Status Empty!');
            }

            if(res.effective_status == true) {
                $('select #effective_feature_true').attr('selected', true);
            } else if(res.effective_status == false) {
                $('select #effective_feature_false').attr('selected', true);
            } else {
                alert('Status Empty!');
            }

            if(res.type_name == 'Server') {
                $('select #edit_feature_server').attr('selected', true);
            } else if(res.type_name == 'Customization') {
                $('select #edit_feature_customization').attr('selected', true);
            } else if(res.type_name == 'Prototype') {
                $('select #edit_feature_prototype').attr('selected', true);
            } else {
                alert('Type Empty!');
            }
        }
    });
}

/*-- Delete - Features --*/
function deleteFeatureRecords(id){
    /*var msg;
    var yes = prompt('Are you sure you want to delete this item?');
    if(yes != null) {
        msg = "You pressed OK!";s
        alert(msg);*/
        $.ajax({
            url: '/cloud/api/v1/internal/features/'+id+'/',
            type: "DELETE",
            data: '',
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                location.reload();
            },
             error: function (xhr, status, error) {
                if (xhr) {
                    var err_msg = JSON.parse(xhr.responseText);
                    $('#showErrorMsg').html('');
                    if (err_msg.message.length > 0) {
                        $('#errorMsgModal').modal('show');
                            $('#showErrorMsg').html('<b>' + err_msg.message + '</b>');
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
$('#validateFeature').on('click', function() {
    var value_feature1 = $('#featureName_post').val();
    var value_feature2 = $('#featureType_post').val();
    var value_feature3 = $('#featureDisplay_post').val();
    var value_feature4 = $('#featureEffective_post').val();
    var value_feature5 = $('#featureCountry_post').val();
    var value_feature6 = $('#featurePrice_post').val();
    var value_feature7 = $('#featureDescription_post').val();
    if (value_feature1 == "") {
        $('#featureName_post').css("border-color", "red");
        $('#errorFeature1').html("*This field is required!");
    }
    if (value_feature2 == "") {
        $('#featureType_post').css("border-color", "red");
        $('#errorFeature2').html("*This field is required!");
    }
    if (value_feature3 == "") {
        $('#featureDisplay_post').css("border-color", "red");
        $('#errorFeature3').html("*This field is required!");
    }
    if (value_feature4 == "") {
        $('#featureEffective_post').css("border-color", "red");
        $('#errorFeature4').html("*This field is required!");
    }
    if (value_feature5 == "") {
        $('#featureCountry_post').css("border-color", "red");
        $('#errorFeature5').html("*This field is required! Value must be between 0 and 1.");
    }
    if (value_feature6 == "" || isNaN(value_feature6)) {
        $('#featurePrice_post').css("border-color", "red");
        $('#errorFeature6').html("*This field is required!");
    }
    if (value_feature7 == "") {
        $('#featureDescription_post').css("border-color", "red");
        $('#errorFeature7').html("*This field is required!");
    }
    else {
        $('#featureName_post').css("border-color", "green");
        $('#errorFeature1').html("");
        $('#featureType_post').css("border-color", "green");
        $('#errorFeature2').html("");
        $('#featureDisplay_post').css("border-color", "green");
        $('#errorFeature3').html("");
        $('#featureEffective_post').css("border-color", "green");
        $('#errorFeature4').html("");
        $('#featureCountry_post').css("border-color", "green");
        $('#errorFeature5').html("");
        $('#featurePrice_post').css("border-color", "green");
        $('#errorFeature6').html("");
        $('#featureDescription_post').css("border-color", "green");
        $('#errorFeature7').html("");
    }
});
/*-- //End --*/