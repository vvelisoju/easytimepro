# -*- coding: utf-8 -*-
import json

from django.utils.translation import gettext_lazy as _

from mysite.att.models_choices import CANCEL_AUDIT_SUCCESS
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import request_valid, stamp2datetime, interface_response, online_employee_new, \
    SUCCESS_CODE, MESSAGE_CODE, SYSTEM_EXCEPTION, DATA_EXCEPTION, \
    datetime2stamp, user_photo, paging
from mysite.utils import xssClean


class BioTimeAppManualLog(object):
    """
    【Manual Log】
    """

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def category(self, source, device_token, language, token):
        """
        get manual log category
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code": 1, "error": "", "describe": "", "message": "", "data":["code": ID, "name":""]}
            fail
                {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        from mysite.att.att_param import get_func_key
        from mysite.mobile.utils import remove_empty_from_dict
        emp = online_employee_new(device_token)
        company_id = emp.department.company.id
        try:
            choices = get_func_key(key=None, company_id=company_id)
            data_values = [{'code': choice[0], 'name': choice[1]} for choice in choices]
            data_removed_empty_keys = remove_empty_from_dict(data_values)
            actual_values = dict()
            for value in data_removed_empty_keys: # fetching exact values which are there in attendance report setting function-key-display
                if len(value) in actual_values:
                    actual_values[len(value)].append(value)
                else:
                    actual_values[len(value)] = list()
                    actual_values[len(value)].append(value)
            final_data = actual_values[max(actual_values)]
            return interface_response(SUCCESS_CODE, json.dumps(final_data), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def work_code(self, source, device_token, language, token):
        """
        get workcode
        @param source:              data source(1: IOS， 2：Android)
        @param device_token:        push message Token
        @param language:
        @param token:
        @rtype:
            success
                {"code": 1, "error": "", "describe": "", "message": "", "data":["code": ID, "name":""]}
            fail
                {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        from mysite.iclock.models import TerminalWorkCode
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            objs = TerminalWorkCode.objects.filter(company_id=company_id).values('id', 'alias')
            choices = []
            if objs:
                choices = [{'code': obj['id'], 'name': obj['alias']} for obj in objs]
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(SUCCESS_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, str, int, str, int, str, str, str, rtype=str)
    def apply(self, punch_time, punch_type, work_code, remark, source, device_token, language, token):
        """
        apply manual log
        @param punch_time:      (stamp)
        @param punch_type:      (data source: BioTimeAppManualLog -> category)
        @param work_code:       (data source: BioTimeAppManualLog -> work_code)
        @param remark:          apply reason
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":{"message":"Pop-up message"}}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.att import models_choices
        from mysite.att.models.model_manuallog import ManualLog
        from mysite.iclock.models.model_transaction import Transaction
        from mysite.iclock.models.model_workcode import TerminalWorkCode
        import datetime
        check_time = stamp2datetime(punch_time)
        if check_time > datetime.datetime.now():
            error = _('app_manuallog_wrong_data')
            describe = u'{0}'.format(_('manual_log_time_greater_now'))
            message = u'{0}'.format(_('manual_log_time_greater_now'))
            return interface_response(MESSAGE_CODE, '', error, describe, message)
        emp = online_employee_new(device_token)
        company_id = emp.company_id
        tmp_log = ManualLog.objects.filter(employee_id=emp.id, punch_time=check_time, company_id=company_id).exclude(
            audit_status__in=[models_choices.REFUSE, models_choices.CANCEL_AUDIT_SUCCESS])
        if tmp_log:
            emp = str(emp).split()[1] or str(emp).split()[0]  # Pop up message with either employee name if not employee code
            error = _('app_manuallog_wrong_data')
            describe = u'{0}'.format(_('manual_log_repeat') % emp )
            message = u'{0}'.format(_('manual_log_repeat') % emp )
            return interface_response(MESSAGE_CODE, '', error, describe, message)
        trs = Transaction.objects.filter(emp=emp, punch_time=check_time, company_id=company_id).count()
        if trs > 0:
            error = _('app_manuallog_wrong_data')
            describe = u'{0}'.format(_('manual_log_repeat'))
            message = u'{0}'.format(_('manual_log_repeat'))
            return interface_response(MESSAGE_CODE, '', error, describe, message)
        if not punch_type:
            error = _('app_manuallog_wrong_data')
            describe = u'{0}'.format(_('manual_log_category_required'))
            message = u'{0}'.format(_('manual_log_category_required'))
            return interface_response(MESSAGE_CODE, '', error, describe, message)
        try:
            if work_code:
                wcs = TerminalWorkCode.objects.filter(id=work_code, company_id=company_id)
                if wcs:
                    work_code = wcs[0].code
                else:
                    describe = _('app_manuallog_work_code_not_found')
                    message = _('app_manuallog_data_exception')
                    return interface_response(MESSAGE_CODE, '', '', describe, message)
            obj = ManualLog()
            obj.employee_id = emp.id
            obj.punch_time = check_time
            obj.apply_reason = xssClean(remark)
            obj.punch_state = punch_type
            obj.work_code = work_code or ''
            obj.audit_status = 1
            obj.company_id = company_id
            obj.save()
            data = {
                'message': u'{0}'.format(_('request_already_processing'))
            }
            return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', SYSTEM_EXCEPTION, e)

    @request_valid
    @ladonize(int, int, int, str, str, str, rtype=str)
    def my_application(self, approve_status, page_num, source, device_token, language, token):
        """
        get own apply record(pending, approve, reject)
        @param approve_status:  0:approved&rejected, 1:pending, 2:approved，3：rejected
        @param page_num:        page number(１５items/page)
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":""}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.sql_utils import get_sql, p_query
        from mysite.att import models_choices

        from mysite.att.att_param import get_func_key
        from mysite.mobile.choices import CATEGORY_MANUAL

        if approve_status in (0, 1, 2, 3):
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            page_num = page_num or 1
            if not approve_status:
                _approve_status = ' audit_status in (2, 3) '
            else:
                _approve_status = ' audit_status in (%s) ' % approve_status
            sort_name = 'apply_time'
            if approve_status in (1,):  # Apply
                sort_name = 'apply_time'
            where = ' u.employee_id = %(applier)s and %(audit_status)s' % (
                {'applier':  '"' + str(emp.id) + '"', 'audit_status': _approve_status})
            try:
                sql = get_sql('sql', sqlid='manual_punch_application', app="mobile",
                              params={'where': where, 'order_by': ''})
                sql = paging(sql, page_num, sort_name)
                rows = p_query(sql)
                data = {
                    'category': CATEGORY_MANUAL,
                    'items': []
                }
                if rows:
                    status = dict(models_choices.ALL_AUDIT_STATUS)
                    items = [{'code': r[0], 'pin': r[1], 'name': r[2], 'photo': user_photo(r[1]),
                              'punch_time': datetime2stamp(r[3]), 'remark': r[5], 'category': get_func_key(str(r[4]), company_id=company_id),
                              'apply_time': datetime2stamp(r[6]), 'approve_status': r[7],
                              'approve_describe': u'{0}'.format(status.get(r[7], r[7])),
                              'approved_remark': r[9], 'approved_time': datetime2stamp(r[10])} for r in rows]
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
    @ladonize(int, int, int, int, str, str, str, rtype=str)
    def approval_list(self, approve_status, page_num, order_by, source, device_token, language, token):
        from django.db.models import Q
        from django.contrib.contenttypes.models import ContentType

        from mysite.workflow.models import NodeInstance
        from mysite.att import models_choices
        from mysite.att.models import ManualLog
        from mysite.att.att_param import get_func_key

        page_num = page_num or 1
        PAGE_SIZE = 15
        begin = (page_num - 1) * PAGE_SIZE
        end = page_num * PAGE_SIZE

        if approve_status in (0, 1, 2, 3, 4, 5, 6):
            status = dict(models_choices.ALL_AUDIT_STATUS)
            if not approve_status:
                _approve_status = [2, 3]
            elif approve_status in (models_choices.APPLICATION,):
                _approve_status = [models_choices.APPLICATION, models_choices.AUDITING]
            else:
                _approve_status = [approve_status]
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            emp_roles = emp.flow_role.values_list('id', flat=True)
            data = []
            try:
                if emp_roles:
                    emp_scope = f'"{emp.department.id}"'
                    ct_ot = ContentType.objects.get_by_natural_key('att', 'manuallog')
                    if 2 in _approve_status:  # 2 = approved
                        approve_nodes = NodeInstance.objects.filter(
                            workflow_instance__workflow_engine__content_type=ct_ot.id,
                            node_engine__approver__in=emp_roles,
                            state__in=_approve_status,
                            approver_admin_id=None,
                            approver_employee_id=emp.id,
                            departments__company_id=company_id
                        )
                    else:
                        status_list = _approve_status + [CANCEL_AUDIT_SUCCESS] if _approve_status == [3] else _approve_status
                        approve_nodes = NodeInstance.objects.filter(
                            Q(node_engine__approve_scope__contains=emp_scope) |
                            Q(node_engine__approve_scope__contains='[]'),
                            workflow_instance__workflow_engine__content_type=ct_ot.id,
                            node_engine__approver__in=emp_roles,
                            state__in=status_list,
                            is_next_node=True,
                            approver_admin_id=None,
                            departments__company_id=company_id
                        )

                    approve_nodes = approve_nodes.values_list(
                        'workflow_instance__exception_id',
                        'workflow_instance__employee',
                        'state',
                        'remark',
                        'apply_time',
                    ).distinct().exclude(workflow_instance__employee=emp.id)
                    if approve_nodes:
                        for r in approve_nodes:
                            exception_id = r[0]
                            apply_obj = ManualLog.objects.filter(company_id=company_id,
                                id=exception_id).values_list('punch_time',
                                                             'punch_state',
                                                             'apply_reason',
                                                             'apply_time',
                                                             'employee__emp_code',
                                                             'employee__first_name', 'audit_time')
                            if apply_obj:
                                apply_obj = apply_obj[0]
                                res_data = {
                                    'code': r[0],
                                    'pin': apply_obj[4],
                                    'name': apply_obj[5],
                                    'photo': user_photo(apply_obj[4]),
                                    'punch_time': u'{0}'.format(datetime2stamp(apply_obj[0])),
                                    'remark': apply_obj[2],
                                    'category': u'{0}'.format(get_func_key(str(apply_obj[1]),company_id=company_id)),
                                    'apply_time': datetime2stamp(apply_obj[3]),
                                    'approve_status': r[2],
                                    'approve_describe': u'{0}'.format(status.get(r[2], r[2])),
                                    'approved_remark': r[3],
                                    'approved_time': datetime2stamp(apply_obj[6])
                                }
                                data.append(res_data)
                data_filtered_list = []
                if order_by == 1:
                    data_filtered_list = sorted(data, key=lambda k: k['approved_time'], reverse=True)
                elif order_by == 2:
                    data_filtered_list = sorted(data, key=lambda k: k['apply_time'], reverse=True)
                return interface_response(SUCCESS_CODE, json.dumps(data_filtered_list[begin:end]), '', 'successful')
            except Exception as e:
                import traceback
                traceback.print_exc()
                return interface_response(MESSAGE_CODE, '', '', SYSTEM_EXCEPTION, e)
        else:
            describe = _('approve_status_not_in (0,1,2,3)')
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)

    @request_valid
    @ladonize(int, int, str, int, str, str, str, rtype=str)
    def approve(self, code, approve_status, remark, source, device_token, language, token):
        from mysite.att.models import ManualLog
        from mysite.att import models_choices
        from mysite.workflow.models import NodeInstance
        from mysite.workflow.models.workflow_instance import WorkflowInstance
        import datetime
        if code:
            if approve_status not in (models_choices.AUDIT_SUCCESS, models_choices.REFUSE):
                describe = _('param_approve_status_out_of_range')
                return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
            approver = online_employee_new(device_token)
            company_id = approver.company_id

            obj = ManualLog.objects.filter(abstractexception_ptr_id=code, company_id=company_id)
            if obj:
                try:
                    audit_time = datetime.datetime.now()
                    if approve_status == models_choices.AUDIT_SUCCESS:
                        obj.update(
                            audit_time=audit_time,
                            approver=str(approver).split()[1],
                            audit_reason=remark
                        )
                        obj.first().workflowinstance.approve_current_node_by(approver, remark)
                        nodes = NodeInstance.objects.filter(workflow_instance__exception=code, departments__company_id=company_id).all().order_by('order')
                        if nodes:
                            for i, node in enumerate(nodes):
                                index = i
                                set_next_node = False
                                current_node = node.is_next_node
                                is_last_node = node.is_last_node
                                if is_last_node:
                                    break
                                if current_node:
                                    node.is_next_node = False
                                    node.save()
                                    set_next_node = True
                                    break
                            if set_next_node:
                                next_node = nodes[index + 1]
                                next_node.is_next_node = True
                                next_node.save()
                    elif approve_status == models_choices.REFUSE:
                        obj.update(
                            audit_time=audit_time,
                            approver=str(approver).split()[1],
                            audit_reason=remark
                        )
                        obj.first().workflowinstance.reject_current_node_by(approver, remark)
                        state_ = 0
                        workflow_instance = WorkflowInstance.objects.filter(
                            exception=obj.first().abstractexception_ptr_id).first()
                        node_set = workflow_instance.nodeinstance_set.all().order_by('order')
                        for i in node_set:
                            if i.state == 3:
                                state_ = i.state
                            if state_ == 3:
                                NodeInstance.objects.filter(id=i.id, departments__company_id=company_id).update(state=state_)
                    data = {
                        'message': u'{0}'.format(_(u'OK'))
                    }
                    return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    return interface_response(MESSAGE_CODE, '', '', SYSTEM_EXCEPTION, e)
            else:
                describe = _('object_not_found')
                return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
        else:
            describe = _('object_id_not_found')
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)

    @request_valid
    @ladonize(int, str,  int, str, str, str, rtype=str)
    def revoke(self, code, remark, source, device_token, language, token):
        """
        revoke approve
        @param code:            Obj ID
        @param remark:          audit_reason
        @param source:          data source (1: IOS， 2：Android)
        @param device_token:    Push message Token
        @param language:
        @param token:
        @rtype:
        """
        import datetime
        from mysite.att.models import ManualLog
        from mysite.att.models_choices import AUDIT_SUCCESS, CANCEL_AUDIT_SUCCESS
        from mysite.att.models.model_manuallog import delete_from_transaction
        from mysite.workflow.models.workflow_instance import WorkflowInstance
        from mysite.workflow.models_choices import NODE_REVOKE

        user = online_employee_new(device_token)
        company_id = user.company_id
        obj = ManualLog.objects.filter(id=code, company_id=company_id)
        if obj:
            if obj.first().audit_status == AUDIT_SUCCESS:

                obj.update(audit_reason=remark,
                           audit_status=CANCEL_AUDIT_SUCCESS,
                           approver=user.name,
                           audit_time=datetime.datetime.now(),
                           )
                delete_from_transaction(obj.first())
                workflow_instance = WorkflowInstance.objects.filter(
                    exception=obj.first().abstractexception_ptr_id).first()
                if workflow_instance:
                    workflow_nodeinstance_obj = workflow_instance.nodeinstance_set.order_by('order')
                    workflow_nodeinstance_obj.filter(approver_employee=user).update(
                        state=NODE_REVOKE,
                        approver_employee=user,
                        remark=remark,
                        apply_time=datetime.datetime.now()
                    )
                data = {
                    'message': u'{0}'.format(_(u'OK'))
                }
                message = _('revoked_successful')
                return interface_response(SUCCESS_CODE, json.dumps(data), '', '', message)
            else:
                describe = _('only_approved_records_can_be_revoked')
        else:
            describe = _('workflow_instance_does_not_exists')
        if describe:
            return interface_response(MESSAGE_CODE, '', '', DATA_EXCEPTION, describe)
