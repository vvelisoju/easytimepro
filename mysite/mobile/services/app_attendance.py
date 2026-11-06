# -*- coding: utf-8 -*-
import json

from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import request_valid, stamp2datetime, datetime2stamp, online_employee_new, get_hr_min, \
    get_hr_min_sec
from mysite.mobile.utils import SUCCESS_CODE, MESSAGE_CODE, SYSTEM_EXCEPTION, DATA_EXCEPTION, interface_response, \
    user_photo, WEEKDAY, format_date

from django.utils.translation import gettext_lazy as _


class BioTimeAppAttendance(object):
    """
    【Attendance】
    """

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def date(self, source, device_token, language, token):
        """
        get date choices
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype: execute result
            success:
                {"code":1, "error":"", "describe":"", "message":"", "data": [{"code":value,"name":"display name"}]}
                when code = 1, it's user defined
            fail:
                {"code":-10001, "error":"", "describe":"", "message":"Pop-up message", "data": ""}
        """
        from django.utils.encoding import force_str
        data = [
            {'code': 2, 'name': force_str(_('app_attendance_date_today'))},
            {'code': 3, 'name': force_str(_('app_attendance_date_yesterday'))},
            {'code': 4, 'name': force_str(_('app_attendance_date_this_week'))},
            {'code': 5, 'name': force_str(_('app_attendance_date_last_week'))},
            {'code': 6, 'name': force_str(_('app_attendance_date_this_month'))},
            {'code': 7, 'name': force_str(_('app_attendance_date_last_month'))},
            {'code': 1, 'name': force_str(_('app_attendance_date_user-defined'))},
        ]
        return interface_response(SUCCESS_CODE, json.dumps(data), '', '')

    @request_valid
    @ladonize(str, str, str, int, int, int, int, int, str, str, str, rtype=str)
    def pull_attendance(self, search_item, pin, department, date, start, end, page_num, source, device_token, language,
                        token):
        """
        get attendance log
        @param search_item:     query condition (emp_code/name), null
        @param pin:             emp_code,
            1：Attendance -> My Attendance（uplaod emp_code, return attendance log）
            2：Attendance -> Staff Attendance(emp_code is null，return employees list)
        @param department:　    department, joined by ','
        @param date:            date（1， 2， 3， 4， 5， 6， 7）
            1  used as User Defined，when select 1, Start and End are required.
        @param page_num:        15items/page
        @param start:           start date（stamp）
        @param end:             end date（stamp）
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype: execute result
            success：
                {"code":1,"error":"","describe":"","message":"",
                "data":[{"weekday":"","date":"","clock_in":"check in(stamp)",
                "in_describe":"when clock_in=0 display this value(string)","clock_out":"check out (stamp)",
                "out_describe":"when clock_out=0 display this value(string)",
                "total_describe":"","total":"work time(00:00)"}]}
            fail:
                {"code":-10001, "error":"", "describe":"", "message":"Pop-up message", "data": ""}
        """
        from django.db.models import Q
        from django.db.models.functions import TruncDate
        from django.db.models import Max, Min
        from mysite.mobile.utils import date_period
        from mysite.iclock.models import Transaction
        import datetime
        now = datetime.datetime.now().date()
        if date in (1,):  # User defined
            start = stamp2datetime(start)
            end = stamp2datetime(end) + datetime.timedelta(days=1)
        else:
            start, end = date_period(date, now)
        pin = pin.strip()
        emp = online_employee_new(device_token)
        app_role = emp.app_role
        emp_dept = emp.department
        try:
            start_date = format_date(start)
            end_date = format_date(end)
            data = []
            # paggination support
            page_size = 15
            page_num = page_num or 1
            start_pag = (page_num - 1) * page_size
            end_pag = page_num * page_size
            if not pin:
                search_item = search_item.strip()
                queryset = Transaction.objects.filter(punch_time__range=(start_date, end_date),
                                                      emp__department__company_id=emp.department.company.id)
                if app_role != 2:
                    queryset = queryset.filter(emp__department_id=emp_dept)
                if search_item:
                    queryset = queryset.filter(
                        Q(emp__emp_code__icontains=search_item) | Q(emp__first_name__icontains=search_item))
                if department:
                    department = [int(i) for i in department.split(',')]
                    queryset = queryset.filter(emp__department__in=department)
                rows = queryset.values('emp__emp_code', 'emp__first_name').distinct().order_by('emp__emp_code')
                rows = rows[start_pag:end_pag]
                if rows:
                    data = [{'pin': r['emp__emp_code'], 'name': r['emp__first_name'],
                             'photo': user_photo(r['emp__emp_code'])} for r in rows]
            else:
                rows = Transaction.objects.filter(punch_time__range=(start_date, end_date),
                                                  emp__department__company_id=emp.department.company.id,
                                                  emp__emp_code=pin).values('emp__emp_code').annotate(
                    att_date=TruncDate('punch_time'), clock_in=Min('punch_time'), clock_out=Max('punch_time')).order_by(
                    'att_date')
                rows = rows[start_pag:end_pag]
                if rows:
                    for r in rows:
                        check_in = r.get('clock_in', 0)
                        check_out = r.get('clock_out', 0)
                        if check_in in (None, '', 'None', datetime.datetime(1900, 1, 1)):
                            check_in = 0
                        if check_out in (None, '', 'None', datetime.datetime(1900, 1, 1)):
                            check_out = 0
                        total = 0
                        if check_in and check_out and check_out > check_in:
                            delta = check_out - check_in
                            total = delta.days * 24 * 60 * 60 + delta.seconds
                        if check_in:
                            check_in = datetime2stamp(check_in)
                        if check_out:
                            check_out = datetime2stamp(check_out)
                        date = r.get('att_date')
                        item = {
                            'weekday': u'{0}'.format(WEEKDAY.get(date.weekday())),
                            'date': datetime2stamp(date),
                            'clock_in': check_in,
                            'in_describe': 'N/A',
                            'clock_out': check_out,
                            'out_describe': 'N/A',
                            'total_describe': 'WorkTime',
                            'total': get_hr_min_sec(total),
                            'data_type': 1,
                            'describe': '',
                        }
                        data.append(item)
            return interface_response(SUCCESS_CODE, json.dumps(data), '', '')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
