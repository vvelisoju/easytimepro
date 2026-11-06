# -*- coding: utf-8 -*-
import math
import json
from django.utils.translation import gettext_lazy as _

from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import MESSAGE_CODE, SUCCESS_CODE, SYSTEM_EXCEPTION, DATA_EXCEPTION, paging
from mysite.mobile.utils import request_valid, datetime2stamp, stamp2datetime, interface_response, \
    online_employee_new, user_photo


class BioTimeAppOutDoorManagement(object):
    """
    【Leave】
    """

    @request_valid
    @ladonize(str, int, str, str, str, rtype=str)
    def customers(self, search_item, source, device_token, language, token):
        """
        Get customers
        @param search_item:     search condition(company_name), return all data when this field is None
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":[{}]}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from django.db.models import Q
        from mysite.att.models.model_clientdetails import ClientDetails
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            customers = ClientDetails.objects.filter(company=company_id).order_by('id')
            search_item = search_item.strip()
            if search_item:
                customers = customers.filter(Q(company_name__icontains=search_item), company=company_id)
            choices = [
                {'id': obj.id, 'customer_name': obj.company_name, 'cust_id': obj.client_id,
                 'contact_person': obj.contact_person, 'contact_no': obj.mobile, 'latitude': obj.latitude,
                 'longitude': obj.longitude, 'punch_radius': obj.punch_location_radius, 'address': obj.address,
                 'branch': obj.branch, 'logo': '/files/' + str(obj.logo)} for obj in customers]
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(str, int, str, str, str, rtype=str)
    def customers_new(self, search_item, source, device_token, language, token):
        """
        Get customers
        @param search_item:     search condition(company_name), return all data when this field is None
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":[{}]}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from django.db.models import Q
        from mysite.att.models.model_clientdetails import ClientDetails
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            customers = ClientDetails.objects.filter(company=company_id).order_by('id')
            search_item = search_item.strip()
            if search_item:
                customers = customers.filter(Q(company_name__icontains=search_item), company=company_id)
                if customers is None:
                    choices = [{'id': "", 'customer_name': "", 'cust_id': ""}]
                    return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
            choices = [{'id': obj.id, 'customer_name': obj.company_name, 'cust_id': obj.client_id} for obj in customers]
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def schedule_planner(self, source, device_token, language, token):
        """
        Get schedule_planner
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":[{}]}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.att.models.model_outdoorscheduleplanner import OutdoorSchedulePlanner
        from mysite.att.models.model_clientdetails import ClientDetails
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            planner = OutdoorSchedulePlanner.objects.filter(company=company_id).order_by('id')
            choices = [
                {'id': obj.id, 'planner': obj.schedule_name,
                 'planner_details': obj.schedule_details} for obj in planner
            ]
            for data in choices:
                planner_details = json.loads(data['planner_details'])
                for data1 in planner_details:
                    clients = ClientDetails.objects.filter(id=data1['client_id'])
                    clients_details = [{'id': obj.id, 'customer_name': obj.company_name, 'cust_id': obj.client_id,
                                        'contact_person': obj.contact_person, 'contact_no': obj.mobile,
                                        'latitude': obj.latitude,
                                        'longitude': obj.longitude, 'punch_radius': obj.punch_location_radius,
                                        'address': obj.address, 'branch': obj.branch, 'logo': '/files/' + str(obj.logo)}
                                       for obj in clients]
                    data1['client_details'] = clients_details
                data['planner_details'] = planner_details
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(str, int, str, str, str, rtype=str)
    def schedule_employee(self, search_item, source, device_token, language, token):
        """
        Get schedule_employee
        @param search_item
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":[{}]}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.att.models.model_outdoorempschedule import OutdoorEmployeeSchedule
        from mysite.att.models.model_clientdetails import ClientDetails
        from django.db.models import Q
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            schEmployee = OutdoorEmployeeSchedule.objects.filter(employee__enable_outdoor_management=1,
                                                                 company=company_id).order_by('id')
            search_item = search_item.strip()
            if search_item:
                schEmployee = schEmployee.filter(
                    Q(employee__first_name__icontains=search_item) | Q(employee__emp_code__icontains=search_item),
                    company=company_id)
            else:
                schEmployee = OutdoorEmployeeSchedule.objects.filter(employee__enable_outdoor_management=1,
                                                                     company=company_id)
            choices = [{'id': obj.id, 'start_date': str(obj.start_date), 'end_date': str(obj.end_date),
                        'employee_id': obj.employee_id, 'employee_name': obj.employee.first_name,
                        'emp_code': obj.employee.emp_code, 'schedule_name': obj.schedule_planner.schedule_name,
                        'schedule_details': obj.schedule_planner.schedule_details, 'assigned_by': obj.assigned_by,
                        'photo': '/files/' + str(obj.employee.photo)} for obj in schEmployee]
            for data in choices:
                planner_details = json.loads(data['schedule_details'])
                for data1 in planner_details:
                    clients = ClientDetails.objects.filter(id=data1['client_id'])
                    clients_details = [{'id': obj.id, 'customer_name': obj.company_name, 'cust_id': obj.client_id,
                                        'contact_person': obj.contact_person, 'contact_no': obj.mobile,
                                        'latitude': obj.latitude,
                                        'longitude': obj.longitude, 'punch_radius': obj.punch_location_radius,
                                        'address': obj.address, 'branch': obj.branch, 'logo': '/files/' + str(obj.logo)}
                                       for obj in clients]
                    data1['client_details'] = clients_details
                data['schedule_details'] = planner_details
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def my_schedule(self, source, device_token, language, token):
        """
        Get my_schedule
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
        success
            {"code":1,"error":"","describe":"","message":"","data":[{}]}
        fail
            {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.att.models.model_outdoorempschedule import OutdoorEmployeeSchedule
        from mysite.att.models.model_clientdetails import ClientDetails
        emp = online_employee_new(device_token)
        try:
            schEmployee = OutdoorEmployeeSchedule.objects.filter(employee_id=emp.id)

            choices = [{'id': obj.id, 'start_date': str(obj.start_date), 'end_date': str(obj.end_date),
                        'employee_id': obj.employee_id, 'employee_name': obj.employee.first_name,
                        'emp_code': obj.employee.emp_code, 'schedule_name': obj.schedule_planner.schedule_name,
                        'schedule_details': obj.schedule_planner.schedule_details, 'assigned_by': obj.assigned_by,
                        'photo': '/files/' + str(obj.employee.photo)} for
                       obj in schEmployee]
            for data in choices:
                planner_details = json.loads(data['schedule_details'])
                for data1 in planner_details:
                    clients = ClientDetails.objects.filter(id=data1['client_id'])
                    clients_details = [{'id': obj.id, 'customer_name': obj.company_name, 'cust_id': obj.client_id,
                                        'contact_person': obj.contact_person, 'contact_no': obj.mobile,
                                        'latitude': obj.latitude,
                                        'longitude': obj.longitude, 'punch_radius': obj.punch_location_radius,
                                        'address': obj.address, 'branch': obj.branch} for obj in clients]
                    data1['client_details'] = clients_details
                data['schedule_details'] = planner_details
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(str, int, str, str, str, int, str, int, str, float, float, str, int, str, str, str, rtype=str)
    def apply(self, date, punch_type, address, punch_time, capture, schedule_type, schedule_id, client_id, client_name,
              latitude,
              longitude, summary, source, device_token, language, token):
        """
        Apply employee punch status
        @param date
        @param punch_type
        @param punch_time
        @param capture
        @param schedule_type
        @param schedule_id
        @param client_id
        @param latitude
        @param longitude
        @param summary:
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code": 1, "error": "", "describe": "", "message": "", "data":{"message":"Pop-up message"}}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        import datetime
        # from mysite.att.models.model_clientdetails import ClientDetails
        from mysite.att.models import ClientDetails
        import json
        from mysite.att.models.model_outdoorempschedule import OutdoorEmployeeSchedule
        from mysite.att.models.model_outdoorscheduleplanner import OutdoorSchedulePlanner
        from mysite.att.models.model_outdoortrack import OutdoorTrack
        emp = online_employee_new(device_token)
        company_id = emp.company_id
        fetch_address = json.loads(address)
        if type(fetch_address) == type([]):
            fetch_address = fetch_address[0]["mAddressLines"]["0"]
        else:
            fetch_address = ','.join(fetch_address["FormattedAddressLines"])
        planner = OutdoorSchedulePlanner.objects.values_list('schedule_details')
        if punch_time:
            if not longitude or not latitude:
                error = ''
                describe = _('longitude_or_latitude_missing')
                message = u"{0}".format(_('app_clockIn_gps_required'))
                return interface_response(MESSAGE_CODE, '', error, describe, message)
        else:
            describe = u"{0}".format(_('app_clockIn_upload_failed'))
            message = u"{0}".format(_('app_clockIn_upload_failed'))
            return interface_response(MESSAGE_CODE, '', '', describe, message)
        try:
            client_details = ClientDetails.objects.get(id=client_id, company_id=company_id)
        except ClientDetails.DoesNotExist:
            client_details = None
        if client_details is None:
            try:
                from mysite.att.models.model_outdoortrack import OutdoorTrack
                obj = OutdoorTrack()
                obj.employee = emp
                obj.schedule_type = schedule_type
                obj.client_name = client_name
                obj.date = date
                # if schedule_id:
                #     obj.schedule = schedulePlanner_details
                if punch_type == 0:
                    obj.checkin = punch_time
                    obj.checkin_latitude = latitude
                    obj.checkin_longitude = longitude
                    obj.checkin_address = fetch_address
                    obj.checkin_capture = capture
                    obj.summary = summary
                    obj.company_id = company_id
                else:
                    obj.checkout = punch_time
                    obj.checkout_latitude = latitude
                    obj.checkout_longitude = longitude
                    obj.checkout_address = fetch_address
                    obj.checkout_capture = capture
                    obj.summary = summary
                    obj.company_id = company_id
                obj.save()
                data = {
                    'message': u'{0}'.format(_(u'Request already processing'))
                }
                return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
            except Exception as e:
                print()
                import traceback
                traceback.print_exc()
                return interface_response(MESSAGE_CODE, '', '', e, u'{0}'.format(e))
        else:
            for each in planner:
                datas = eval(each[0])
                if datas:
                    for each in datas:
                        c_id=each.get("client_id")
                        if c_id ==client_id:
                            timing = each
                            in_time = timing['inclock']
                            out_time = timing['outclock']
                            dates = timing['dates']
                            if date == dates:
                                if punch_time > out_time or punch_time < in_time:
                                    error = ''
                                    describe = _('app_outdoor_clockIn_invalid_punch_time')
                                    message = _('app_outdoor_clockIn_invalid_punch_time')
                                    return interface_response(MESSAGE_CODE, '', error, describe, message)
                                else:
                                    if schedule_id:
                                        scheduleEmp_details = OutdoorEmployeeSchedule.objects.get(id=schedule_id, company_id=company_id)
                                        schedulePlanner_details = OutdoorSchedulePlanner.objects.get(
                                            id=scheduleEmp_details.schedule_planner.id, company_id=company_id)
                                    punched_radius = distance((client_details.latitude, client_details.longitude),
                                                              (latitude, longitude))  # result will be in KM
                                    actual_radius = (client_details.punch_location_radius) / 1000  # converting meters to KM
                                    if punched_radius > actual_radius:
                                        error = ''
                                        describe = _('invalid_punched_location')
                                        message = _('invalid_punched_location')
                                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                                    if punch_type == 1:
                                        outDoorTrack = OutdoorTrack.objects.filter(employee_id=emp, client_id=client_id,
                                                                                   schedule_type=schedule_type, date=date,
                                                                                   company_id=company_id)
                                        if outDoorTrack:
                                            pass
                                        else:
                                            error = ''
                                            describe = _('please_select_punch_type_as_check-in')
                                            message = _('please_select_punch_type_as_check-in')
                                            return interface_response(MESSAGE_CODE, '', error, describe, message)
                                    try:
                                        from mysite.att.models.model_outdoortrack import OutdoorTrack
                                        obj = OutdoorTrack()
                                        obj.employee = emp
                                        obj.schedule_type = schedule_type
                                        obj.client = client_details
                                        obj.client_name = client_name
                                        if schedule_id:
                                            obj.schedule = schedulePlanner_details
                                        obj.date = date
                                        if punch_type == 0:
                                            obj.checkin = punch_time
                                            obj.client_name = client_details.company_name
                                            obj.checkin_latitude = latitude
                                            obj.checkin_longitude = longitude
                                            obj.checkin_address = fetch_address
                                            obj.checkin_capture = capture
                                            obj.summary = summary
                                            obj.company_id = company_id
                                        else:
                                            obj.checkout = punch_time
                                            obj.client_name = client_details.company_name
                                            obj.checkout_latitude = latitude
                                            obj.checkout_longitude = longitude
                                            obj.checkout_address = fetch_address
                                            obj.checkout_capture = capture
                                            obj.summary = summary
                                            obj.company_id = company_id
                                        obj.save()
                                        data = {
                                            'message': u'{0}'.format(_(u'Request already processing'))
                                        }
                                        return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
                                    except Exception as e:
                                        import traceback
                                        traceback.print_exc()
                                        return interface_response(MESSAGE_CODE, '', '', e, u'{0}'.format(e))
                            else:
                                error = ''
                                describe = _('app_outdoor_clockIn_invalid_punch_date')
                                message = _('{date}_you_dont_have_{company}_schedule_planner').format(date=date,company=client_details)
                                return interface_response(MESSAGE_CODE, '', error, describe, message)

    @request_valid
    @ladonize(str, str, int, str, int, str, str, str, rtype=str)
    def outdoor_schedule_report(self, start_date, end_date, schedule_type, employee_id, source, device_token, language,
                                token):
        """
                outdoor_schedule_report
                @param start_date
                @param end_date
                @param schedule_type
                @param employee_id
                @param source:          data source(1: IOS， 2：Android)
                @param device_token:    Token for push message
                @param language:
                @param token:
                @rtype:
                success
                    {"code":1,"error":"","describe":"","message":"","data":[{}]}
                fail
                    {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
                """
        from mysite.att.models import OutdoorTrack
        from mysite.personnel.models import Employee
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            if employee_id != '-1':
                outdoor_details = OutdoorTrack.objects.filter(employee_id=employee_id, schedule_type=schedule_type,
                                                              company=company_id,  date__gte=start_date,
                                                              date__lte=end_date)
            else:
                outdoor_details = OutdoorTrack.objects.filter(employee_id=emp.id, schedule_type=schedule_type,
                                                              company=company_id, date__gte=start_date,
                                                              date__lte=end_date)
            try:
                choices = [{'emp_id': obj.employee_id, 'emp_name': obj.employee.first_name, 'client_id': obj.client_id,
                            'schedule_id': obj.schedule_id, 'image_in': obj.checkin_capture,
                            'image_out': obj.checkout_capture, 'date': str(obj.date),
                            'checkin-time': str(obj.checkin), 'checkin-latitude': obj.checkin_latitude,
                            'checkin-longitude': obj.checkin_longitude, 'checkout-time': str(obj.checkout),
                            'checkout-latitude': obj.checkout_latitude,
                            'checkout-longitude': obj.checkout_longitude, 'summary': obj.summary,
                            'client_name': obj.client.company_name, 'schedule_name': obj.schedule.schedule_name} for obj
                           in outdoor_details]
                return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
            except:
                choices = [{'emp_id': obj.employee_id, 'emp_name': obj.employee.first_name, 'client_id': obj.client_id,
                            'schedule_id': obj.schedule_id, 'image_in': obj.checkin_capture,
                            'image_out': obj.checkout_capture, 'date': str(obj.date),
                            'checkin-time': str(obj.checkin), 'checkin-latitude': obj.checkin_latitude,
                            'checkin-longitude': obj.checkin_longitude, 'checkout-time': str(obj.checkout),
                            'checkout-latitude': obj.checkout_latitude,
                            'checkout-longitude': obj.checkout_longitude, 'summary': obj.summary,
                            'client_name': obj.client_name} for obj
                           in outdoor_details]
                return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def outdoor_schedule_employee(self, source, device_token, language, token):
        """
            outdoor_schedule_report
            @param source:          data source(1: IOS， 2：Android)
            @param device_token:    Token for push message
            @param language:
            @param token:
            @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":[{}]}
                fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        emp = online_employee_new(device_token)
        company_id = emp.department.company.id
        from mysite.personnel.models import Employee
        from django.db.models import Q
        try:
            outdoor_employees = Employee.objects.filter(~Q(id=emp.id), enable_outdoor_management=1,
                                                        company_id=company_id)
            choices = [{'id': obj.id, 'emp_name': obj.first_name, 'emp_code': obj.emp_code} for obj in
                       outdoor_employees]
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)


def distance(origin, destination):
    lat1, lon1 = origin
    lat2, lon2 = destination
    radius = 6371  # km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) * math.sin(dlat / 2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon / 2) * math.sin(dlon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    d = radius * c

    return d
