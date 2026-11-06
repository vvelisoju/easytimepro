# -*- coding: utf-8 -*-
from mysite.att.models_choices import CANCEL_AUDIT_SUCCESS
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import request_valid, datetime2stamp, stamp2datetime, interface_response, online_employee_new, \
    save_notification, MESSAGE_CODE, SUCCESS_CODE, SYSTEM_EXCEPTION, DATA_EXCEPTION, user_photo, paging
import json
from django.utils.translation import gettext_lazy as _

from mysite.utils import xssClean


class BioTimeAppSchedule(object):
    """
    【Schedule】
    """

    @request_valid
    @ladonize(int, int, int, str, str, str, rtype=str)
    def pull_schedule(self, start_date, end_date, source, device_token, language, token):
        """
        get schedule info
        """
        from mysite.att.calc.views import att_calculate
        from mysite.att.models import PayloadBase, Holiday
        from mysite.personnel.models import Location, Employee
        import datetime
        now = datetime.datetime.now()
        start = stamp2datetime(start_date)
        end = stamp2datetime(end_date)
        emp = online_employee_new(device_token)
        company_id = emp.department.company.id
        att_calculate([emp.id, ], datetime.datetime(start.year, start.month, start.day), end, company_id=company_id)
        rows = PayloadBase.objects.filter(emp__company_id=company_id, emp_id=emp, att_date__gte=start, att_date__lte=end).select_related(
            'timetable').values('att_date', 'timetable__alias', 'check_in', 'check_out', 'clock_in', 'clock_out',
                                'late', 'early_leave', 'absent', 'leave', 'overtime__normal_ot', 'overtime__weekend_ot',
                                'overtime__holiday_ot', 'day_off').order_by('att_date')
        holiday = {}
        emp_holiday_name = Holiday.objects.filter(company_id=company_id, location=emp.location).values_list('alias', 'start_date',
                                                                                     'duration_day')
        for alias, start_date, duration in emp_holiday_name:
            if duration > 1:
                for _ in range(0, duration):
                    holiday[start_date] = alias
                    start_date += datetime.timedelta(days=1)
            else:
                holiday[start_date] = alias
        pre_date = '19000101'
        vals = {}
        if rows:
            for r in rows:
                if r['day_off'] == 3:
                    date = r['att_date']
                    r['timetable__alias'] = holiday[date] if date in holiday else "holiday"
                elif r['day_off'] == 2:
                    r['timetable__alias'] = 'Weekend'
                att_date = r['att_date']
                key = att_date.strftime('%Y%m%d')
                if att_date == pre_date:
                    vals[key] = {
                        'date': '{0}'.format(att_date.strftime('%Y-%m-%d')),
                        'shift': pre_vals['shift'] + '&' + '{0}'.format(r['timetable__alias']),
                        'set_in': pre_vals['set_in'] + '&' + '{0}'.format(r['check_in']),
                        'set_out': pre_vals['set_out'] + '&' + '{0}'.format(r['check_out']),
                        'check_in': pre_vals['check_in'] + '&' + '{0}'.format(r['clock_in']),
                        'check_out': pre_vals['check_out'] + '&' + '{0}'.format(r['clock_out']),
                        'late': (pre_vals['late'] + '{0}'.format(r['late'])) and 1 or 0,
                        'early_leave': (pre_vals['early_leave'] + '{0}'.format(r['early_leave'])) and 1 or 0,
                        'absent': (pre_vals['absent'] + '{0}'.format(r['absent'])) and 1 or 0,
                        'leave': (pre_vals['leave'] + '{0}'.format(r['leave'])) and 1 or 0,
                        'overtime': (pre_vals['overtime'] + '{0}'.format(any((r['overtime__normal_ot'],
                                                                              r['overtime__weekend_ot'],
                                                                              r['overtime__holiday_ot'])) and 1 or 0))
                                    and 1 or 0
                    }
                else:
                    vals[key] = {
                        'date': '{0}'.format(att_date.strftime('%Y-%m-%d')),
                        'shift': '{0}'.format(r['timetable__alias']),
                        'set_in': '{0}'.format(r['check_in']),
                        'set_out': '{0}'.format(r['check_out']),
                        'check_in': '{0}'.format(r['clock_in']),
                        'check_out': '{0}'.format(r['clock_out']),
                        'late': '{0}'.format(r['late'] and 1 or 0),
                        'early_leave': '{0}'.format(r['early_leave'] and 1 or 0),
                        'absent': '{0}'.format(r['absent'] and 1 or 0),
                        'leave': '{0}'.format(r['leave'] and 1 or 0),
                        'overtime': '{0}'.format(any((r['overtime__normal_ot'], r['overtime__weekend_ot'],
                                                      r['overtime__holiday_ot'])) and 1 or 0)
                    }
                pre_date = r['att_date']
                pre_vals = vals[key]
        items = []
        loop_date = start
        while loop_date <= end:
            day = loop_date.strftime('%Y%m%d')
            item = vals.get(day, {
                'date': '{0}'.format(loop_date.strftime('%Y-%m-%d')),
                'shift': '',
                'set_in': '',
                'set_out': '',
                'check_in': '',
                'check_out': '',
                'late': '0',
                'early_leave': '0',
                'absent': '0',
                'leave': '0',
                'overtime': '0'
            })
            if loop_date > now:
                item['late'] = '0'
                item['early_leave'] = '0'
                item['absent'] = '0'
                item['leave'] = '0'
                item['overtime'] = '0'
            items.append(item)
            loop_date += datetime.timedelta(days=1)
        return interface_response(SUCCESS_CODE, json.dumps(items), '', 'successful')

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def pull_shift(self, source, device_token, language, token):
        """
        get shift info
        @param source:              data source(1: IOS， 2：Android)
        @param device_token:         Token for push message
        @param language:
        @param token:
        @rtype:
        {
            "code": 1, "error": "", "describe":"", "message":"",
            "data": [{"code": 1, "name": "DubaiOffice(08:00-18:00)"},]
        }
        """
        from mysite.att.models.model_timeinterval import TimeInterval
        import datetime
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            objs = TimeInterval.objects.filter(company=company_id).order_by('use_mode').values('id', 'alias', 'in_time',
                                                                                               'duration')
            vals = [
                {
                    'code': obj['id'],
                    'name': '{0}({1}-{2})'.format(
                        obj['alias'], obj['in_time'].strftime('%H:%M'),
                        (datetime.datetime.strptime(
                            '2000-01-01 {time}'.format(time=obj['in_time']), '%Y-%m-%d %H:%M:%S') + datetime.timedelta(
                            minutes=obj['duration'])
                         ).strftime('%H:%M')
                    )
                } for obj in objs
            ]
            return interface_response(SUCCESS_CODE, json.dumps(vals), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(SUCCESS_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, str, int, str, int, str, str, str, rtype=str)
    def apply(self, att_date, previous_shift, adjust_shift, remark, source, device_token, language, token):
        """
        applye change schedule
        @param att_date:            change schedule date
        @param previous_shift:      current schedule
        @param adjust_shift:        new schedule
        @param remark:
        @param source:              data source(1: IOS， 2：Android)
        @param device_token:        push message Token
        @param language:
        @param token:
        @rtype:  return result
        """
        from mysite.att.models import ChangeSchedule
        from mysite.att.models import TimeInterval
        from mysite.att import models_choices
        from datetime import date, datetime, time, timedelta
        if att_date:
            att_date = stamp2datetime(att_date)
            applier = online_employee_new(device_token)
            company_id = applier.company_id

            try:
                currently = TimeInterval.objects.filter(pk=adjust_shift, company_id=company_id)
                if not currently:
                    describe = _('adjust_shift_not_found')
                    return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
                tmp = ChangeSchedule.objects.filter(att_date=att_date, employee=applier.id, company_id=company_id)
                if tmp:
                    audit_status = tmp[0].audit_status
                    if audit_status in [models_choices.AUDIT_SUCCESS, models_choices.APPLICATION]:
                        # Pop up message with either employee name if not employee code.
                        applier = str(applier).split()[1] or str(applier).split()[0]
                        error = _('app_manuallog_wrong_data')
                        describe = u'{0}'.format(_('mobile_scheduleApply_employeeScheduleOverlap_%(emp)s') % {
                            'emp': applier})
                        message = describe
                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                dtime_conversion = datetime.strptime(currently[0].in_time.strftime("%H:%M:%S"),
                                                     "%H:%M:%S")
                dtime_conversion1 = dtime_conversion + timedelta(hours=currently[0].duration / 60)
                obj = ChangeSchedule()
                obj.employee_id = applier.id
                obj.att_date = att_date
                obj.previous_timeinterval = str(previous_shift)
                obj.timeinterval_id = adjust_shift
                obj.apply_reason = xssClean(remark)
                obj.start_time = datetime.combine(att_date, currently[0].in_time)
                obj.end_time = datetime.combine(att_date, dtime_conversion1.time())
                obj.company_id = company_id
                obj.save()
                data = {
                    'message': u'{0}'.format(_('request_already_processing'))
                }
                return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
            except Exception as e:
                import traceback
                traceback.print_exc()
                return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
        else:
            describe = _('object_not_found')
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)

    @request_valid
    @ladonize(int, int, int, str, str, str, rtype=str)
    def my_application(self, approve_status, page_num, source, device_token, language, token):
        """
        get self schedule apply data
        @param approve_status:      0:approved&reject, 1:apply, 2:approved，3：rejected
        @param page_num:            paging（15pic/page）
        @param source:              data source(1: IOS， 2：Android)
        @param device_token:        push message Token
        @param language:
        @param token:
        @rtype:
        """
        from mysite.sql_utils import get_sql, p_query
        from mysite.att import models_choices
        from mysite.mobile.choices import CATEGORY_SCHEDULE

        if approve_status in (0, 1, 2, 3):
            emp = online_employee_new(device_token)
            if not approve_status:
                _approve_status = ' audit_status in (2, 3) '
            elif approve_status in (models_choices.APPLICATION,):
                _approve_status = ' audit_status in (%s, %s) ' % (models_choices.APPLICATION, models_choices.AUDITING)
            else:
                _approve_status = ' audit_status in (%s) ' % approve_status
            where = ' u.employee_id = %(applier)s and %(audit_status)s' % (
                {'applier': '"' + str(emp.id) + '"', 'audit_status': _approve_status})
            sort_name = 'audit_time'
            if approve_status in (1,):  # Apply
                sort_name = 'apply_time'
            page_num = page_num or 1
            try:
                sql = get_sql('sql', sqlid='schedule_application', app="mobile", params={'where': where})
                sql = paging(sql, page_num, sort_name)
                rows = p_query(sql)
                data = {
                    'category': CATEGORY_SCHEDULE,
                    'items': []
                }
                if rows:
                    status = dict(models_choices.ALL_AUDIT_STATUS)
                    items = [{'code': r[0], 'pin': r[1], 'name': r[2], 'photo': user_photo(r[1]),
                              'previous_shift': r[3] or 'None', 'currently_shift': r[4],
                              'remark': u'{0}'.format(r[5]), 'category': r[6].strftime('%Y-%m-%d'),
                              'apply_time': datetime2stamp(r[7]),
                              'approve_status': r[8], 'approve_describe': u'{0}'.format(status.get(r[8], r[8])),
                              'approved_remark': u'{0}'.format(r[10]), 'approved_time': datetime2stamp(r[11])} for r in
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
    def approval_list(self, approve_status, order_by, page_num, source, device_token, language, token):
        """
        get approve list
        @param approve_status:      0:approved&rejected, 1:pending, 2:approved，3：rejected
        @param page_num:            （paging（15pic/page））
        @param order_by:            order(1: apply_time，２：audit_time), apply page default value１，audit page default
        value２
        @param source:              data source(1: IOS， 2：Android)
        @param device_token:        push message Token
        @param language:
        @param token:
        @rtype:
            {"code":1,"error":"","describe":"","message":"","data":[{"code": ID,"pin":"emp_code","name":"emp name",
            "photo":"emp photo address",
            "previous_shift":"previous_timetable","currently_shift":"new_timetabel","remark":"apply remark",
            "category":"apply category",
            "apply_time":"",
            "approve_status":"approve status value","approve_describe":"apprvoe status name","approved_remark":"apply remark",
            "approved_time":"audit time"},]}
        """
        from django.contrib.contenttypes.models import ContentType
        from mysite.workflow.models import NodeInstance
        from mysite.att import models_choices
        from mysite.att.models import ChangeSchedule
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
            emp_roles = emp.flow_role.all()
            data = []
            try:
                if emp_roles:
                    emp_scope = f'"{emp.department.id}"'
                    ct_ot = ContentType.objects.get_by_natural_key('att', 'changeschedule')
                    if _approve_status == [2]:
                        approve_nodes = NodeInstance.objects.filter(
                            workflow_instance__workflow_engine__content_type=ct_ot.id,
                            node_engine__approver__in=emp_roles,
                            state__in=_approve_status,
                            approver_admin_id=None,
                            approver_employee_id=emp.id
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
                            apply_obj = ChangeSchedule.objects.filter(id=exception_id).values_list('att_date',
                                                                                                   'previous_timeinterval',
                                                                                                   'timeinterval__alias',
                                                                                                   'apply_time',
                                                                                                   'apply_reason',
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
                                    'previous_shift': apply_obj[1],
                                    'currently_shift': apply_obj[2],
                                    'remark': u'{0}'.format(apply_obj[4]),
                                    'category': apply_obj[0].strftime('%Y-%m-%d'),
                                    'apply_time': datetime2stamp(apply_obj[3]),
                                    'approve_status': r[2],
                                    'approve_describe': u'{0}'.format(status.get(r[2], r[2])),
                                    'approved_remark': u'{0}'.format(r[3]),
                                    'approved_time': datetime2stamp(apply_obj[7])
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
        """
        change schedule approve
        @param code:                object ID
        @param approve_status:      audit status(approved/rejected)
        @param remark:              audit reason
        @param source:              data source(1: IOS， 2：Android)
        @param device_token:        push message Token
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":{"message":"pop info"}}
            fail
                {"code": -10001, "error": "", "describe": "error describe", "message": "pop info", "data":""}
        """
        from mysite.att.models import ChangeSchedule
        from mysite.att import models_choices
        from mysite.workflow.models import NodeInstance
        from mysite.workflow.models.workflow_instance import WorkflowInstance
        if approve_status not in (models_choices.AUDIT_SUCCESS, models_choices.REFUSE):
            describe = _('param_approve_status_out_of_range')
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
        obj = ChangeSchedule.objects.filter(abstractexception_ptr_id=code)
        if obj:
            try:
                approver = online_employee_new(device_token)
                if approve_status == models_choices.AUDIT_SUCCESS:
                    obj.update(audit_reason=xssClean(remark),
                               approver=str(approver).split()[1])
                    obj.first().workflowinstance.approve_current_node_by(approver, remark)
                    nodes = NodeInstance.objects.filter(workflow_instance__exception=code).all().order_by('order')
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
                    obj.update(audit_reason=xssClean(remark),
                               approver=str(approver).split()[1])
                    obj.first().workflowinstance.reject_current_node_by(approver, remark)

                    state_ = 0
                    workflow_instance = WorkflowInstance.objects.filter(
                        exception=obj.first().abstractexception_ptr_id).first()
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
            describe = _('object_not_found')
            return interface_response(SUCCESS_CODE, '', '', describe, DATA_EXCEPTION)

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
        from mysite.att.models import ChangeSchedule
        from mysite.att.models_choices import AUDIT_SUCCESS, CANCEL_AUDIT_SUCCESS
        from mysite.att.models.model_changeschedule import delete_from_tempschedule
        from mysite.workflow.models.workflow_instance import WorkflowInstance
        from mysite.workflow.models_choices import NODE_REVOKE
        obj = ChangeSchedule.objects.filter(id=code)
        if obj:
            if obj.first().audit_status == AUDIT_SUCCESS:
                user = online_employee_new(device_token)
                obj.update(audit_reason=xssClean(remark),
                           audit_status=CANCEL_AUDIT_SUCCESS,
                           approver=user.name,
                           audit_time=datetime.datetime.now(),
                           )
                delete_from_tempschedule(obj.first())
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
