# -*- coding: utf-8 -*-
import json

from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import request_valid, user_photo, interface_response, SUCCESS_CODE, MESSAGE_CODE, \
    SYSTEM_EXCEPTION, DATA_EXCEPTION, online_employee_new


class BioTimeAppReport(object):
    """
    【Report】
    """

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def fields(self, source, device_token, language, token):
        """
         Report Fields
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    message push Token
        @param language:
        @param token:
        @rtype:
            success:
                {"code":1,"error":"","describe":"","message":"","data":[{"field":"Field", "field_name": "Field Name"}, ]}Default select all fields
            fail:
                {"code": -10001, "error": "", "describe": "exception detail", "message": "pop up info", "data":""}
        """
        data = [
            {'field': 'pin', 'field_name': '{0}'.format(_('report_column_empCode'))},
            {'field': 'name', 'field_name': '{0}'.format(_('report_column_firstName'))},
            {'field': 'att_date', 'field_name': '{0}'.format(_('report_column_attendanceDate'))},
            {'field': 'check_in', 'field_name': '{0}'.format(_('report_column_checkInTime'))},
            {'field': 'break_out', 'field_name': '{0}'.format(_('report_column_breakOutTime'))},
            {'field': 'break_in', 'field_name': '{0}'.format(_('report_column_breakInTime'))},
            {'field': 'check_out', 'field_name': '{0}'.format(_('report_column_checkOutTime'))},
            {'field': 'break_time', 'field_name': '{0}'.format(_('report_column_breakTime'))},
            {'field': 'total_time', 'field_name': '{0}'.format(_('report_column_totalTimeDuration'))},
            {'field': 'leave_time', 'field_name': '{0}'.format(_('report_column_leaveDuration'))},
            {'field': 'overtime', 'field_name': '{0}'.format(_('report_column_overtimeDuration'))},
        ]
        return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')

    @request_valid
    @ladonize(int, int, str, str, str, str,int, str, str, str, rtype=str)
    def display(self, start, end, search, field, department, area, source, device_token, language, token):
        """
        @param start:           start date(stamp)
        @param end:             end date(stamp)
        @param search:          search (emp code/first name)
        @param field:           query field, join by ','
        @param department:      search department, join by ','
        @param area:            search area, join by ','
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    message push Token
        @param language:
        @param token:
        @rtype:
            success:
                {"code":1,"error":"","describe":"","message":"","data":{"address":"the app report request address"}}
            fail:
                {"code": -10001, "error": "", "describe": "exception detail", "message": "pop-up message", "data":""}
        """
        from mysite.personnel.models import Employee, EmployeeProfile
        emp = online_employee_new(device_token)
        company_id = emp.department.company.id
        search_emp_id = emp.id
        search = [str(i) for i in search.split(',') if i.strip()]
        if search:
            depts = [i for i in department.split(',') if i.strip()]
            areas = [i for i in area.split(',') if i.strip()]
            search_emp_id = -1
            emps = Employee.objects.all().filter(
                    Q(emp_code__in=search),
                    Q(department_id__in=depts) if depts else Q(),
                    Q(area__id__in=areas) if areas else Q(),
                    company=company_id).distinct()
            if emps.exists():
                search_emp_id = ','.join([str(i.id) for i in emps])
        elif area and department:
            search_emp_id = ''
        elif area:
            search_emp_id = ''
        elif department:
            search_emp_id = ''

        address = '/webservice/rpc/app/att/AppReport/?fields={0}&department={1}&area={2}&start={3}&end={4}&userid={5}&language={6}&company_id={7}'.format(
            field, department, area, start, end, search_emp_id, language, company_id)

        # http://127.0.0.1:81/webservice/rpc/app/att/AppReport/?fields = pin, name, att_date, check_in, break_out,
        # break_in, check_out, break_time, total_time, leave_time, overtime & department = & area = & start = 1543633487 & end = 1545793487 & userid = 1
        return interface_response(SUCCESS_CODE, json.dumps({'address': address}), '', 'successful')
