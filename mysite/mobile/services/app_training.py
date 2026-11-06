# -*- coding: utf-8 -*-
import json

from django.utils.translation import gettext_lazy as _

from mysite.att.models_choices import CANCEL_AUDIT_SUCCESS
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import SUCCESS_CODE, MESSAGE_CODE, interface_response, request_valid, online_employee_new, \
    stamp2datetime, datetime2stamp, SYSTEM_EXCEPTION, DATA_EXCEPTION, user_photo, paging
from mysite.utils import xssClean


class BioTimeAppTraining(object):
    """
    【Training】
    """

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def category(self, source, device_token, language, token):
        """
        Training Type
        @param source:              data source(1: IOS， 2：Android)
        @param device_token:        push message Token
        @param language:
        @param token:
        @rtype:
            {"code": 1, "error": "", "describe": "", "message": "", "data":["code": ID, "name":""]}
        """
        from mysite.att.global_cache import CACHE_TRAINING_TYPE
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            choices = CACHE_TRAINING_TYPE.get(company_id)
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, int, int, str, int, str, str, str, rtype=str)
    def apply(self, training_type, start, end, remark, source, device_token, language, token):
        """
        Apply Training
        @param training_type:       Training Type（　BioTimeAppTraining --> category）
        @param start:               Training StartTime
        @param end:                 Training EndTIme
        @param remark:
        @param source:              data source(1: IOS， 2：Android)
        @param device_token:        push message Token
        @param language:
        @param token:
        @rtype:
            Success
                {"code":1,"error":"","describe":"","message":"","data":["code": ID, "name":""]}
            Exception
                {"code": -10001, "error": "", "describe": "error describe", "message": "Pop info", "data":""}
        """
        from django.db.models import Q
        from mysite.att import models_choices
        from mysite.att.models.model_training import Training
        from mysite.att.models.model_trainingcategory import TrainingCategory

        start_time = stamp2datetime(start)
        end_time = stamp2datetime(end)
        if start_time > end_time:
            describe = u'{0}'.format(_('leave_time_invalid_range'))
            message = u'{0}'.format(_('leave_time_invalid_range'))
            return interface_response(MESSAGE_CODE, '', '', describe, message)
        applier = online_employee_new(device_token)
        company_id = applier.company_id

        try:
            training_category = TrainingCategory.objects.filter(pk=training_type, company_id=company_id)
            if not training_category:
                message = u'{0}'.format(_(u'Please try again'))
                return interface_response(MESSAGE_CODE, '', '', '', message)
            select_status = [models_choices.REFUSE, models_choices.CANCEL_AUDIT_SUCCESS]
            tmp_training = Training.objects.filter(employee_id=applier.id, company_id=company_id).exclude(
                Q(start_time__gt=start_time) | Q(end_time__lt=end_time)).exclude(audit_status__in=select_status)
            if tmp_training:
                error = _('app_manuallog_wrong_data')
                describe = u'{0}'.format(_('trainig_time_overlap'))
                message = u'{0}'.format(_('trainig_time_overlap'))
                return interface_response(MESSAGE_CODE, '', error, describe, message)
            training_type = training_category[0]
            obj = Training()
            obj.employee_id = applier.id
            obj.start_time = start_time
            obj.end_time = end_time
            obj.category = training_type
            obj.apply_reason = xssClean(remark)
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
            return interface_response(MESSAGE_CODE, '', '', e, u'{0}'.format(e))

    @request_valid
    @ladonize(int, int, int, str, str, str, rtype=str)
    def my_application(self, approve_status, page_num, source, device_token, language, token):
        """
        get self apply record(pending, approve, reject)
        @param approve_status:    0:approved&rejected, 1:pending, 2:approved，3：rejected
        @param page_num:        page number(１５items/page)
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":{"category":1,"
                items":{"code": ID,"pin":"emp_code","name":"first_name","photo":"photo address","start":
                "start time(stamp)","end":"end time(stamp)","remark":"apply reason","category":"","apply_time":"",
                "approve_status":"int value","approve_describe":"status describe","approved_remark":"approve reason",
                 "approved_time":"approve time"},]}}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.sql_utils import get_sql, p_query
        from mysite.att import models_choices
        from mysite.mobile.choices import CATEGORY_TRAINING

        if approve_status in (0, 1, 2, 3):
            emp = online_employee_new(device_token)
            if not approve_status:
                _approve_status = ' audit_status in (2, 3) '
            else:
                _approve_status = ' audit_status in (%s) ' % approve_status
            where = ' u.employee_id = %(applier)s and %(audit_status)s' % (
                {'applier': '"' + str(emp.id) + '"', 'audit_status': _approve_status})
            sort_name = 'change_time'
            if approve_status in (1,):  # Apply
                sort_name = 'apply_time'
            page_num = page_num or 1
            try:
                sql = get_sql('sql', sqlid='training_application', app="mobile", params={'where': where})
                sql = paging(sql, page_num, sort_name)
                rows = p_query(sql)
                data = {
                    'category': CATEGORY_TRAINING,
                    'items': []
                }
                if rows:
                    status = dict(models_choices.ALL_AUDIT_STATUS)
                    items = [{'code': r[0], 'pin': r[1], 'name': r[2], 'photo': user_photo(r[1]),
                              'start': datetime2stamp(r[3]), 'end': datetime2stamp(r[4]),
                              'remark': u'{0}'.format(r[5]), 'category': r[6], 'apply_time': datetime2stamp(r[7]),
                              'approve_status': r[8], 'approve_describe': u'{0}'.format(status.get(r[8], r[8])),
                              'approved_remark': u'{0}'.format(r[10]), 'approved_time': datetime2stamp(r[7])} for r in
                             rows]
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
        """
         get training approval list
        @param approve_status:  ·（required）0:approved&rejected, 1:pending, 2:approved，3：rejected
        @param page_num:        page number(１５items/page)
        @param order_by:        sort(1: apply time，２：approve time), application page default１，approve page default２
        @param source:           data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            {"code": 1, "error": "", "describe": "", "message": "", "data":[{"id": ID, "pin": "emp_code", "name":"first_name",
            "photo":"photo address", "start": "", "end": "", "remark":"apply reason", "approve_status": ""},]}
        """
        from django.contrib.contenttypes.models import ContentType
        from mysite.workflow.models import NodeInstance
        from mysite.att import models_choices
        from mysite.att.models import Training
        from django.db.models import Q

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
            company_id = emp.company_id

            emp_roles = emp.flow_role.all()
            data = []
            try:
                if emp_roles:
                    emp_scope = f'"{emp.department.id}"'
                    ct_ot = ContentType.objects.get_by_natural_key('att', 'training')
                    if _approve_status == [2]:
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
                            approver_admin_id=None,
                            is_next_node=True,
                            departments__company_id=company_id
                        )

                    approve_nodes = approve_nodes.values_list(
                        'workflow_instance__exception_id',
                        'workflow_instance__employee',
                        'state',
                        'remark',
                        'apply_time',
                        'is_last_node'
                    ).distinct().exclude(workflow_instance__employee_id=emp.id)
                    if approve_nodes:
                        prv_exception = []
                        for r in approve_nodes:
                            exception_id = r[0]
                            apply_obj = Training.objects.filter(company_id=company_id, id=exception_id).values_list(
                                'category__category_name',
                                'start_time',
                                'end_time',
                                'apply_reason',
                                'apply_time',
                                'employee__emp_code',
                                'employee__first_name',
                                'audit_time')

                            if apply_obj:
                                apply_obj = apply_obj[0]
                                res_data = {
                                    'code': r[0],
                                    'pin': apply_obj[5],
                                    'name': apply_obj[6],
                                    'photo': user_photo(apply_obj[5]),
                                    'start': u'{0}'.format(datetime2stamp(apply_obj[1])),
                                    'end': u'{0}'.format(datetime2stamp(apply_obj[2])),
                                    'remark': u'{0}'.format(apply_obj[3]),
                                    'category': u'{0}'.format(apply_obj[0]),
                                    'apply_time': datetime2stamp(apply_obj[4]),
                                    'approve_status': r[2],
                                    'approve_describe': u'{0}'.format(status.get(r[2], r[2])),
                                    'approved_remark': r[3],
                                    'approval_time': datetime2stamp(apply_obj[7])
                                }
                                data.append(res_data)
                data_filtered_list = []
                if order_by == 1:
                    data_filtered_list = sorted(data, key=lambda k: k['approval_time'], reverse=True)
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
        from mysite.att.models import Training
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

            objs = Training.objects.filter(company_id=company_id, abstractexception_ptr_id=code)
            if objs:
                obj = objs[0]
                try:
                    audit_time = datetime.datetime.now()
                    if approve_status == models_choices.AUDIT_SUCCESS:
                        objs.update(audit_reason=xssClean(remark),
                                    approver=str(approver).split()[1],
                                    audit_time=audit_time)
                        obj.workflowinstance.approve_current_node_by(approver, remark)
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
                        objs.update(audit_reason=xssClean(remark),
                                    approver=str(approver).split()[1])
                        obj.workflowinstance.reject_current_node_by(approver, remark)

                        state_ = 0
                        workflow_instance = WorkflowInstance.objects.filter(
                            exception=obj.abstractexception_ptr_id).first()
                        node_set = workflow_instance.nodeinstance_set.all().order_by('order')
                        for i in node_set:
                            if i.state == 3:
                                state_ = i.state
                            if state_ == 3:
                                NodeInstance.objects.filter(id=i.id).update(state=state_)
                    data = {
                        'message': u'{0}'.format(_(u'OK'))
                    }
                    return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    return interface_response(MESSAGE_CODE, '', '', SYSTEM_EXCEPTION, e)
            else:
                describe = u"{0}".format(_('object_not_found'))
                return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
        else:
            describe = u"{0}".format(_('object_id_not_found'))
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)

    @request_valid
    @ladonize(int, str, int, str, str, str, rtype=str)
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
        from mysite.att.models import Training
        from mysite.att.models_choices import AUDIT_SUCCESS, CANCEL_AUDIT_SUCCESS
        from mysite.workflow.models.workflow_instance import WorkflowInstance
        from mysite.workflow.models_choices import NODE_REVOKE
        user = online_employee_new(device_token)
        company_id = user.company_id

        obj = Training.objects.filter(company_id=company_id, id=code)
        if obj:
            if obj.first().audit_status == AUDIT_SUCCESS:
                obj.update(audit_reason=remark,
                           audit_status=CANCEL_AUDIT_SUCCESS,
                           approver=user.name,
                           audit_time=datetime.datetime.now())
                workflow_instance = WorkflowInstance.objects.filter(
                    exception=obj.first().abstractexception_ptr_id).first()
                if workflow_instance:
                    workflow_nodeinstance_obj = workflow_instance.nodeinstance_set.order_by('order')
                    workflow_nodeinstance_obj.filter(approver_employee=user).update(
                        state=NODE_REVOKE,
                        approver_employee=user,
                        remark=xssClean(remark),
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

        return interface_response(MESSAGE_CODE, '', '', DATA_EXCEPTION, describe)
