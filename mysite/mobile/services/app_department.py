# -*- coding: utf-8 -*-
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import SUCCESS_CODE, MESSAGE_CODE, SYSTEM_EXCEPTION, DATA_EXCEPTION, interface_response, \
    request_valid, online_employee_new
import json


class BioTimeAppDepartment(object):
    """
    【Department】
    """

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def pull_department(self, source, device_token, language, token):
        """
        get department tree
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1, "error":"", "describe":"", "message":"", "data":[{"code":object ID,"name":"dept_name",
                "parent_id":parent dept ID,"subs":"sub depts"}]}
            fail
                {"code":-10001, "error":"", "describe":"", "message":"", "data":""}
        """
        from django.core.cache import cache
        from mysite.personnel.models.model_department import Department
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            dept_tree = cache.get('app_dept_tree', None)
            if not dept_tree:
                depts = Department.objects.filter(company=company_id).values('id', 'dept_name', 'parent_dept').order_by(
                    'dept_code')
                dept_tree = []
                subs = {}
                for dept in depts:
                    parent = dept['parent_dept']
                    if parent:
                        if parent not in subs:
                            subs[parent] = []
                        subs[parent].append({'code': dept['id'], 'name': dept['dept_name'], 'parent_id': parent,
                                             'subs': []})
                    else:
                        dept_tree.append({'code': dept['id'], 'name': dept['dept_name'], 'parent_id': ''})

                def get_subs(obj):
                    # print '[*]dept_tree', obj
                    p_subs = subs.get(obj['code'], [])
                    if p_subs:
                        for sub in p_subs:
                            get_subs(sub)
                        obj['subs'] = p_subs

                list(map(lambda x: get_subs(x), dept_tree))
                cache.set('app_dept_tree', dept_tree)
            return interface_response(SUCCESS_CODE, json.dumps(dept_tree), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)


    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def pull_area(self, source, device_token, language, token):
        """
        get area tree
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1, "error":"", "describe":"", "message":"", "data":[{"code":object ID,"name":"area_name",
                "parent_id":parent area ID,"subs":"sub areas"}]}
            fail
                {"code":-10001, "error":"", "describe":"", "message":"", "data":""}
        """
        from django.core.cache import cache
        from mysite.personnel.models.model_area import Area
        try:
            emp = online_employee_new(device_token)
            company_id = emp.company_id
            area_tree = cache.get('app_area_tree_', None)
            if not area_tree:
                areas = Area.objects.filter(company=company_id).values('id', 'area_name', 'parent_area').order_by(
                    'area_code')
                area_tree = []
                subs = {}
                for area in areas:
                    parent = area['parent_area']
                    if parent:
                        if parent not in subs:
                            subs[parent] = []
                        subs[parent].append({'code': area['id'], 'name': area['area_name'], 'parent_id': parent,
                                             'subs': []})
                    else:
                        area_tree.append({'code': area['id'], 'name': area['area_name'], 'parent_id': ''})

                def get_subs(obj):
                    # print '[*]dept_tree', obj
                    p_subs = subs.get(obj['code'], [])
                    if p_subs:
                        for sub in p_subs:
                            get_subs(sub)
                        obj['subs'] = p_subs

                list(map(lambda x: get_subs(x), area_tree))
                cache.set('app_area_tree', area_tree)
            return interface_response(SUCCESS_CODE, json.dumps(area_tree), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
