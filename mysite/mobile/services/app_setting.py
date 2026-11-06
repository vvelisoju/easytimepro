# -*- coding: utf-8 -*-
import json

from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import SUCCESS_CODE, MESSAGE_CODE, request_valid, interface_response, \
    SUPPORT_CONTACT, WEBSITE, SYSTEM_EXCEPTION, online_employee_new


class BioTimeAppSetting(object):
    """
    【Setting】
    """

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def pull_setting(self, source, device_token, language, token):
        """
        get settings
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            sucess
                {"code": 1, "error": "", "describe":"", "message": "", "data": {"enable_capture":(0/1),
                "enable_workcode":(0/1), "enable_funckey":(0/1), "contact":"email address", "website":""}}
            fail
                {"code":-10001, "error":"", "describe":"", "message":"", "data":""}
        """
        from mysite.att.att_param import get_att_param
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            params = get_att_param(str(company_id))
            app_punch_status = emp.app_punch_status
            outdoor_status = emp.enable_outdoor_management
            setting = {'contact': SUPPORT_CONTACT, 'website': WEBSITE}
            setting['enable_capture'] = params['enable_capture']
            setting['enable_workcode'] = params['enable_workcode']
            setting['enable_funckey'] = params['enable_funckey']
            setting['app_punch_status'] = app_punch_status
            setting['outdoor_status'] = outdoor_status
            return interface_response(SUCCESS_CODE, json.dumps(setting), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, int, int, int, str, str, str, rtype=str)
    def upload_setting(self, enable_capture, enable_workcode, enable_funckey, source, device_token, language, token):
        """
        @param enable_capture:   (0/1)
        @param enable_workcode: (0/1)
        @param enable_funckey:  (0/1)
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code": 1, "error": "", "describe":"", "message": "", "data": ""}
            fail
                {"code":-10001, "error":"", "describe":"", "message":"", "data":""}
        """
        from django.core.cache import cache
        from mysite.att.global_cache import C_ATT_RULE
        from mysite.att.att_param import get_att_param, save_att_param_to_db
        try:
            params = get_att_param()
            params['enable_capture'] = enable_capture
            params['enable_workcode'] = enable_workcode
            params['enable_funckey'] = enable_funckey
            save_att_param_to_db(params)
            cache.delete('att_rule')
            C_ATT_RULE.refresh()
            return interface_response(SUCCESS_CODE, '', '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
