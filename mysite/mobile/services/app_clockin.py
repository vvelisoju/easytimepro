# -*- coding: utf-8 -*-
from collections import OrderedDict
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import SUCCESS_CODE, MESSAGE_CODE, request_valid, user_photo, stamp2datetime, datetime2stamp, \
    online_employee_new, interface_response, get_describe, SYSTEM_EXCEPTION, DATA_EXCEPTION, paging, date_period, \
    save_capture, get_first_day, get_last_day
import json
from django.utils.translation import gettext_lazy as _
from django.db.models import FloatField, F
from django.db.models.aggregates import Sum
from django.core.cache import cache

class BioTimeAppClockIn(object):
    """
    【Clock In】
    """

    @request_valid
    @ladonize(int, str, str, str, str, str, str, int, str, str, str, rtype=str)
    def upload_transaction(self, punch_time, punch_type, work_code, capture, longitude, latitude, location, source,
                           device_token, language, token):
        """
        Upload transaction
        @param punch_time:      punch time(stamp)
        @param punch_type:      punch type( BioTimeAppManualLog -> category)
        @param work_code:       work code( BioTimeAppManualLog -> work_code)
        @param capture:         punch photo (base64)
        @param longitude:       longitude(GPS)
        @param latitude:        latitude(GPS)
        @param location:        locationi
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success:
                {"code": 1, "error": "", "describe": "", "message": "", "data":{"location":"", "punch_time":"punch time(stamp)"}}
            fail:
                {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        import codecs
        import datetime
        from mysite.iclock.models.model_transaction import Transaction
        from mysite.iclock.models.model_workcode import TerminalWorkCode
        from pytz import timezone, country_timezones
        from mysite.mobile.utils import valid_distance_check
        from django.conf import settings
        from mysite.mobile import tasks
        from mysite.att.utils import has_schedule
        emp = online_employee_new(device_token)

        if punch_time:
            if emp.app_punch_status == 0:
                error = ''
                describe = _('app_punch_status_disabled')
                message = u"{0}".format(_('app_punch_status_must_be_enabled'))
                return interface_response(MESSAGE_CODE, '', error, describe, message)
            elif not longitude or not latitude:
                error = ''
                describe = _('longitude_or_latitude_missing')
                message = u"{0}".format(_('app_clockIn_gps_required'))
                return interface_response(MESSAGE_CODE, '', error, describe, message)
            try:
                if source in (1,):
                    location = json.loads(location)
                    country_code = location['CountryCode']
                    formattedaddresslines = location.get('FormattedAddressLines', None)
                    if formattedaddresslines:
                        location = ' - '.join(formattedaddresslines)
                else:
                    location = json.loads(location)
                    country_code = location[0]['mCountryCode']
                    location = location[0]['mAddressLines']['0']
            except Exception as e:
                error = ''
                describe = '{0}'.format(e)
                message = "{0}".format(_('app_clockIn_invalid_gps'))
                return interface_response(MESSAGE_CODE, '', error, describe, message)
            if settings.ACTIVE_APP_LOCATION:
                result = valid_distance_check(emp, longitude, latitude)
                if result:
                    return interface_response(MESSAGE_CODE, '', '', '', result)
            stamp_punch_time = punch_time
            if country_code:
                if settings.CLOUD_VERSION:
                    from timezonefinder import TimezoneFinder
                    # server_tz = settings.TIME_ZONE
                    # print("[*]Country Code:{0}".format(country_code))
                    # tzname = country_timezones[country_code]
                    # print("[*]TZ Name:{0}".format(tzname))
                    tz = timezone(TimezoneFinder().timezone_at(lat=float(latitude), lng=float(longitude)))
                else:
                    try:
                        from tzfpy import get_tz
                        tz = timezone(get_tz(float(longitude),float(latitude)))
                    except:
                        tz = timezone('Asia/Kolkata')   
                # s_tz = timezone(server_tz)
                local_time = datetime.datetime.now(tz)
                punch_time = stamp2datetime(stamp_punch_time, tz=tz)
                # print("[*]Country Location Time:", local_time)
                # server_time = stamp2datetime(stamp_punch_time, tz=s_tz)
                # server_time = server_time.replace(tzinfo=None)
                # local_time = local_time.replace(tzinfo=None)
                # punch_time = punch_time.replace(tzinfo=None)
                # print("[*]Server Time:", local_time, punch_time)
                transfer_time = (local_time - punch_time).total_seconds()
                # transfer_time_seconds = abs(transfer_time.days * 24 * 60 * 60 + transfer_time.seconds)
                # print("[*]Transfer time:", transfer_time_seconds)
                transfer_time = abs(transfer_time)
                if transfer_time > 60:
                    message = u"{0}".format(_('app_clockIn_invalid_punch_time'))
                    return interface_response(MESSAGE_CODE, '', '', '', message)
            else:
                message = "{0}".format(_('app_clockIn_invalid_gps'))
                return interface_response(MESSAGE_CODE, '', '', '', message)
            now = datetime.datetime.now()
            punch_time = punch_time.replace(tzinfo=None)
            if capture:
                try:
                    if settings.ACTIVE_CELERY:
                        start = datetime.datetime.now()
                        tasks.save_clock_capture.delay(emp.emp_code, punch_time, capture)
                        end = datetime.datetime.now()
                        duration = (end - start).seconds
                        # print('>>>>>>>>use celery time:', duration)
                    else:
                        start = datetime.datetime.now()
                        save_capture(emp.emp_code, punch_time, capture)
                        end = datetime.datetime.now()
                        duration = (end - start).seconds
                        # print('>>>>>>without celery time:', duration)
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    message = "{0}".format(_('app_clockIn_upload_failed'))
                    return interface_response(MESSAGE_CODE, '', '', e, message)
            work_code = work_code.strip()
            if work_code:
                wcs = TerminalWorkCode.objects.filter(id=work_code).values_list('code', flat=True)
                if wcs:
                    work_code = wcs[0]
                else:
                    describe = "{0}".format(_('app_clockIn_invalid_workcode'))
                    return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)

            has_schedule = has_schedule(emp, punch_time)
            if not has_schedule:
                message = "{0}".format(_("no_employee_schedule") % emp.first_name)
                return interface_response(MESSAGE_CODE, '', 'error', 'describe', message)

            tsn = Transaction()
            tsn.emp_code = emp.emp_code
            tsn.emp = emp
            tsn.punch_time = punch_time
            # tsn.server_time = server_time
            tsn.company_id = emp.company.id
            tsn.verify_type = 101
            tsn.work_code = work_code
            tsn.punch_state = punch_type or 255
            tsn.longitude = longitude and float(longitude) or None
            tsn.latitude = latitude and float(latitude) or None
            tsn.gps_location = location
            tsn.mobile = source
            tsn.terminal_sn = 'App'
            tsn.source = 3
            tsn.upload_time = now
            tsn.save()
            cache.set(
            "%s_logstamp_" % (settings.UNIT),
            str(datetime.datetime.now()),
            timeout=5 * 60,
        )  # for realMonitor

            return interface_response(SUCCESS_CODE, json.dumps({'location': location, 'punch_time': stamp_punch_time}),
                                      '', 'successful')
        else:
            describe = "{0}".format(_('app_clockIn_upload_failed'))
            message = "{0}".format(_('app_clockIn_upload_failed'))
            return interface_response(MESSAGE_CODE, '', '', describe, message)

    @request_valid
    @ladonize(int, int, str, str, str, rtype=str)
    def pull_transaction(self, current_day, source, device_token, language, token):
        """
        get transaction log
        @param current_day:    (stamp)
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success:
                {"code": 1, "error": "", "describe": "", "message": "", "data":[{"punch_time": 1513699200, "punch_type": "0", "source": 3, "describe": "source/terminal_sn/gps_location"}, ]}
                source(transaction source): (1, terminal), (2,manual log), (3, APP)
            fail:
                {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        from mysite.att.att_param import get_func_key
        from mysite.iclock.models import Transaction
        from mysite.att.models import OutdoorTrack
        from mysite.att.utils import time_format
        import datetime
        try:
            current_day = stamp2datetime(current_day)
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            ts = Transaction.objects.filter(
                emp_id=emp.id, punch_time__year=current_day.year, punch_time__month=current_day.month,
                punch_time__day=current_day.day).order_by('-punch_time')[:3].values_list(
                'punch_time', 'verify_type', 'source', 'terminal_sn', 'gps_location')
            if ts:
                choices = get_func_key(key=None, company_id=company_id)
                types = dict(choices)
                data = [{'punch_time': datetime2stamp(r[0]), 'punch_type': types.get(r[1], ''), 'source': r[2] or 1,
                         'describe': get_describe(r[2], r[3], r[4]), 'outdoor': False} for r in ts]
            else:
                data = []
            today = datetime.datetime.now()
            emp_outdoor = OutdoorTrack.objects.filter(employee_id=emp.id, company_id=company_id)
            emp_outdoor = emp_outdoor.filter(date=today)[0:3]
            from mysite.att.models.model_clientdetails import ClientDetails
            outdoor_punch_display = []
            if emp_outdoor:
                for r in emp_outdoor:
                    describe = ''
                    try:
                        client_details = ClientDetails.objects.filter(id=r.client_id).first()
                        describe = client_details.address
                    except:
                        pass
                    if r.checkin:
                        check_in_date_time = datetime.datetime.combine(r.date, time_format(r.checkin))
                        punch_state = _("timeInterval_field_checkIn")
                        outdoor_item_check_in = {
                            'punch_time': datetime2stamp(check_in_date_time),
                            'punch_type': str(punch_state), 'source': 3,
                            'describe': r.checkin_address, 'outdoor': True
                        }
                        outdoor_punch_display.append(outdoor_item_check_in)
                    if r.checkout:
                        check_out_date_time = datetime.datetime.combine(r.date, time_format(r.checkout))
                        punch_state = _("timeInterval_field_checkOut")
                        outdoor_item_check_out = {
                            'punch_time': datetime2stamp(check_out_date_time),
                            'punch_type': str(punch_state), 'source': 3,
                            'describe': r.checkout_address, 'outdoor': True
                        }
                        outdoor_punch_display.append(outdoor_item_check_out)
            else:
                outdoor_punch_display = []
            final_punches_display = data + outdoor_punch_display
            final_punches_display_order_wise = sorted(final_punches_display, key=lambda k: k['punch_time'],
                                                      reverse=True)
            return interface_response(SUCCESS_CODE, json.dumps(final_punches_display_order_wise), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(str, int, int, str, int, str, str, str, rtype=str)
    def pull_all_transaction(self, pin, current_day, page_num, search_item, source, device_token, language, token):
        """
        get all transaction
        @param pin:            emp_code, return employee list when emp_code is null
        @param current_day:
        @param page_num:        page number（15items/page）
        @param search_item      search employee by emp_code or name
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:   Token for push message
        @param language:
        @param token:
        @rtype:
            pin is not null ,success
                {"code": 1,"error":"", "describe":"", "message":"", "data":[{"pin": "emp_code", "name":"first_name", "photo":"photo address"}, ]}
            pin is null ,success:
                {"code": 1,"error":"", "describe":"", "message":"", "data":[{"punch_time": "punch time(stamp)", "punch_type":"punch type", "source":1, "describe": "terminal_sn"}, ]}
                source(transaction source): (1, terminal), (2,manual log), (3, APP)
            fail:
                {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        from mysite.sql_utils import get_sql, p_query
        from mysite.att.att_param import get_func_key
        from mysite.att.utils import time_format
        from mysite.mobile.utils import employee_transaction_paging
        import datetime
        from collections import defaultdict
        current_day = stamp2datetime(current_day)
        emp = online_employee_new(device_token)
        app_role = emp.app_role
        company_id = emp.department.company.id
        company_hex_id = emp.company.hex_id
        outdoorpunch_data = []
        try:
            pin = pin.strip()
            previous_day = current_day + datetime.timedelta(days=-7)
            params = {
                'current_day': current_day.strftime('%Y-%m-%d %H:%M:%S'),
                'previous_day': previous_day.strftime('%Y-%m-%d %H:%M:%S'),
                'company_hex_id': company_hex_id
            }
            # support pagination
            PAGE_SIZE = 15
            begin = (page_num - 1) * PAGE_SIZE
            end = page_num * PAGE_SIZE
            if not pin:
                search_item = search_item.strip()
                if search_item:
                    params['emp_code'] = '%{0}%'.format(search_item)
                    sql = get_sql('sql', sqlid='transaction_employee_search_by_empCode', app="mobile", params=params)
                else:
                    if app_role != 2:
                        params['emp_id'] = emp.id
                        params['department'] = emp.department.id
                        sql = get_sql('sql', sqlid='transaction_department', app="mobile", params=params)
                    else:
                        params['emp_id'] = emp.id
                        sql = get_sql('sql', sqlid='transaction_employee', app="mobile", params=params)
                sql = employee_transaction_paging(sql, sort_name='emp_code', sort_order='desc')
                rows = p_query(sql)
                data = []
                if rows:
                    data = [{'pin': r[0], 'name': r[1], 'photo': user_photo(r[0])} for r in rows]
                return interface_response(SUCCESS_CODE, json.dumps(data[begin:end]), '', '')
            else:
                from mysite.iclock.models.model_transaction import Transaction
                import datetime
                from operator import itemgetter
                from mysite.att.models.model_outdoortrack import OutdoorTrack
                from mysite.personnel.models.model_employee import Employee
                employee = Employee.objects.get(emp_code=pin, company_id=company_id)
                today = datetime.datetime.now()
                last_seven_days = today - datetime.timedelta(days=7)
                employee_trans = Transaction.objects.filter(
                    emp_id=employee, company_id=company_id,
                    punch_time__range=(last_seven_days, today)).order_by('-punch_time')
                employee_office_transaction_data = []
                if employee_trans:
                    choices = get_func_key(key=None, company_id=company_id)
                    types = dict(choices)
                    vals = OrderedDict()
                    for r in employee_trans:
                        category = r.punch_time.strftime('%Y-%m-%d')
                        if category not in vals:
                            vals[category] = []
                        item = {
                            'category': category, 'punch_time': datetime2stamp(r.punch_time),
                            'punch_type': types.get(r.punch_state, ''), 'source': r.source,
                            'describe': get_describe(r.source, r.terminal_sn, r.gps_location),
                            'outdoor': False
                        }
                        vals[category].append(item)
                    employee_office_transaction_data = [{'category': key, 'items': val} for key, val in vals.items()]
                emp_outdoor = OutdoorTrack.objects.filter(employee_id=employee, company_id=company_id)
                emp_outdoor = emp_outdoor.filter(date__range=(last_seven_days, today))
                from mysite.att.models.model_clientdetails import ClientDetails
                if emp_outdoor:  # -------------> This Is for to Show Employee Outdoor Punches In the Recent Punches of Mobile App
                    outdoor_vals = OrderedDict()
                    for r in emp_outdoor:
                        describe = ''
                        try:
                            client_details = ClientDetails.objects.filter(id=r.client_id).first()
                            describe = client_details.address
                        except:
                            pass
                        date = r.date.strftime('%Y-%m-%d')
                        if date not in outdoor_vals:
                            outdoor_vals[date] = []
                        if r.checkin:
                            check_in_date_time = datetime.datetime.combine(r.date, time_format(r.checkin))
                            punch_state = _("timeInterval_field_checkIn")
                            outdoor_item = {
                                'category': date, 'punch_time': datetime2stamp(check_in_date_time),
                                'punch_type': str(punch_state), 'source': 3,
                                'describe': r.checkin_address, 'outdoor': True
                            }
                            outdoor_vals[date].append(outdoor_item)
                        if r.checkout:
                            check_out_date_time = datetime.datetime.combine(r.date, time_format(r.checkout))
                            punch_state = _("timeInterval_field_checkOut")
                            outdoor_item = {
                                'category': date, 'punch_time': datetime2stamp(check_out_date_time),
                                'punch_type': str(punch_state), 'source': 3,
                                'describe': r.checkout_address, 'outdoor': True
                            }
                            outdoor_vals[date].append(outdoor_item)
                    outdoorpunch_data = [{'category': key, 'items': val} for key, val in outdoor_vals.items()]
            overall_punch_history = employee_office_transaction_data + outdoorpunch_data
            temp = defaultdict(list)
            for elem in overall_punch_history:
                temp[elem['category']].extend(elem['items'])
            final_punch_data = [
                {"category": category, "items": sorted(items, key=lambda k: k['punch_time'], reverse=True)} for
                category, items in temp.items()]
            final_punch_data_order_wise = sorted(final_punch_data, key=itemgetter('category'), reverse=True)
            return interface_response(SUCCESS_CODE, json.dumps(final_punch_data_order_wise[begin:end]), '', '')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, int, int, str, str, str, rtype=str)
    def pull_exception_summary(self, current_day, period, source, device_token, language, token):
        """
        get exception summary
        @param current_day:
        @param period:            time period(1：month 2：week)
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push messag
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"",""describe:"","data":{"late_count":Late times,"early_leave_count":Leave early times,
                "absent_count":Absent times,"leave_count":Leave times,"overtime_count":Overtime times,"current_day":Current day(stamp)}
            fail:
                {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        from django.db.models import Count, Value, When, Case
        from mysite.att.models import PayloadBase
        if period not in (1, 2):
            describe = 'period --> {0} error.'.format(period)
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
        stamp_current = current_day
        current_day = stamp2datetime(stamp_current)
        start, end = " ", " "
        if period in (1,):  # this is for Month
            end = get_last_day(current_day)
            start = get_first_day(current_day)
        elif period in (2,):  # this is for week
            start, end = date_period(4, current_day)
        emp = online_employee_new(device_token)
        obj_queryset = PayloadBase.objects.filter(emp_id=emp.id, att_date__gte=start, att_date__lte=end).values(
            'emp_id').annotate(
            late_count=Count(Case(When(late__gt=0, then=Value(1)))),
            early_leave_count=Count(Case(When(early_leave__gt=0, then=Value(1)))),
            absent_count=Sum(
                Case(
                    When(absent__gt=0, leave=0, then=1),
                    When(absent__gt=F('leave'), leave__gt=0, then=0.5),
                    output_field=FloatField()
                )
            ),
            leave_count=Sum(
                Case(
                    When(absent__gt=F('leave'), leave__gt=0, then=0.5),
                    When(leave__gt=F('absent'), total_worked=0, half_day=None, then=1),
                    When(leave__gt=0, total_worked=0, absent=0, then=1),
                    When(leave__gt=0, total_worked__gt=0, absent=0, then=0.5),
                    default=0,
                    output_field=FloatField()
                )
            ),
            overtime_count=Count(Case(When(overtime__total_ot__gt=0, then=Value(1))))
        )
        data = obj_queryset[0] if obj_queryset else \
            {'late_count': 0, 'early_leave_count': 0, 'absent_count': 0, 'leave_count': 0, 'overtime_count': 0}
        attendance = {
            'late_count': data['late_count'],
            'early_leave_count': data['early_leave_count'],
            'absent_count': data['absent_count'],
            'leave_count': data['leave_count'],
            'overtime_count': data['overtime_count'],
            'current_day': stamp_current
        }
        return interface_response(SUCCESS_CODE, json.dumps(attendance), '', 'successful')
