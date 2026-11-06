    /*-- Cards - All Company,Paid Company,Mobile App,Device,Users & Employees --*/
var features_records_edit = [];
    $(document).ready(function () {
        var is_superuser_extra = user_is_superuser_extra;
        var is_super_admin = user_is_super_admin;
        $.ajax({
            url: "/cloud/api/v1/internal/get_total_data/",
            type: 'GET',
            //dataType: 'json',
            success: function (response) {
                //console.log(response);
                if ((is_superuser_extra == "True") || (is_super_admin == "True")) {
                    document.getElementById('device_count').innerHTML = response.data[0]['device_count'];
                    document.getElementById('company_count').innerHTML = response.data[1]['company_count'];
                    document.getElementById('user_count').innerHTML = response.data[2]['user_count'];
                    document.getElementById('employee_count').innerHTML = response.data[3]['employee_count'];
                    document.getElementById('license_count').innerHTML = response.data[4]['paid_company_count'];
                    document.getElementById('mobile_app_count').innerHTML = response.data[5]['mobile_application_count'];
                }
                else{
                    document.getElementById('device_count').innerHTML = response.data[0]['device_count'];
                    document.getElementById('user_count').innerHTML = response.data[2]['user_count'];
                    document.getElementById('employee_count').innerHTML = response.data[3]['employee_count'];
                }
            }
        });
    });
    /*-- //End --*/

    /*-- Device --*/
    $(function() {
        var url = '/cloud/api/v1/internal/devices/';
        $.ajax({
            url: url,
            type: 'GET',
            success: function (res) {
                //console.log(res);
                var next_device = res.next;
                var prev_device = res.previous;
                document.getElementById('de_count').innerHTML = res.count;
                $('#all-device-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_device_data = res.data[i];
                    var device_id = res_device_data.id;
                    //console.log("DEVICE ", device_id );
                    var device_id_str = "'".concat(device_id, "'");
                    var device_data = '';
                    device_data += '<tr>';
                    device_data += '<td>' + res_device_data.sn + '</td>';
                    device_data += '<td>' + res_device_data.alias + '</td>';
                    device_data += '<td>' + res_device_data.ip_address + '</td>';
                    device_data += '<td>' + res_device_data.real_status + '</td>';
                    device_data += '<td>' + res_device_data.last_activity + '</td>';
                    device_data += '<td>' + res_device_data.address + '</td>';
                    device_data += '<td>' + res_device_data.company + '</td>';
                    device_data += '<td>' + '<a href="javascript:void(0);" onclick="deleteDevice('+ device_id_str +')" class="btn btn-sm btn-danger"><i class="fa fa-trash fa-fw"></i></a></td>';
                    device_data += '</tr>';
                    $('#all-device-data').append(device_data);
                }

                /*-- Next&Prev-Device(step1) --*/
                if(next_device) {
                    $('.next-prev-device').append("<button class='btn-transition btn btn-outline-success next-data-link-device'" +
                        "value='"+next_device+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_device) {
                    $('.next-prev-device').append("<button class='btn-transition btn btn-outline-success next-data-link-device' " +
                        "value='"+prev_device+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
                /*-- //End --*/
            }
        });
    });
    /*-- //End --*/
    /*-- Next&Prev-Device(step2) --*/
    $(document.body).on('click', '.next-data-link-device', function() {
        $('.next-prev-device').html('');
        var link = $(this).val();
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_device = res.next;
                var prev_device = res.previous;
                $('#all-device-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_device_data = res.data[i];
                    var device_id = res_device_data.id;
                    var device_id_str = "'".concat(device_id, "'");
                    var device_data = '';
                    device_data += '<tr>';
                    device_data += '<td>' + res_device_data.sn + '</td>';
                    device_data += '<td>' + res_device_data.alias + '</td>';
                    device_data += '<td>' + res_device_data.ip_address + '</td>';
                    device_data += '<td>' + res_device_data.real_status + '</td>';
                    device_data += '<td>' + res_device_data.last_activity + '</td>';
                    device_data += '<td>' + res_device_data.address + '</td>';
                    device_data += '<td>' + res_device_data.company + '</td>';
                    device_data += '<td>' + '<a href="javascript:void(0);" onclick="deleteDevice('+ device_id_str +')" class="btn btn-sm btn-danger"><i class="fa fa-trash fa-fw"></i></a></td>';
                    device_data += '</tr>';
                    $('#all-device-data').append(device_data);
                }

                if(next_device) {
                    $('.next-prev-device').append("<button class='btn-transition btn btn-outline-success next-data-link-device' " +
                        "value='"+next_device+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_device) {
                    $('.next-prev-device').append("<button class='btn-transition btn btn-outline-success next-data-link-device' " +
                        "value='"+prev_device+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/

    let updateCompanyData = (res, is_super_admin) =>  {
        var next_comp = res.next;
        var prev_comp = res.previous;
        document.getElementById('co_count').innerHTML = res.count;
        $('#all-company-data').html('');
        for (var i = 0; i < res.data.length; i++) {
            var res_comp_data = res.data[i];
            var comname = res_comp_data.name;
            var company_name = comname.toLowerCase();
            var company_id = res_comp_data.id;
            //console.log("COMAPNY ID", company_id);
            var company_id_str = "'".concat(company_id, "'");
            var company_data = '';
            company_data += '<tr>';
            company_data += '<td class="text-capitalize">' + res_comp_data.name + '</td>';
            company_data += '<td>' + res_comp_data.country_name + '</td>';
            company_data += '<td>' + res_comp_data.province + '</td>';
            company_data += '<td>' + res_comp_data.city + '</td>';
            company_data += '<td>' + res_comp_data.company_phone + '</td>';
            company_data += '<td>' + res_comp_data.company_address + '</td>';
            company_data += '<td>' + res_comp_data.user_count + '</td>';
            company_data += '<td>' + res_comp_data.employee_count + '</td>';
            company_data += '<td>' + res_comp_data.device_count + '</td>';
            company_data += '<td>' + res_comp_data.app_count + '</td>';
            company_data += '<td>' + res_comp_data.vendor_status + '</td>';
            company_data += '<td>' + res_comp_data.create_date + '</td>';
            company_data += '<td>' + res_comp_data.expire_date + '</td>';
            if (is_super_admin == "True"){
                company_data += '<td>' +
                '<a href="javascript:void(0);" onclick="viewCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-success view-company-btn">' +
                '<i class="fa fa-eye fa-fw"></i></a>&nbsp;&nbsp;' +
                '<a href="javascript:void(0);" onclick="editCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-primary edit-company-btn">' +
                '<i class="fa fa-edit fa-fw"></i></a>&nbsp;&nbsp;' +
                '<a href="javascript:void(0);" onclick="deleteCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-danger">' +
                '<i class="fa fa-trash fa-fw"></i></a></td>';
             }

            else {
                company_data += '<td>' +
                '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                '<a href="javascript:void(0);" onclick="viewCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-success view-company-btn">' +
                '<i class="fa fa-eye fa-fw"></i></a>&nbsp;&nbsp;';
            }
            company_data += '</tr>';
            $('#all-company-data').append(company_data);
        }

        /*-- Next&Prev-All Company(step1) --*/
        if(next_comp) {
            $('.next-prev-all-comp').append("<button class='btn-transition btn btn-outline-success next-data-link-comp'" +
                "value='"+next_comp+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
        }
        if(prev_comp) {
            $('.next-prev-all-comp').append("<button class='btn-transition btn btn-outline-success next-data-link-comp' " +
                "value='"+prev_comp+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
        }
    }

    let updateEmployeeData = (res) => {
        var next_emp = res.next;
        var prev_emp = res.previous;
        document.getElementById('em_count').innerHTML = res.count;
        $('#all-employee-data').html('');
        for (var i = 0; i < res.data.length; i++) {
            var res_emp_data = res.data[i];
            var employee_data = '';
            employee_data += '<tr>';
            employee_data += '<td>' + res_emp_data.name + '</td>';
            employee_data += '<td>' + res_emp_data.employee_count + '</td>';
            employee_data += '<td>' + res_emp_data.country_name + '</td>';
            employee_data += '</tr>';
            $('#all-employee-data').append(employee_data);
        }

        /*-- Next&Prev-Employees(step1) --*/
        if(next_emp) {
            $('.next-prev-employee').append("<button class='btn-transition btn btn-outline-success next-data-link-emp'" +
                "value='"+next_emp+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
        }
        if(prev_emp) {
            $('.next-prev-employee').append("<button class='btn-transition btn btn-outline-success next-data-link-emp' " +
                "value='"+prev_emp+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
        }
        /*-- //End --*/
    }

    /*-- All Company --*/
    $(function() {
        var is_super_admin = window.user_is_super_admin;
        var url = '/cloud/api/v1/internal/companies/all/';
        $.ajax({
            url: url,
            type: 'GET',
            success: function (res) {
                updateCompanyData(res, is_super_admin);
                updateEmployeeData(res)
                /*-- //End --*/
            }
        });
    });
    /*-- //End --*/
    /*-- Next&Prev-All Company(step2) --*/
    $(document.body).on('click', '.next-data-link-comp', function() {
        $('.next-prev-all-comp').html('');
        var is_super_admin = user_is_super_admin;
        var link = $(this).val();
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_comp = res.next;
                var prev_comp = res.previous;
                $('#all-company-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_comp_data = res.data[i];
                    var company_id = res_comp_data.id;
                    var company_id_str = "'".concat(company_id, "'");
                    var company_data = '';
                    company_data += '<tr>';
                    company_data += '<td class="text-capitalize">' + res_comp_data.name + '</td>';
                    company_data += '<td>' + res_comp_data.country_name + '</td>';
                    company_data += '<td>' + res_comp_data.province + '</td>';
                    company_data += '<td>' + res_comp_data.city + '</td>';
                    company_data += '<td>' + res_comp_data.company_phone + '</td>';
                    company_data += '<td>' + res_comp_data.company_address + '</td>';
                    company_data += '<td>' + res_comp_data.user_count + '</td>';
                    company_data += '<td>' + res_comp_data.employee_count + '</td>';
                    company_data += '<td>' + res_comp_data.device_count + '</td>';
                    company_data += '<td>' + res_comp_data.app_count + '</td>';
                    company_data += '<td>' + res_comp_data.vendor_status + '</td>';
                    company_data += '<td>' + res_comp_data.create_date + '</td>';
                    company_data += '<td>' + res_comp_data.expire_date + '</td>';
                    if (is_super_admin == "True"){
                        company_data += '<td>' +
                        '<a href="javascript:void(0);" onclick="viewCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-success view-company-btn">' +
                        '<i class="fa fa-eye fa-fw"></i></a>&nbsp;&nbsp;' +
                        '<a href="javascript:void(0);" onclick="editCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-primary edit-company-btn">' +
                        '<i class="fa fa-edit fa-fw"></i></a>&nbsp;&nbsp;' +
                        '<a href="javascript:void(0);" onclick="deleteCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-danger">' +
                        '<i class="fa fa-trash fa-fw"></i></a></td>';
                     }
                    else {
                        company_data += '<td>' +
                        '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                        '<a href="javascript:void(0);" onclick="viewCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-success view-company-btn">' +
                        '<i class="fa fa-eye fa-fw"></i></a>&nbsp;&nbsp;';
                    }
                    company_data += '</tr>';
                    $('#all-company-data').append(company_data);
                }

                if(next_comp) {
                    $('.next-prev-all-comp').append("<button class='btn-transition btn btn-outline-success next-data-link-comp' " +
                        "value='"+next_comp+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_comp) {
                    $('.next-prev-all-comp').append("<button class='btn-transition btn btn-outline-success next-data-link-comp' " +
                        "value='"+prev_comp+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/

    /*-- User --*/
    $(function() {
        var url = '/cloud/api/v1/internal/users/';
        var is_super_admin = user_is_super_admin;
        $.ajax({
            url: url,
            type: 'GET',
            success: function (res) {
                var next_user = res.next;
                var prev_user = res.previous;
                document.getElementById('ur_count').innerHTML = res.count;
                $('#all-user-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_user_data = res.data[i];
                    var user_id = res_user_data.id;
                    var user_id_str = "'".concat(user_id, "'");
                    //console.log('USER ID', user_id );
                    var user_data = '';
                    user_data += '<tr>';
                    user_data += '<td>' + res_user_data.username + '</td>';
                    user_data += '<td>' + res_user_data.email + '</td>';
                    user_data += '<td>' + res_user_data.mobile + '</td>';
                    user_data += '<td>' + res_user_data.active_status + '</td>';
                    user_data += '<td>' + res_user_data.last_login + '</td>';
                    user_data += '<td>' + res_user_data.date_joined + '</td>';
                    user_data += '<td>' + res_user_data.belongs_company + '</td>';
                    user_data += '<td>' + '<a href="javascript:void(0);" onclick="deleteUser('+ user_id_str +')" class="btn btn-sm btn-danger"><i class="fa fa-trash fa-fw"></i></a></td>';
                    user_data += '</tr>';
                    $('#all-user-data').append(user_data);
                }

                /*-- Next&Prev-User(step1) --*/
                if(next_user) {
                    $('.next-prev-user').append("<button class='btn-transition btn btn-outline-success next-data-link-user'" +
                        "value='"+next_user+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_user) {
                    $('.next-prev-user').append("<button class='btn-transition btn btn-outline-success next-data-link-user' " +
                        "value='"+prev_user+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
                /*-- //End --*/
            }
        });
    });
    /*-- //End --*/
    /*-- Next&Prev-User(step2) --*/
    $(document.body).on('click', '.next-data-link-user', function() {
        $('.next-prev-user').html('');
        var link = $(this).val();
        var is_super_admin = user_is_super_admin;
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_user = res.next;
                var prev_user = res.previous;
                $('#all-user-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_user_data = res.data[i];
                    var user_id = res_user_data.id;
                    var user_id_str = "'".concat(user_id, "'");
                    var user_data = '';
                    user_data += '<tr>';
                    user_data += '<td>' + res_user_data.username + '</td>';
                    user_data += '<td>' + res_user_data.email + '</td>';
                    user_data += '<td>' + res_user_data.mobile + '</td>';
                    user_data += '<td>' + res_user_data.active_status + '</td>';
                    user_data += '<td>' + res_user_data.last_login + '</td>';
                    user_data += '<td>' + res_user_data.date_joined + '</td>';
                    user_data += '<td>' + res_user_data.belongs_company + '</td>';
                    user_data += '<td>' + '<a href="javascript:void(0);" onclick="deleteUser('+ user_id_str +')" class="btn btn-sm btn-danger"><i class="fa fa-trash fa-fw"></i></a>' + '</td>';
                    user_data += '</tr>';
                    $('#all-user-data').append(user_data);
                }

                if(next_user) {
                    $('.next-prev-user').append("<button class='btn-transition btn btn-outline-success next-data-link-user' " +
                        "value='"+next_user+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_user) {
                    $('.next-prev-user').append("<button class='btn-transition btn btn-outline-success next-data-link-user' " +
                        "value='"+prev_user+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/

    /*-- Next&Prev-Employees(step2) --*/
    $(document.body).on('click', '.next-data-link-emp', function() {
        $('.next-prev-employee').html('');
        var link = $(this).val();
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_emp = res.next;
                var prev_emp = res.previous;
                $('#all-employee-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_emp_data = res.data[i];
                    var employee_data = '';
                    employee_data += '<tr>';
                    employee_data += '<td>' + res_emp_data.name + '</td>';
                    employee_data += '<td>' + res_emp_data.employee_count + '</td>';
                    employee_data += '<td>' + res_emp_data.country_name + '</td>';
                    employee_data += '</tr>';
                    $('#all-employee-data').append(employee_data);
                }

                if(next_emp) {
                    $('.next-prev-employee').append("<button class='btn-transition btn btn-outline-success next-data-link-emp' " +
                        "value='"+next_emp+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_emp) {
                    $('.next-prev-employee').append("<button class='btn-transition btn btn-outline-success next-data-link-emp' " +
                        "value='"+prev_emp+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/

    /*-- Paid Company --*/
    $(function() {
        var url = '/cloud/api/v1/internal/companies/paid/';
        $.ajax({
            url: url,
            type: 'GET',
            success: function (res) {
                //console.log(res);
                var next_paid = res.next;
                var prev_paid = res.previous;
                document.getElementById('pa_count').innerHTML = res.count;
                $('#all-paid-company-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_paid_data = res.data[i];
                    var paid_company_data = '';
                    paid_company_data += '<tr>';
                    paid_company_data += '<td>' + res_paid_data.name + '</td>';
                    paid_company_data += '<td>' + res_paid_data.country_name + '</td>';
                    paid_company_data += '<td>' + res_paid_data.city + '</td>';
                    paid_company_data += '<td>' + res_paid_data.company_phone + '</td>';
                    paid_company_data += '<td>' + res_paid_data.company_address + '</td>';
                    paid_company_data += '<td>' + res_paid_data.user_count + '</td>';
                    paid_company_data += '<td>' + res_paid_data.employee_count + '</td>';
                    paid_company_data += '<td>' + res_paid_data.device_count + '</td>';
                    paid_company_data += '<td>' + res_paid_data.app_count + '</td>';
                    paid_company_data += '<td>' + res_paid_data.vendor_status + '</td>';
                    paid_company_data += '<td>' + res_paid_data.create_date + '</td>';
                    paid_company_data += '<td>' + res_paid_data.expire_date + '</td>';
                    paid_company_data += '</tr>';
                    $('#all-paid-company-data').append(paid_company_data);
                }

                /*-- Next&Prev-Paid Company(step1) --*/
                if(next_paid) {
                    $('.next-prev-paid-comp').append("<button class='btn-transition btn btn-outline-success next-data-link-paid'" +
                        "value='"+next_paid+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_paid) {
                    $('.next-prev-paid-comp').append("<button class='btn-transition btn btn-outline-success next-data-link-paid' " +
                        "value='"+prev_paid+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
                /*-- //End --*/
            }
        });
    });
    /*-- //End --*/
    /*-- Next&Prev-Paid Company(step2) --*/
    $(document.body).on('click', '.next-data-link-paid', function() {
        $('.next-prev-paid-comp').html('');
        var link = $(this).val();
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_paid = res.next;
                var prev_paid = res.previous;
                $('#all-paid-company-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_paid_data = res.data[i];
                    var paid_company_data = '';
                    paid_company_data += '<tr>';
                    paid_company_data += '<td>' + res_paid_data.name + '</td>';
                    paid_company_data += '<td>' + res_paid_data.country_name + '</td>';
                    paid_company_data += '<td>' + res_paid_data.city + '</td>';
                    paid_company_data += '<td>' + res_paid_data.company_phone + '</td>';
                    paid_company_data += '<td>' + res_paid_data.company_address + '</td>';
                    paid_company_data += '<td>' + res_paid_data.user_count + '</td>';
                    paid_company_data += '<td>' + res_paid_data.employee_count + '</td>';
                    paid_company_data += '<td>' + res_paid_data.device_count + '</td>';
                    paid_company_data += '<td>' + res_paid_data.app_count + '</td>';
                    paid_company_data += '<td>' + res_paid_data.vendor_status + '</td>';
                    paid_company_data += '<td>' + res_paid_data.create_date + '</td>';
                    paid_company_data += '<td>' + res_paid_data.expire_date + '</td>';
                    paid_company_data += '</tr>';
                    $('#all-paid-company-data').append(paid_company_data);
                }

                if(next_paid) {
                    $('.next-prev-paid-comp').append("<button class='btn-transition btn btn-outline-success next-data-link-paid' " +
                        "value='"+next_paid+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_paid) {
                    $('.next-prev-paid-comp').append("<button class='btn-transition btn btn-outline-success next-data-link-paid' " +
                        "value='"+prev_paid+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/

    /*-- Mobile App --*/
    $(function() {
        var url = '/cloud/api/v1/internal/applications/';
        $.ajax({
            url: url,
            type: 'GET',
            success: function (res) {
                var next_mobile_app = res.next;
                var prev_mobile_app = res.previous;
                document.getElementById('mob_count').innerHTML = res.count;
                $('#all-mobile-app-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_mobile_app_data = res.data[i];
                    var mobile_app_data = '';
                    mobile_app_data += '<tr>';
                    mobile_app_data += '<td>' + res_mobile_app_data.username + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.enable + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.active + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.login_time + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.last_active + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.company + '</td>';
                    mobile_app_data += '</tr>';
                    $('#all-mobile-app-data').append(mobile_app_data);
                }

                /*-- Next&Prev-Mobile App(step1) --*/
                if(next_mobile_app) {
                    $('.next-prev-mobile-app').append("<button class='btn-transition btn btn-outline-success next-data-link-mobile-app'" +
                        "value='"+next_mobile_app+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_mobile_app) {
                    $('.next-prev-mobile-app').append("<button class='btn-transition btn btn-outline-success next-data-link-mobile-app' " +
                        "value='"+prev_mobile_app+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
                /*-- //End --*/
            }
        });
    });
    /*-- //End --*/
    /*-- Next&Prev-Mobile App(step2) --*/
    $(document.body).on('click', '.next-data-link-mobile-app', function() {
        $('.next-prev-mobile-app').html('');
        var link = $(this).val();
        $.ajax({
            url: link,
            type: 'GET',
            success: function(res) {
                var next_mobile_app = res.next;
                var prev_mobile_app = res.previous;
                $('#all-mobile-app-data').html('');
                for (var i = 0; i < res.data.length; i++) {
                    var res_mobile_app_data = res.data[i];
                    var mobile_app_data = '';
                    mobile_app_data += '<tr>';
                    mobile_app_data += '<td>' + res_mobile_app_data.username + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.enable + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.active + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.login_time + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.last_active + '</td>';
                    mobile_app_data += '<td>' + res_mobile_app_data.company + '</td>';
                    mobile_app_data += '</tr>';
                    $('#all-mobile-app-data').append(mobile_app_data);
                }

                if(next_mobile_app) {
                    $('.next-prev-mobile-app').append("<button class='btn-transition btn btn-outline-success next-data-link-mobile-app' " +
                        "value='"+next_mobile_app+"' style='padding: 0 0.5em;margin-right: 1px;border-radius: 0;font-size: .9rem;'>Next</button>");
                }
                if(prev_mobile_app) {
                    $('.next-prev-mobile-app').append("<button class='btn-transition btn btn-outline-success next-data-link-mobile-app' " +
                        "value='"+prev_mobile_app+"' style='padding: 0 0.5em;margin-left: 1px;border-radius: 0;font-size: .9rem;'>Previous</button>");
                }
            }
        });
    });
    /*-- //End --*/

/*------------------------ Filter Starts Here -----------------------*/
    /*-- All Company Filter */
    $('.serach-api-comp-data').click(function() {
        var country = $('#country').val();
        var company = $('#company').val();
        var city = $('#city').val();
        var is_super_admin = user_is_super_admin;
        if(country){
            var url = '/cloud/api/v1/internal/companies/all/?country_name=' + country+'&name='+company+'&city='+city;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('co_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-company-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_comp_data = res.data[i];
                        var company_id = res_comp_data.id;
                        var company_id_str = "'".concat(company_id, "'");
                        var company_data = '';
                        if(res_comp_data.country_name == country) {
                            company_data += '<tr>';
                            company_data += '<td>' + res_comp_data.name + '</td>';
                            company_data += '<td>' + res_comp_data.country_name + '</td>';
                            company_data += '<td>' + res_comp_data.province + '</td>';
                            company_data += '<td>' + res_comp_data.city + '</td>';
                            company_data += '<td>' + res_comp_data.company_phone + '</td>';
                            company_data += '<td>' + res_comp_data.company_address + '</td>';
                            company_data += '<td>' + res_comp_data.user_count + '</td>';
                            company_data += '<td>' + res_comp_data.employee_count + '</td>';
                            company_data += '<td>' + res_comp_data.device_count + '</td>';
                            company_data += '<td>' + res_comp_data.app_count + '</td>';
                            company_data += '<td>' + res_comp_data.vendor_status + '</td>';
                            company_data += '<td>' + res_comp_data.create_date + '</td>';
                            company_data += '<td>' + res_comp_data.expire_date + '</td>';
                            if (is_super_admin == "True"){
                                company_data += '<td>' +
                                '<a href="javascript:void(0);" onclick="viewCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-success view-company-btn">' +
                                '<i class="fa fa-eye fa-fw"></i></a>&nbsp;&nbsp;' +
                                '<a href="javascript:void(0);" onclick="editCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-primary edit-company-btn">' +
                                '<i class="fa fa-edit fa-fw"></i></a>&nbsp;&nbsp;' +
                                '<a href="javascript:void(0);" onclick="deleteCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-danger">' +
                                '<i class="fa fa-trash fa-fw"></i></a></td>';
                             }
                            else {
                                company_data += '<td>' +
                                '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                                '<a href="javascript:void(0);" onclick="viewCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-success view-company-btn">' +
                                '<i class="fa fa-eye fa-fw"></i></a>&nbsp;&nbsp;';
                            }
                            company_data += '</tr>';
                            $('#all-company-data').append(company_data);
                        }
                    }
                }
            });
        }
        else {
            var url = '/cloud/api/v1/internal/companies/all/?country_name=' + country+'&name='+company+'&city='+city;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('co_count').innerHTML = res.count;
                    $('#all-company-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_comp_data = res.data[i];
                        var company_id = res_comp_data.id;
                        var company_id_str = "'".concat(company_id, "'");
                        var company_data = '';
                        company_data += '<tr>';
                        company_data += '<td>' + res_comp_data.name + '</td>';
                        company_data += '<td>' + res_comp_data.country_name + '</td>';
                        company_data += '<td>' + res_comp_data.province + '</td>';
                        company_data += '<td>' + res_comp_data.city + '</td>';
                        company_data += '<td>' + res_comp_data.company_phone + '</td>';
                        company_data += '<td>' + res_comp_data.company_address + '</td>';
                        company_data += '<td>' + res_comp_data.user_count + '</td>';
                        company_data += '<td>' + res_comp_data.employee_count + '</td>';
                        company_data += '<td>' + res_comp_data.device_count + '</td>';
                        company_data += '<td>' + res_comp_data.app_count + '</td>';
                        company_data += '<td>' + res_comp_data.vendor_status + '</td>';
                        company_data += '<td>' + res_comp_data.create_date + '</td>';
                        company_data += '<td>' + res_comp_data.expire_date + '</td>';
                        if (is_super_admin == "True"){
                            company_data += '<td>' +
                            '<a href="javascript:void(0);" onclick="viewCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-success view-company-btn">' +
                            '<i class="fa fa-eye fa-fw"></i></a>&nbsp;&nbsp;' +
                            '<a href="javascript:void(0);" onclick="editCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-primary edit-company-btn">' +
                            '<i class="fa fa-edit fa-fw"></i></a>&nbsp;&nbsp;' +
                            '<a href="javascript:void(0);" onclick="deleteCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-danger">' +
                            '<i class="fa fa-trash fa-fw"></i></a></td>';
                         }
                        else {
                            company_data += '<td>' +
                            '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                            '<a href="javascript:void(0);" onclick="viewCompanyDetails('+ company_id_str +')" class="btn btn-sm btn-success view-company-btn">' +
                            '<i class="fa fa-eye fa-fw"></i></a>&nbsp;&nbsp;';
                        }
                        company_data += '</tr>';
                        $('#all-company-data').append(company_data);
                    }
                }
            });
        }
    });
    /*-- //End */
    /*-- Mobile App Filter */
    $('.serach-api-mobile-app_data').click(function() {
        var mob_company = $('#mob_company').val();
        if(mob_company){
            var url = '/cloud/api/v1/internal/applications/?companies=' + mob_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('ve_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-mobile-app-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_mobile_app_data = res.data[i];
                        var mobile_app_data = '';
                        if(res_mobile_app_data.company == mob_company) {
                            mobile_app_data += '<tr>';
                            mobile_app_data += '<td>' + res_mobile_app_data.username + '</td>';
                            mobile_app_data += '<td>' + res_mobile_app_data.enable + '</td>';
                            mobile_app_data += '<td>' + res_mobile_app_data.active + '</td>';
                            mobile_app_data += '<td>' + res_mobile_app_data.login_time + '</td>';
                            mobile_app_data += '<td>' + res_mobile_app_data.last_active + '</td>';
                            mobile_app_data += '<td>' + res_mobile_app_data.company + '</td>';
                            mobile_app_data += '</tr>';
                            $('#all-mobile-app-data').append(mobile_app_data);
                        }
                    }
                }
            });
        }
        else {
            var url = '/cloud/api/v1/internal/applications/?companies=' + mob_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('mob_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-mobile-app-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_mobile_app_data = res.data[i];
                        var mobile_app_data = '';
                        mobile_app_data += '<tr>';
                        mobile_app_data += '<td>' + res_mobile_app_data.username + '</td>';
                        mobile_app_data += '<td>' + res_mobile_app_data.enable + '</td>';
                        mobile_app_data += '<td>' + res_mobile_app_data.active + '</td>';
                        mobile_app_data += '<td>' + res_mobile_app_data.login_time + '</td>';
                        mobile_app_data += '<td>' + res_mobile_app_data.last_active + '</td>';
                        mobile_app_data += '<td>' + res_mobile_app_data.company + '</td>';
                        mobile_app_data += '</tr>';
                        $('#all-mobile-app-data').append(mobile_app_data);
                    }
                }

            });
        }
    });
    /*-- //End --*/
    /*-- Paid Company Filter */
    $('.serach-api-paid_data').click(function() {
        var p_country = $('#p_country').val();
        var p_city = $('#p_city').val();
        var p_company = $('#p_company').val();
        if(p_country){
            var url = '/cloud/api/v1/internal/companies/paid/?country_name=' + p_country +'&city='+p_city+'&name='+p_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('pa_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-paid-company-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_paid_data = res.data[i];
                        var paid_company_data = '';
                        if(res_paid_data.country_name == p_country) {
                            paid_company_data += '<tr>';
                            paid_company_data += '<td>' + res_paid_data.name + '</td>';
                            paid_company_data += '<td>' + res_paid_data.country_name + '</td>';
                            paid_company_data += '<td>' + res_paid_data.city + '</td>';
                            paid_company_data += '<td>' + res_paid_data.company_phone + '</td>';
                            paid_company_data += '<td>' + res_paid_data.company_address + '</td>';
                            paid_company_data += '<td>' + res_paid_data.user_count + '</td>';
                            paid_company_data += '<td>' + res_paid_data.employee_count + '</td>';
                            paid_company_data += '<td>' + res_paid_data.device_count + '</td>';
                            paid_company_data += '<td>' + res_paid_data.app_count + '</td>';
                            paid_company_data += '<td>' + res_paid_data.vendor_status + '</td>';
                            paid_company_data += '<td>' + res_paid_data.create_date + '</td>';
                            paid_company_data += '<td>' + res_paid_data.expire_date + '</td>';
                            paid_company_data += '</tr>';
                            $('#all-paid-company-data').append(paid_company_data);
                        }
                    }
                }
            });
        }
        else {
           var url = '/cloud/api/v1/internal/companies/paid/?country_name=' + p_country +'&city='+p_city+'&name='+p_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('pa_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-paid-company-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_paid_data = res.data[i];
                        var paid_company_data = '';
                        paid_company_data += '<tr>';
                        paid_company_data += '<td>' + res_paid_data.name + '</td>';
                        paid_company_data += '<td>' + res_paid_data.country_name + '</td>';
                        paid_company_data += '<td>' + res_paid_data.city + '</td>';
                        paid_company_data += '<td>' + res_paid_data.company_phone + '</td>';
                        paid_company_data += '<td>' + res_paid_data.company_address + '</td>';
                        paid_company_data += '<td>' + res_paid_data.user_count + '</td>';
                        paid_company_data += '<td>' + res_paid_data.employee_count + '</td>';
                        paid_company_data += '<td>' + res_paid_data.device_count + '</td>';
                        paid_company_data += '<td>' + res_paid_data.app_count + '</td>';
                        paid_company_data += '<td>' + res_paid_data.vendor_status + '</td>';
                        paid_company_data += '<td>' + res_paid_data.create_date + '</td>';
                        paid_company_data += '<td>' + res_paid_data.expire_date + '</td>';
                        paid_company_data += '</tr>';
                        $('#all-paid-company-data').append(paid_company_data);
                    }
                }
            });
        }
    });
    /*-- //End --*/
    /*-- Device Filter --*/
    $('.serach-api-device_data').click(function() {
        var sn_name = $('#sn_name').val();
        var sn_company = $('#sn_company').val();
        //var sn_country = $('#sn_country').val();
        if(sn_company){
            var url = '/cloud/api/v1/internal/devices/?sn=' + sn_name +'&companies='+sn_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('pa_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-device-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_device_data = res.data[i];
                        var device_id = res_device_data.id;
                        var device_id_str = "'".concat(device_id, "'");
                        var device_data = '';
                        if(res_device_data.company == sn_company) {
                            device_data += '<tr>';
                            device_data += '<td>' + res_device_data.sn + '</td>';
                            device_data += '<td>' + res_device_data.alias + '</td>';
                            device_data += '<td>' + res_device_data.ip_address + '</td>';
                            device_data += '<td>' + res_device_data.real_status + '</td>';
                            device_data += '<td>' + res_device_data.last_activity + '</td>';
                            device_data += '<td>' + res_device_data.address + '</td>';
                            device_data += '<td>' + res_device_data.company + '</td>';
                            device_data += '<td>' + '<a href="javascript:void(0);" onclick="deleteDevice('+ device_id_str +')" class="btn btn-sm btn-danger"><i class="fa fa-trash fa-fw"></i></a></td>';
                            device_data += '</tr>';
                            $('#all-device-data').append(device_data);
                        }
                    }
                }
            });
        }
        else {
            var url = '/cloud/api/v1/internal/devices/?sn=' + sn_name +'&companies='+sn_company;
            //var url = '/cloud/api/v1/internal/devices/?country=' + sn_country +'&sn='+sn_name+'&alias='+sn_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('pa_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-device-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_device_data = res.data[i];
                        var device_id = res_device_data.id;
                        var device_id_str = "'".concat(device_id, "'");
                        var device_data = '';
                        device_data += '<tr>';
                        device_data += '<td>' + res_device_data.sn + '</td>';
                        device_data += '<td>' + res_device_data.alias + '</td>';
                        device_data += '<td>' + res_device_data.ip_address + '</td>';
                        device_data += '<td>' + res_device_data.real_status + '</td>';
                        device_data += '<td>' + res_device_data.last_activity + '</td>';
                        device_data += '<td>' + res_device_data.address + '</td>';
                        device_data += '<td>' + res_device_data.company + '</td>';
                        device_data += '<td>' + '<a href="javascript:void(0);" onclick="deleteDevice('+ device_id_str +')" class="btn btn-sm btn-danger"><i class="fa fa-trash fa-fw"></i></a></td>';
                        device_data += '</tr>';
                        $('#all-device-data').append(device_data);
                    }
                }
            });
        }
    });
    /*-- //End --*/

    /*-- $('.serach-api-device-data').click(function(){
        var sn_name = $('#sn_name').val();
        var sn_company = $('#sn_company').val();
        var sn_country = $('#sn_country').val();
        if(sn_country){
            var url = '/cloud/api/v1/internal/devices/?country=' + sn_country +'&sn='+sn_name+'&alias='+sn_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('pa_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-device-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_device_data = res.data[i];
                        var device_data = '';
                        if(res_device_data.country == sn_country) {
                            device_data += '<tr>';
                            device_data += '<td>' + res_device_data.sn + '</td>';
                            device_data += '<td>' + res_device_data.alias + '</td>';
                            device_data += '<td>' + res_device_data.ip_address + '</td>';
                            device_data += '<td>' + res_device_data.real_status + '</td>';
                            device_data += '<td>' + res_device_data.last_activity + '</td>';
                            device_data += '<td>' + res_device_data.address + '</td>';
                            device_data += '<td>' + res_device_data.company + '</td>';
                            device_data += '</tr>';
                            //console.log(company_data);
                            $('#all-device-data').append(device_data);
                        }
                    }
                }
            });
        }
        else {
            var url = '/cloud/api/v1/internal/devices/?country=' + sn_country +'&sn='+sn_name+'&alias='+sn_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('pa_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-device-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_device_data = res.data[i];
                        var device_data = '';
                        device_data += '<tr>';
                        device_data += '<td>' + res_device_data.sn + '</td>';
                        device_data += '<td>' + res_device_data.alias + '</td>';
                        device_data += '<td>' + res_device_data.ip_address + '</td>';
                        device_data += '<td>' + res_device_data.real_status + '</td>';
                        device_data += '<td>' + res_device_data.last_activity + '</td>';
                        device_data += '<td>' + res_device_data.address + '</td>';
                        device_data += '<td>' + res_device_data.company + '</td>';
                        device_data += '</tr>';
                        //console.log(company_data);
                        $('#all-device-data').append(device_data);
                    }
                }
            });
        }
    }); --*/

    /*-- User Filter --*/
    $('.serach-api-user-data').click(function() {
        var user_name = $('#user_name').val();
        var user_company = $('#user_company').val();
        var user_email = $('#user_email').val();
        var is_super_admin = user_is_super_admin;

        if(user_name){
            var url = '/cloud/api/v1/internal/users/?username=' + user_name +'&companies='+user_company+'&email='+user_email;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('pa_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-user-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_user_data = res.data[i];
                        var user_id = res_user_data.id;
                        var user_id_str = "'".concat(user_id, "'");
                        var user_data = '';
                        if(res_user_data.username == user_name) {
                            user_data += '<tr>';
                            user_data += '<td>' + res_user_data.username + '</td>';
                            user_data += '<td>' + res_user_data.email + '</td>';
                            user_data += '<td>' + res_user_data.mobile + '</td>';
                            user_data += '<td>' + res_user_data.active_status + '</td>';
                            user_data += '<td>' + res_user_data.last_login + '</td>';
                            user_data += '<td>' + res_user_data.date_joined + '</td>';
                            user_data += '<td>' + res_user_data.belongs_company + '</td>';
                            user_data += '<td>' + '<a href="javascript:void(0);" onclick="deleteUser('+ user_id_str +')" class="btn btn-sm btn-danger"><i class="fa fa-trash fa-fw"></i></a></td>';
                            user_data += '</tr>';
                            $('#all-user-data').append(user_data);
                        }
                    }
                }
            });
        }
        else {
            var url = '/cloud/api/v1/internal/users/?username=' + user_name +'&companies='+user_company+'&email='+user_email;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('pa_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-user-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_user_data = res.data[i];
                        var user_id = res_user_data.id;
                        var user_id_str = "'".concat(user_id, "'");
                        var user_data = '';
                        user_data += '<tr>';
                        user_data += '<td>' + res_user_data.username + '</td>';
                        user_data += '<td>' + res_user_data.email + '</td>';
                        user_data += '<td>' + res_user_data.mobile + '</td>';
                        user_data += '<td>' + res_user_data.active_status + '</td>';
                        user_data += '<td>' + res_user_data.last_login + '</td>';
                        user_data += '<td>' + res_user_data.date_joined + '</td>';
                        user_data += '<td>' + res_user_data.belongs_company + '</td>';
                        user_data += '<td>' + '<a href="javascript:void(0);" onclick="deleteUser('+ user_id_str +')" class="btn btn-sm btn-danger"><i class="fa fa-trash fa-fw"></i></a></td>';
                        user_data += '</tr>';
                        $('#all-user-data').append(user_data);
                    }
                }
            });
        }
    });
    /*-- //End --*/
    /*-- Employee Filter --*/
    $('.serach-api-emp-data').click(function() {
        var emp_country = $('#emp_country').val();
        var emp_company = $('#emp_company').val();
        if(emp_country){
            var url = '/cloud/api/v1/internal/companies/all/?country_name=' + emp_country+'&name='+emp_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    //document.getElementById('co_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-employee-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_emp_data = res.data[i];
                        var employee_data = '';
                        if(res_emp_data.country_name == emp_country) {
                            employee_data += '<tr>';
                            employee_data += '<td>' + res_emp_data.name + '</td>';
                            employee_data += '<td>' + res_emp_data.employee_count + '</td>';
                            employee_data += '<td>' + res_emp_data.country_name + '</td>';
                            employee_data += '</tr>';
                            $('#all-employee-data').append(employee_data);
                        }
                    }
                }
            });
        }
        else {
            var url = '/cloud/api/v1/internal/companies/all/?country_name=' + emp_country+'&name='+emp_company;
            $.ajax({
                url: url,
                type: 'GET',
                success: function (res) {
                    document.getElementById('co_count').innerHTML = res.count;
                    //console.log(res.data);
                    $('#all-employee-data').html('');
                    for (var i = 0; i < res.data.length; i++) {
                        var res_emp_data = res.data[i];
                        var employee_data = '';
                        employee_data += '<tr>';
                        employee_data += '<td>' + res_emp_data.name + '</td>';
                        employee_data += '<td>' + res_emp_data.employee_count + '</td>';
                        employee_data += '<td>' + res_emp_data.country_name + '</td>';
                        employee_data += '</tr>';
                        $('#all-employee-data').append(employee_data);
                    }
                }
            });
        }
    });
    /*-- //End --*/

    /*---------- User Reports Starts Here ----------*/
    /*-- User Reports Dropdown --*/
    $(function() {
        $("#userReportDropdown").on("change", function() {
            var selectedUserYear = $(this).val();
            var url = "/cloud/api/v1/internal/get_user_count/?year=" + selectedUserYear;
            $.ajax({
               url: url,
               type: "GET",
                dataType: "json",
               success: function(res) {
                  var title = res.title;
                  var test1 = [];
                  test1[0] = [];
                  test1[0][0] = "Months";
                  test1[0][1] = "Total";
                  test1[0][2] = {role: "style"};
                  for (var i in res.data) {
                      var test2 = [];
                      test2[0] = res.data[i].month;
                      test2[1] = res.data[i].count;
                      test2[2] = "color:" + res.data[i].role.color;
                      test1.push(test2);
                  }
                  var data = google.visualization.arrayToDataTable(test1);
                  var view = new google.visualization.DataView(data);
                  view.setColumns([0, 1,
                      {
                          calc: "stringify",
                          sourceColumn: 1,
                          type: "string",
                          role: "annotation"
                      },
                      2]);
                  var options = {
                      title: title,
                      // width: 600,
                      // height: 400,
                      bar: {groupWidth: "100%"},
                      legend: {position: "none"},
                      animation: {
                          duration: 3000,
                          easing: 'out',
                          startup: true,
                      }
                  };
                  var chart = new google.visualization.ColumnChart(document.getElementById("zkt_users"));
                  chart.draw(view, options);
               }
            });
        });
    });
    /*-- //End --*/

    /*---------- Employee Reports Starts Here ----------*/
    /*-- Employee Reports Dropdown --*/
    $(function() {
        $("#employeeReportDropdown").on("change", function() {
            var selectedEmployeeYear = $(this).val();
            //var url = "/cloud/api/v1/internal/get_employee_count/?year=" + selectedEmployeeYear;
            $.ajax({
               url: "/cloud/api/v1/internal/get_employee_count/?year=" + selectedEmployeeYear,
               type: "GET",
                dataType: "json",
               success: function(res) {
                  var title = res.title; // Display title
                  var emp = [];
                  emp[0] = [];
                  emp[0][0] = "Months";
                  emp[0][1] = "Total";
                  emp[0][2] = {role: "style"};
                  for (var k in res.data) {
                      var emp_rlt = [];
                      emp_rlt[0] = res.data[k].month;
                      emp_rlt[1] = res.data[k].count;
                      emp_rlt[2] = "color:" + res.data[k].role.color;
                      emp.push(emp_rlt);
                  }

                  var data = google.visualization.arrayToDataTable(emp);
                  var view = new google.visualization.DataView(data);
                  view.setColumns([0, 1,
                      {
                          calc: "stringify",
                          sourceColumn: 1,
                          type: "string",
                          role: "annotation"
                      },
                      2]);
                  var options = {
                      title: title,
                      // width: 600,
                      // height: 400,
                      bar: {groupWidth: "100%"},
                      legend: {position: "none"},
                      bars: 'horizontal',
                      animation: {
                          duration: 3000,
                          easing: 'out',
                          startup: true,
                      }
                  };
                  var chart = new google.visualization.BarChart(document.getElementById("zkt_employee"));
                  chart.draw(view, options);
               }
            });
        });
    });
    /*-- //End --*/

$(document).ready(function() {
    $('#VendorInfoSettings').on('click', function () {
        // $('#VendorInfoSettings').modal('hide');
        var current_user_vendor_company = user_vendor_company_id;
        console.log(current_user_vendor_company);
        // console.log(current_company);
        $('#VendorInfo').modal('show');
        $.ajax({
            url: '/cloud/api/v1/internal/companies/base_vendor/' + current_user_vendor_company + '/' ,
            type: 'GET',
            success: function (res) {
                console.log(res);
                // var company_id_string = "'".concat(company_id, "'");
                $('#vendor_name').val(res.name);
                $('#contact_phone').val(res.contact_phone);
                $('#vendor_cnr').val(res.company_cnr);
                // $('#vendor_company_logo').val(res.parent_vendor_company_logo);
                // $('#vendor_software_logo').val(res.parent_vendor_software_logo);
            }
        });
    });
});

$(document).ready(function() {
    $('#UpdateVendorInfo').on('click', function (event) {
        event.preventDefault();
        var id = user_vendor_company_id;
        var contact_phone = $('#contact_phone').val();
        var vendor_cnr = $('#vendor_cnr').val();

        // var vendor_company_logo = $('#vendor_company_logo').val();
        // console.log(vendor_company_logo);

        var vendor_company_logo_file = $('#vendor_company_logo').prop('files')[0];
        var vendor_software_logo_file = $('#vendor_software_logo').prop('files')[0];

        var formData = new FormData();
        formData.append('id', id);
        formData.append('contact_phone', contact_phone);
        formData.append('company_cnr', vendor_cnr);
        if (typeof vendor_company_logo_file === "undefined") {
            vendor_company_logo_file = '';
        }
        formData.append('parent_vendor_company_logo', vendor_company_logo_file);

        if (typeof vendor_software_logo_file === "undefined") {
            vendor_software_logo_file = '';
        }
        formData.append('parent_vendor_software_logo', vendor_software_logo_file);
        $.ajax({
            url: '/cloud/api/v1/internal/companies/base_vendor/' + id + '/',
            type: 'PUT',
            data: formData,
            contentType: false,
            processData: false,
            headers: {"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                $('#VendorInfo').modal('hide');
                $('.modal-backdrop').remove();
                location.reload();
            },
        });
    });
});

/*-- Company View details --*/
 function viewCompanyDetails(companyID) {
     //console.log(companyID, "Logged 11");
     $('#allCompany').modal('hide');
        //$('#allCompany .modal-backdrop').remove();
        $('#companyDetailsModal').modal('show');
        $.ajax({
            url: '/cloud/api/v1/internal/companies/' + companyID + '/' ,
            type: 'GET',
            success: function(res) {
                //console.log(res);
                var startDate = myDateFormat(res.subscription_start_date);
                var endDate = myDateFormat(res.subscription_end_date);
                var company_features_list = '';
                var feature_count = res.feature_name.length;
                var company_name = res.name;
                var company_id = res.id;
                var company_id_string = "'".concat(company_id, "'");
                var edit_btn = '<a href="javascript:void(0);" onclick="editCompanyDetails('+ company_id_string +')" class="btn  btn-success edit-company-btn">' +
                        '<i class="fa fa-edit fa-fw"></i> Edit </a>' ;
                //console.log(res.feature_name.length);
                if(feature_count == 0)
                {
                    company_features_list = '<span class="text-danger">No Features Available</span>';
                }
                else {

                    for (var q = 0; q < res.feature_name.length; q++) {
                        company_features_list += '<li  class="features-list-label" >' + res.feature_name[q] + '</li>';

                    }
                }
                $('#companyName').html(res.name);
                $('#companyDetailsTable').html('');
                $('#companyDetailsTable').append(
                    '<tr>' +
                    '<td style="width:240px;"><b>Name</b></td>' +
                    '<td>:</td>' +
                    '<td  class="text-capitalize">' + res.name + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td><b>Subscription Start Date</b></td>' +
                    '<td>:</td>' +
                    '<td>' + startDate + ' </td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td><b>Subscription End Date</b></td>' +
                    '<td>:</td>' +
                    '<td>' + endDate + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td><b>Current Employees Count /<br> Max. Employees Limit</b></td>' +
                    '<td>:</td>' +
                    '<td>' + res.current_employees_count + ' / ' + res.max_employees_limit + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td><b>Current Devices Count /<br> Max. Devices Limit</b></td>' +
                    '<td>:</td>' +
                    '<td>' + res.current_devices_count + ' / ' + res.max_devices_limit + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td><b>Current Transactions Count /<br> Max. Transactions Limit</b></td>' +
                    '<td>:</td>' +
                    '<td>' + res.current_transactions_count + ' / ' + res.max_transactions_limit + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td><b>Current Mobile Apps Count /<br> Max. Mobile Apps Limit</b></td>' +
                    '<td>:</td>' +
                    '<td>' + res.current_mobile_applications_count + ' / ' + res.max_mobile_applications_limit + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td><b>Current WhatsApp Push Count /<br> Max. WhatsApp Push Limit</b></td>' +
                    '<td>:</td>' +
                    '<td>' + res.current_whatsapp_push_count + ' / ' + res.max_whatsapp_push_limit + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td><b>Features</b></td>' +
                    '<td>:</td>' +
                    '<td>' + company_features_list + '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td colspan="3" class="text-right" style="border-top:1px solid #CCC;padding-top:22px;">' + edit_btn + '</td>' +
                    '</tr>'
                );

            }
        });
}
//end
//Company details Edit
    function editCompanyDetails (companyID, event) {

          $('#allCompany').modal('hide');
          $('#editCompanyDetails').modal('show');
          $('#companyDetailsModal').modal('hide');

    $.ajax({
        url: '/cloud/api/v1/internal/companies/' + companyID + '/' ,
        type: 'GET',
        success: function (res, status, xhr) {
            //console.log("Response: ", res);
            var company_name = res.name;
            $('#companyName1').html(company_name);
            //console.log(company_name);
            $('#companyID').val(res.id);
            //$('#companyName1').val(company_name);
            $('#subsStartDate').val(res.subscription_start_date);
            $('#subsEndDate').val(res.subscription_end_date);
            $('#maxEmpLimit').val(res.max_employees_limit);
            $('#maxDeviceLimit').val(res.max_devices_limit);
            $('#maxTrnsLimit').val(res.max_transactions_limit);
            $('#maxMobileAppLimit').val(res.max_mobile_applications_limit);
            $('#maxWhatsappPushLimit').val(res.max_whatsapp_push_limit);
           var selected_features = [];
            for(var i = 0; i < features_records_edit.length; i++) {
                if(res.feature_name.includes(features_records_edit[i].name)) {
                    selected_features.push(features_records_edit[i].id);
                }
            }
            $('#companyFeatureList').val(selected_features);
            //console.log("Selected Features List", selected_features);
        }
    });
}
//end
//Company Details Update
    /*-- Update - Price Strategies --*/
$('#updateCompanyDetails').on('click', function (event) {
    event.preventDefault();
        var id = $('#companyID').val();
        var subscription_end_date = $('#subsEndDate').val();
        //var sub_end_date_formatted = formatDate(subscription_end_date);
        var max_employees_limit = $('#maxEmpLimit').val();
        var max_devices_limit = $('#maxDeviceLimit').val();
        var max_transactions_limit = $('#maxTrnsLimit').val();
        var max_mobile_applications_limit = $('#maxMobileAppLimit').val();
        var max_whatsapp_push_limit = $('#maxWhatsappPushLimit').val();
        // var price_strat_feature = $('#priceStrategiesFeature_post').val();
        var company_features = [];
        $.each($("#companyFeatureList option:selected"), function(){
            company_features.push($(this).val());
        });
        var obj_data = {
            subscription_end_date: subscription_end_date,
            max_employees_limit: max_employees_limit,
            max_devices_limit: max_devices_limit,
            max_transactions_limit: max_transactions_limit,
            max_mobile_applications_limit: max_mobile_applications_limit,
            max_whatsapp_push_limit: max_whatsapp_push_limit,
            feature: company_features
        };
        $.ajax({
            url: '/cloud/api/v1/internal/companies/'+id+'/',
            type: 'PUT',
            data: JSON.stringify(obj_data),
            dataType: "json",
            contentType: "application/json",
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                $('#editCompanyDetails').modal('hide');
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

/*-- Delete - Company --*/
function deleteCompanyDetails(id){
    //alert('DELETE COMPANY');

    $('#allCompany').modal('hide');
    $('#deleteConfirmation').modal('show');
    $('#deleteConfirmationMsg').html("All the company's content will be deleted and cannot be retrieved.");



      $("#confirmDeleteBtn").on('click',function(e){
          $.ajax({
            url: '/cloud/api/v1/internal/companies/'+id+'/',
            type: "DELETE",
            data: '',
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                location.reload();
            },

        });
      });
}
/*-- //End --*/

/*-- Delete - User --*/
function deleteUser(id){
    //alert("DELETE USER");

    $('#allUser').modal('hide');
    $('#deleteConfirmation').modal('show');
    $('#deleteConfirmationMsg').html("User will be deleted and cannot be retrieved.");
      $("#confirmDeleteBtn").on('click',function(e){
          layui.use(['element', 'layer'], function () {
            $.ajax({
            url: '/cloud/api/v1/internal/users/'+id+'/',
            type: "DELETE",
            data: '',
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                if (res.msg){
                    layer.msg(res.msg, {icon: 5});
                }else{
                    location.reload();
                }
            },
            });
          });
      });
}
/*-- //End --*/

/*-- Delete - Device --*/
function deleteDevice(id){
    //alert("DELETE DEVICE");
    $('#allDevice').modal('hide');
    $('#deleteConfirmation').modal('show');
    $('#deleteConfirmationMsg').html("Device will be deleted and cannot be retrieved.");
      $("#confirmDeleteBtn").on('click',function(e){
          $.ajax({
            url: '/cloud/api/v1/internal/devices/'+id+'/',
            type: "DELETE",
            data: '',
            headers:{"X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()},
            success: function (res, status, xhr) {
                location.reload();
            },

        });
      });
}
/*-- //End --*/

// var features_records_edit = [];
$(function() {
    /*--********** FEATURES **********--*/
    /*-- Get All - Features --*/
    $.ajax({
        url: '/cloud/api/v1/internal/features/',
        type: 'GET',
        success: function (res, status, xhr) {
            // console.log("All Feature: ", res);
            for (var j = 0; j < res.data.length; j++) {
                var records = res.data[j];
                features_records_edit.push(records);
                $("#companyFeatureList").append(
                    '<option value="' + res.data[j].id + '">' + res.data[j].name + '/' + res.data[j].country + '</option>'
                );
            }
        }
    });
});
/*-- //End --*/
//

/*-- Company Edit Form Validation --*/
$('#validateCompanyDetails').on('click', function() {
    var subsStartDate = $('#subsStartDate').val();
    var subsEndDate = $('#subsEndDate').val();
    var maxEmpLimit = $('#maxEmpLimit').val();
    var maxDeviceLimit = $('#maxDeviceLimit').val();
    var maxTrnsLimit = $('#maxTrnsLimit').val();
    var maxMobileAppLimit = $('#maxMobileAppLimit').val();
    var maxWhatsappPushLimit = $('#maxWhatsappPushLimit').val();
    var companyFeatureList = $('#companyFeatureList').val();

    var startDate = new Date(subsStartDate);
    var endDate = new Date(subsEndDate);

    //console.log("Start Date", startDate);
    //console.log("End Date", endDate);

    if (startDate > endDate || subsEndDate == "" ) {
        $('#subsEndDate').css("border-color", "red");
        if(startDate > endDate) {
            $('#errorSubsEndDate').html("*The subscription end date cannot be less than the subscription start date.");
        }
        if (subsEndDate == "") {
            $('#errorSubsEndDate').html("*This field is required!");
        }
    }
    else {
        $('#subsEndDate').css("border-color", "green");
        $('#errorSubsEndDate').html("");
    }

    if (maxEmpLimit == 0 || maxEmpLimit == "" || isNaN(maxEmpLimit) ) {
        $('#maxEmpLimit').css("border-color", "red");
        if (maxEmpLimit == 0) {
            $('#errorMaxEmpLimit').html("*Ensure this value is greater than or equal to 1.");
        }
        if (maxEmpLimit == ""  || isNaN(maxDeviceLimit)){
            $('#errorMaxEmpLimit').html("*This field is required!");
        }
        //alert(maxEmpLimit);
    }
    else {
        $('#maxEmpLimit').css("border-color", "green");
        $('#errorMaxEmpLimit').html("");
    }
    if (maxDeviceLimit == 0 || maxDeviceLimit == "" || isNaN(maxDeviceLimit)) {
        $('#maxDeviceLimit').css("border-color", "red");
        if(maxDeviceLimit == 0) {
            $('#errorMaxDeviceLimit').html("*Ensure this value is greater than or equal to 1.");
        }
        if(maxDeviceLimit == "" || isNaN(maxDeviceLimit)) {
            $('#errorMaxDeviceLimit').html("*This field is required!");
        }

    }
    else {
        $('#maxDeviceLimit').css("border-color", "green");
        $('#errorMaxDeviceLimit').html("");
    }
    if (maxTrnsLimit == 0 || maxTrnsLimit == "" || isNaN(maxTrnsLimit)) {
        $('#maxTrnsLimit').css("border-color", "red");
        if (maxTrnsLimit == 0) {
            $('#errorMaxTrnsLimit').html("*Ensure this value is greater than or equal to 1.");
        }
        if (maxTrnsLimit == "" || isNaN(maxTrnsLimit)) {
            $('#errorMaxTrnsLimit').html("*This field is required!");
        }
    }
    else {
        $('#maxTrnsLimit').css("border-color", "green");
        $('#errorMaxTrnsLimit').html("");
    }
    if (maxMobileAppLimit == 0 || maxMobileAppLimit == "" || isNaN(maxMobileAppLimit)) {
        $('#maxMobileAppLimit').css("border-color", "red");
        if(maxMobileAppLimit == 0) {
          $('#errorMobileAppLimit').html("*Ensure this value is greater than or equal to 1.");
        }
        if (maxMobileAppLimit == "" || isNaN(maxMobileAppLimit)) {
            $('#errorMobileAppLimit').html("*This field is required!");
        }
    }
    else {
        $('#maxMobileAppLimit').css("border-color", "green");
        $('#errorMobileAppLimit').html("");
    }
    if (maxWhatsappPushLimit == 0 || maxWhatsappPushLimit == "" || isNaN(maxWhatsappPushLimit)) {
        $('#maxWhatsappPushLimit').css("border-color", "red");
        if (maxWhatsappPushLimit == 0) {
             $('#errorWhatsappPushLimit').html("*Ensure this value is greater than or equal to 1.");
        }
        if (maxWhatsappPushLimit == "" || isNaN(maxWhatsappPushLimit)) {
             $('#errorWhatsappPushLimit').html("*This field is required!");
        }
    }
    else {
        $('#maxWhatsappPushLimit').css("border-color", "green");
        $('#errorWhatsappPushLimit').html("");
    }
     if (companyFeatureList == "") {
        $('#companyFeatureList').css("border-color", "red");
        $('#errorCompanyFeatureList').html("*This field is required!");
    }
    else {
        $('#companyFeatureList').css("border-color", "green");
        $('#errorCompanyFeatureList').html("");
    }
});



    // End
//Date Format
function myDateFormat(userDate) {
        var d = new Date(userDate);
        var year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
        var month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
        var day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
        return  day + '-' + month + '-' + year;

}
function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}
//


 /*-- //End --*/