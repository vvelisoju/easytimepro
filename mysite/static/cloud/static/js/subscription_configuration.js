// // function editDiscountFunc (id, event) {
// //     //console.log("Testing id:", id);
// //     $.ajax({
// //         url: `/cloud/api/v1/internal/discounts/${id}`,
// //         type: 'GET',
// //         success: function (res) {
// //             // console.log(res);
// //             document.getElementById('discount_id').innerHTML = res.id;
// //             document.getElementById('effectiveStatus').innerHTML = res.effective_status;
// //             document.getElementById('discountRatio').innerHTML = res.discount_ratio;
// //             // console.log("Id", res.id);
// //             // console.log("Effective Status:", res.effective_status);
// //             // console.log("Discount Ratio:", res.discount_ratio);
// //         }
// //     });
// // }
// $(function() {
//     /*--********** DISCOUNTS **********--*/
//     /*-- Get - Discounts --*/
//     var url = '/cloud/api/v1/internal/discounts/';
//     $.ajax({
//         url: url,
//         type: 'GET',
//         success: function (res, status, xhr) {
//             //console.log("Get Discount: ", res);
//             var next_discount = res.next;
//             var prev_discount = res.previous;
//             document.getElementById('discount_count').innerHTML = res.count;
//             $('#getDiscountRecords').html('');
//             for (var i = 0; i < res.data.length; i++) {
//                 var records = res.data[i];
//                 $('#getDiscountRecords').append(
//                     '<tr>' +
//                     // '<td>' + records.id + '</td>' +
//                     '<td>' + records.effective_status + '</td>' +
//                     '<td>' + records.discount_ratio + '</td>' +
//                     '<td class="text-center">' +
//                     '<a href="javascript:void(0);" data-toggle="modal" data-target="#editDiscount" onclick="editDiscountRecords('+records.id+')">' +
//                     '<i class="fa fa-edit fa-lg fa-fw text-success"></i></a>&nbsp;' +
//                     '<a href="javascript:void(0);" onclick="deleteDiscountRecords('+records.id+')">' +
//                     '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
//                     '</td>' +
//                     '</tr>'
//                 );
//                 $("#priceStrategiesDiscount_post").append(
//                     '<option value="' + res.data[i].id + '">' + res.data[i].discount_ratio + '</option>'
//                 );
//             }
//             /*-- Next&Prev-Discount(step1) --*/
//             if(next_discount) {
//                 $('.next-prev-discount').append("<button class='btn-transition btn btn-outline-success next-data-link-discount'" +
//                     "value='"+next_discount+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
//             }
//             if(prev_discount) {
//                 $('.next-prev-discount').append("<button class='btn-transition btn btn-outline-success next-data-link-discount'" +
//                     "value='"+prev_discount+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
//             }
//             /*-- //End --*/
//         }
//     });
//     /*-- //End --*/
//     /*-- Next&Prev-Discount(step2) --*/
//     $(document.body).on('click', '.next-data-link-discount', function() {
//         $('.next-prev-discount').html('');
//         var link = $(this).val();
//         $.ajax({
//             url: link,
//             type: 'GET',
//             success: function(res) {
//                 var next_discount = res.next;
//             var prev_discount = res.previous;
//                 $('#getDiscountRecords').html('');
//                 for (var i = 0; i < res.data.length; i++) {
//                     var records = res.data[i];
//                     $('#getDiscountRecords').append(
//                         '<tr>' +
//                         '<td>' + records.effective_status + '</td>' +
//                         '<td>' + records.discount_ratio + '</td>' +
//                         '<td class="text-center">' +
//                         '<a href="javascript:void(0);" data-toggle="modal" data-target="#editDiscount">' +
//                         '<i class="fa fa-edit fa-lg fa-fw text-success"></i></a>&nbsp;' +
//                         '<a href="javascript:void(0);">' +
//                         '<i class="fa fa-trash fa-lg fa-fw text-danger"></i></a>' +
//                         '</td>' +
//                         '</tr>'
//                     );
//                 }
//                 if(next_discount) {
//                     $('.next-prev-discount').append("<button class='btn-transition btn btn-outline-success next-data-link-discount'" +
//                         "value='"+next_discount+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: 14px;'>Next</button>");
//                 }
//                 if(prev_discount) {
//                     $('.next-prev-discount').append("<button class='btn-transition btn btn-outline-success next-data-link-discount'" +
//                         "value='"+prev_discount+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: 14px;'>Previous</button>");
//                 }
//             }
//         });
//     });
//     /*-- //End --*/
// });