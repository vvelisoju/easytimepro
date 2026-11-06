# -*- coding: utf-8 -*-
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import request_valid, get_hr_min, get_hr_min_sec, user_photo, stamp2datetime, \
    datetime2stamp, interface_response, online_employee_new, SUCCESS_CODE, this_week_period
import json


class BioTimeAppProfile(object):
    """
    【Profile】
    """

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def profile(self, source, device_token, language, token):
        """
         get employee infomation
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
        """
        emp = online_employee_new(device_token)
        profile = {}
        if emp:
            department = emp.department and emp.department.dept_name or ''
            position = emp.position and emp.position.position_name or ''
            photo_url = user_photo(emp.emp_code)
            profile = {
                'pin': emp.emp_code,
                'name': emp.first_name,
                'photo': photo_url,
                'department': department,
                'position': position,
                'area': emp.get_attarea(),
            }
        return interface_response(SUCCESS_CODE, json.dumps(profile), '', 'successful')

    @request_valid
    @ladonize(int, int, str, str, str, rtype=str)
    def work_time(self, current_day, source, device_token, language, token):
        """
        get work time
        @param current_day:
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
         ["items":[{"date": "", "work_time": "05:00", "remaining_time": "03:00", "overtime": "00:00"}]]
        """
        import datetime
        from mysite.att.models import PayloadBase
        stamp_current = current_day
        current_day = stamp2datetime(current_day)
        start, end = this_week_period(current_day)
        emp = online_employee_new(device_token)
        rows = PayloadBase.objects.filter(emp_id=emp.id, att_date__range=(start, end)).values('att_date',
                                                                                              'total_worked',
                                                                                              'remaining',
                                                                                              'overtime__total_ot')

        vals = {}
        total_work_time = 0
        if rows:
            for r in rows:
                key = r['att_date'].strftime('%Y%m%d')
                work_time = r['total_worked'] and r['total_worked'] or 0
                short_time = r['remaining'] and r['remaining'] or 0
                over_time = r['overtime__total_ot'] and r['overtime__total_ot'] or 0
                total_work_time += work_time
                vals[key] = {
                    'date': datetime2stamp(r['att_date']),
                    'work_time': get_hr_min_sec(work_time),
                    'remaining_time': get_hr_min_sec(short_time),
                    'overtime': get_hr_min_sec(over_time),
                }
        items = []
        data = {}
        loop_start = start
        while loop_start <= current_day:
            key = loop_start.strftime('%Y%m%d')
            item = vals.get(key, {
                'date': datetime2stamp(loop_start),
                'work_time': '00:00',
                'remaining_time': '00:00',
                'overtime': '00:00',
            })
            items.append(item)
            loop_start += datetime.timedelta(days=1)
            data = {
                'current_day': stamp_current,
                'total_work_time': '{0}:{1}'.format(*map(float, get_hr_min_sec(total_work_time).split(':'))),
                'items': items
            }
        return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
