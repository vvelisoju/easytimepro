# -*- coding: utf-8 -*-
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import request_valid, stamp2datetime, interface_response, online_employee_new, SUCCESS_CODE, \
    MESSAGE_CODE, \
    SYSTEM_EXCEPTION, DATA_EXCEPTION, datetime2stamp, user_photo, paging
from django.utils.translation import gettext_lazy as _
import json


class BioTimeAppMyApplication(object):
    """
    【My Application】
    """

    @request_valid
    @ladonize(int, int, int, str, str, str, rtype=str)
    def my_application(self, category, approve_status, page_num, device_token, language, token):
        """
        get own apply record(pending, approve, reject)
        @param category:        (1:leave，2：overtime， 3：manual log， 4：training， 5：change schedule)
        @param approve_status:  0:approved&rejected, 1:pending, 2:approved，3：rejected
        @param page_num:        page number(15items/page)
        @param language:
        @param token:
        @rtype:
            success
                category in (1, 2, 4)
                {"code":1,"error":"","describe":"","message":"","data":{"category":1,
                "items":[{"code": ID,"pin":"emp_code","name":"first_name","photo":"photo address","start":
                "start time(stamp)","end":"end time(stamp)","remark":"apply reason","category":"","apply_time":"",
                "approve_status":"int value","approve_describe":"status describe","approved_remark":"approve reason",
                 "approved_time":"approve time"},]}}
                category = 3
                {"code":1,"error":"","describe":"","message":"","data":{"category":1, "items":[{"code": ID,"pin":
                "emp_code","name":"first_name","photo":"photo address","punch_time":"punch time(stamp)",remark":
                "apply reason","category":"","apply_time":"","approve_status":"int value","approve_describe":
                "status describe","approved_remark":"approve reason","approved_time":"approve time"},]}}
                category = 5
                {"code":1,"error":"","describe":"","message":"","data":{"category":1, "items":[{"code": ID,"pin":
                "emp_code","name":"first_name","photo":"photo address","previous_shift":"","currently_shift":"",
                "remark":"apply reason","category":"","apply_time":"","approve_status":"int value","approve_describe":
                "status describe","approved_remark":"approve reason","approved_time":"approve time"},]}}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.sql_utils import get_sql, p_query
        from mysite.att import db_const
        from mysite.att import models_choices
        from mysite.att.models_choices import ALL_AUDIT_STATUS
        from mysite.att.att_param import get_func_key
        from mysite.mobile.choices import CATEGORY_LEAVE, CATEGORY_OVERTIME, CATEGORY_MANUAL, \
            CATEGORY_TRAINING, CATEGORY_SCHEDULE, CATEGORY_REIMBURSEMENT

        if approve_status in (0, 1, 2, 3):
            emp = online_employee_new(device_token)
            if not approve_status:
                _approve_status = ' audit_status in (2) '
            elif approve_status == 3:  # rejected and revoked
                _approve_status = ' audit_status in (3, 6)'
            else:
                _approve_status = ' audit_status in (%s) ' % approve_status
            sort_name = 'audit_time'
            if approve_status in (1,):
                sort_name = 'apply_time'
            emp_id_format = "'" + emp.id + "'"
            where = ' u.id = %(applier)s and %(audit_status)s  ' % (
                {'applier': emp_id_format, 'audit_status': _approve_status})
            page_num = page_num or 1
            try:
                data = {
                    'category': category,
                    'items': []
                }
                params = {'where': where}
                if category in (CATEGORY_MANUAL,):
                    from mysite.att.models_choices import PUNCH_STATES
                    sql = get_sql('sql', sqlid='manual_punch_application', app="mobile", params=params)
                    sql = paging(sql, page_num, sort_name)
                    rows = p_query(sql)
                    if rows:
                        status = dict(ALL_AUDIT_STATUS)
                        items = [{'code': r[0], 'pin': r[1], 'name': r[2], 'photo': user_photo(r[1]),
                                  'punch_time': datetime2stamp(r[3]), 'remark': u'{0}'.format(r[5]),
                                  'category':u'{0}'.format(dict(PUNCH_STATES).get(r[4], r[4])), 'apply_time': datetime2stamp(r[6]),
                                  'approve_status': r[7],
                                  'approve_describe': u'{0}'.format(status.get(r[7], r[7])),
                                  'approved_remark': u'{0}'.format(r[9]), 'approved_time': datetime2stamp(r[10])} for r in rows]
                        data['items'] = items
                elif category in (CATEGORY_LEAVE,):
                    sql = get_sql('sql', sqlid='leave_application', app="mobile", params=params)
                    sql = paging(sql, page_num, sort_name)
                    rows = p_query(sql)
                    if rows:
                        status = dict(ALL_AUDIT_STATUS)
                        items = [{'code': r[0], 'pin': r[1], 'name': r[2], 'photo': user_photo(r[1]),
                                  'start': datetime2stamp(r[3]), 'end': datetime2stamp(r[4]),
                                  'remark': u'{0}'.format(r[5]), 'category': r[6], 'apply_time': datetime2stamp(r[7]),
                                  'approve_status': r[8], 'approve_describe': u'{0}'.format(status.get(r[8], r[8])),
                                  'approved_remark': u'{0}'.format(r[10]), 'approved_time': datetime2stamp(r[11])} for r
                                 in rows]
                        data['items'] = items
                elif category in (CATEGORY_OVERTIME,):
                    sql = get_sql('sql', sqlid='overtime_application', app="mobile", params=params)
                    sql = paging(sql, page_num, sort_name)
                    rows = p_query(sql)
                    if rows:
                        status = dict(ALL_AUDIT_STATUS)
                        types = dict(models_choices.OVERTIME_TYPE)
                        items = [{'code': r[0], 'pin': r[1], 'name': r[2], 'photo': user_photo(r[1]),
                                  'start': datetime2stamp(r[3]), 'end': datetime2stamp(r[4]),
                                  'remark': u'{0}'.format(r[5]), 'category': u'{0}'.format(types.get(r[6], r[6])),
                                  'apply_time': datetime2stamp(r[7]),
                                  'approve_status': r[8], 'approve_describe': u'{0}'.format(status.get(r[8], r[8])),
                                  'approved_remark': u'{0}'.format(r[10]), 'approved_time': datetime2stamp(r[11])} for r
                                 in rows]
                        data['items'] = items
                elif category in (CATEGORY_TRAINING,):
                    sql = get_sql('sql', sqlid='training_application', app="mobile", params=params)
                    sql = paging(sql, page_num, sort_name)
                    rows = p_query(sql)
                    if rows:
                        status = dict(ALL_AUDIT_STATUS)
                        items = [{'code': r[0], 'pin': r[1], 'name': r[2], 'photo': user_photo(r[1]),
                                  'start': datetime2stamp(r[3]), 'end': datetime2stamp(r[4]),
                                  'remark': u'{0}'.format(r[5]), 'category': r[6], 'apply_time': datetime2stamp(r[7]),
                                  'approve_status': r[8], 'approve_describe': u'{0}'.format(status.get(r[8], r[8])),
                                  'approved_remark': u'{0}'.format(r[10]), 'approved_time': datetime2stamp(r[11])} for r
                                 in rows]
                        data['items'] = items
                elif category in (CATEGORY_SCHEDULE,):
                    sql = get_sql('sql', sqlid='schedule_application', app="mobile", params=params)
                    sql = paging(sql, page_num, sort_name)
                    rows = p_query(sql)
                    if rows:
                        status = dict(ALL_AUDIT_STATUS)
                        items = [{'code': r[0], 'pin': r[1], 'name': r[2], 'photo': user_photo(r[1]),
                                  'previous_shift': r[3] or 'None', 'currently_shift': r[4],
                                  'remark': u'{0}'.format(r[5]), 'category': r[6].strftime('%Y-%m-%d'),
                                  'apply_time': datetime2stamp(r[7]),
                                  'approve_status': r[8], 'approve_describe': u'{0}'.format(status.get(r[8], r[8])),
                                  'approved_remark': u'{0}'.format(r[10]), 'approved_time': datetime2stamp(r[11])} for r
                                 in rows]
                        data['items'] = items
                elif category in (CATEGORY_REIMBURSEMENT,):
                    sql = get_sql('sql', sqlid='reimbursement_application', app="mobile", params=params)
                    sql = paging(sql, page_num, sort_name)
                    rows = p_query(sql)
                    if rows:
                        status = dict(ALL_AUDIT_STATUS)
                        items = [{'code': r[0], 'pin': r[1], 'name': r[2], 'photo': user_photo(r[1]),
                                  'start': datetime2stamp(r[3]), 'end': datetime2stamp(r[4]),
                                  'remark': u'{0}'.format(r[5]), 'category': r[6], 'apply_time': datetime2stamp(r[7]),
                                  'approve_status': r[8], 'approve_describe': u'{0}'.format(status.get(r[8], r[8])),
                                  'approved_remark': u'{0}'.format(r[10]), 'approved_time': datetime2stamp(r[11])} for r
                                 in rows]
                        data['items'] = items
                return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
            except Exception as e:
                import traceback
                traceback.print_exc()
                return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
        else:
            describe = 'parameter approve_status={0} error'.format(approve_status)
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)

    @request_valid
    @ladonize(int, int, str, str, str, rtype=str)
    def cancel(self, category, code, device_token, language, token):
        """
        delete self  application
        @param category:        (1:leave，2：overtime 3：manual log， 4：training， 5：change schedule)
        @param code:            object ID
        @param device_token:
        @param language:
        @param token:
        @rtype:
        """
        from mysite.att import models_choices
        from mysite.mobile.choices import CATEGORY_LEAVE, CATEGORY_OVERTIME, CATEGORY_MANUAL, \
            CATEGORY_TRAINING, CATEGORY_SCHEDULE, CATEGORY_REIMBURSEMENT
        from mysite.workflow.models import AbstractException
        objs = None
        try:
            emp = online_employee_new(device_token)
            if category in (CATEGORY_MANUAL,):
                from mysite.att.models import ManualLog
                objs = ManualLog.objects.filter(id=code)
            elif category in (CATEGORY_LEAVE,):
                from mysite.att.models import Leave
                objs = Leave.objects.filter(id=code)
            elif category in (CATEGORY_OVERTIME,):
                from mysite.att.models import Overtime
                objs = Overtime.objects.filter(id=code)
            elif category in (CATEGORY_TRAINING,):
                from mysite.att.models import Training
                objs = Training.objects.filter(id=code)
            elif category in (CATEGORY_SCHEDULE,):
                from mysite.att.models import ChangeSchedule
                objs = ChangeSchedule.objects.filter(id=code)
            elif category in (CATEGORY_REIMBURSEMENT,):
                from mysite.payroll.models import Reimbursement
                objs = Reimbursement.objects.filter(workflow_abstractException_id=code)
            wf_obj = AbstractException.objects.filter(id=code)
            if objs and wf_obj:
                obj = objs[0]
                audit_status = wf_obj[0].audit_status
                if audit_status == models_choices.AUDIT_SUCCESS:
                    message = u'{0}'.format(_('app_application_remove_rejected'))
                    return interface_response(MESSAGE_CODE, '', '', '', message)
                if audit_status == models_choices.REFUSE:
                    message = u'{0}'.format(_('audited_requests_cant_be_deleted'))
                    return interface_response(MESSAGE_CODE, '', '', '', message)
                elif not (emp.company_id == obj.company_id and emp.id == obj.employee_id):
                    describe = _('unauthorized_delete')
                    return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
                else:
                    obj.delete()
                    data = {
                        "message": u'{0}'.format(_('app_application_remove_success'))
                    }
                    return interface_response(SUCCESS_CODE, json.dumps(data), '')
            else:
                describe = _('object_not_found')
                return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
