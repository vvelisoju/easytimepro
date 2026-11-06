# -*- coding: utf-8 -*-
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import request_valid, user_photo, interface_response
from mysite.mobile.utils import SUCCESS_CODE, MESSAGE_CODE, SYSTEM_EXCEPTION, DATA_EXCEPTION
import json


class BioTimeAppContact(object):
    """
    【Contact】
    """

    @request_valid
    @ladonize(str, int, int, str, str, str, rtype=str)
    def pull_contact(self, search_item, page_num, source, device_token, language, token):
        """
        get contact
        @param search_item:     search condition(emp_code or first_name), return all data when this field is None
        @param page_num:        page number(１５items/page)
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code": 1, "error": "", "describe": "", "message": "", "data":[{"code": objcet ID, "pin": "emp_code", "
                name":"first_name", "photo":"photo address", "mobile": "cell phone number ", "email": "email address",
                "position":""}, ]}
            fail
                 {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}

        """
        from django.db.models import Q
        from mysite.personnel.models.model_employee import Employee
        from mysite.mobile.utils import online_employee_new
        emp = online_employee_new(device_token)
        app_role = emp.app_role
        emp_dept = emp.department
        company_id = emp.department.company.id
        try:
            emps = Employee.objects.filter(department__company_id=company_id)
            search_item = search_item.strip()
            if app_role != 2:
                emps = emps.filter(department_id=emp_dept)
            if search_item:
                emps = emps.filter(Q(first_name__icontains=search_item) | Q(emp_code__icontains=search_item))
            page_size = 15
            page_num = page_num or 1
            start = (page_num - 1) * page_size
            end = page_num * page_size
            emps = emps[start:end]
            data = []
            if emps:
                objs = emps.values('id', 'emp_code', 'first_name', 'mobile', 'email', 'position__position_name')
                data = [
                    {'code': obj['id'], 'pin': obj['emp_code'],
                     'name': obj['first_name'] or obj['emp_code'], 'mobile': obj['mobile'] or '',
                     'email': obj['email'] or '', 'position': obj['position__position_name'] or '',
                     'photo': user_photo(obj['emp_code'])} for obj in objs]     # 'name': obj['first_name'] or obj['emp_code'] In App contacts it will display firstname if exist else emp_code
            return interface_response(SUCCESS_CODE, json.dumps(data), '', '')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
