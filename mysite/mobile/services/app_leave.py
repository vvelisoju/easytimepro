# -*- coding: utf-8 -*-
import json
import time
import datetime
import calendar
import threading

from django.db import transaction
from django.utils.translation import gettext_lazy as _
from django.db.models import Q
import datetime

from mysite.att.models_choices import CANCEL_AUDIT_SUCCESS
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import MESSAGE_CODE, SUCCESS_CODE, SYSTEM_EXCEPTION, DATA_EXCEPTION, paging
from mysite.mobile.utils import request_valid, datetime2stamp, stamp2datetime, interface_response, online_employee_new, \
    user_photo
from mysite.utils import xssClean


class BioTimeAppLeave(object):
    """
    【Leave】
    """
    _lock = threading.Lock()

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def category(self, source, device_token, language, token):
        """
        Get leave category
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {
                    "code": 1,
                    "error": "",
                    "describe": "",
                    "message": "",
                    "data": {"leave category": [], "leave type": []}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.att.global_cache import C_LEAVE_CLASS
        from mysite.att.models.model_leavecategory import LeaveCategory
        from mysite.att.models import AttSchedule, ShiftDetail, TempSchedule, DepartmentSchedule, TimeInterval
        choices = dict()
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            leaves = C_LEAVE_CLASS.get(str(company_id))
            if leaves:
                leaves = [{'id': obj.id, 'category_name': obj.category_name} for obj in leaves]
            else:
                leaves = LeaveCategory.objects.filter(company_id=company_id).values('id', 'category_name')
            choices['leave_category'] = [{'code': obj['id'], 'name': obj['category_name']} for obj in leaves]

            emp_schedule_is_exists = AttSchedule.objects.filter(employee__company_id=company_id,
                employee=emp, start_date__lte=datetime.datetime.now().date(),
                end_date__gte=datetime.datetime.now().date()).exists
            temp_schedule_is_exits = TempSchedule.objects.filter(employee__company_id=company_id, employee=emp,
                                                                 start_time__date=datetime.datetime.now().date(),
                                                                 end_time__date=datetime.datetime.now().date(),
                                                                 time_interval__isnull=False).exists
            department_schedule_is_exists = DepartmentSchedule.objects.filter(department__company_id=company_id, department_id=emp.department.id,
                                                                              start_date__lte=datetime.datetime.now().date(),
                                                                              end_date__gte=datetime.datetime.now().date()).exists
            if temp_schedule_is_exits():
                temp_schedule = TempSchedule.objects.filter(employee__company_id=company_id, employee=emp,
                                                            start_time__date=datetime.datetime.now().date(),
                                                            end_time__date=datetime.datetime.now().date(),
                                                            time_interval__isnull=False)
                in_time = datetime.datetime.combine(
                    datetime.datetime(2019, 1, 1).date(), temp_schedule[0].time_interval.in_time)
                duration = temp_schedule[0].time_interval.duration
                out_time = in_time + datetime.timedelta(minutes=duration)
                first_half_out_time = temp_schedule[0].time_interval.first_half_out_time
                second_half_in_time = temp_schedule[0].time_interval.second_half_in_time

                choices['leave_type'] = {
                    'first_half_day_interval': '{}-{}'.format(
                        in_time.strftime("%H:%M:%S"), first_half_out_time),
                    'second_half_day_interval': '{}-{}'.format(
                        second_half_in_time, out_time.strftime("%H:%M:%S")),
                    'single_day_interval': '{}-{}'.format(
                        in_time.strftime("%H:%M:%S"), out_time.strftime("%H:%M:%S")),
                    'multiple_day_interval': '{}-{}'.format(
                        in_time.strftime("%H:%M:%S"), out_time.strftime("%H:%M:%S"))
                }
                return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
            elif emp_schedule_is_exists():
                emp_schedule = AttSchedule.objects.get(employee__company_id=company_id, employee=emp, start_date__lte=datetime.datetime.now().date(),
                                                       end_date__gte=datetime.datetime.now().date())
                emp_shift = emp_schedule.shift
                emp_time_interval = ShiftDetail.objects.filter(shift__company_id=company_id, shift=emp_shift, time_interval_id__isnull=False)[
                    0].time_interval

                in_time = datetime.datetime.combine(
                    datetime.datetime(2019, 1, 1).date(), emp_time_interval.in_time)
                duration = emp_time_interval.duration
                out_time = in_time + datetime.timedelta(minutes=duration)
                first_half_out_time = emp_time_interval.first_half_out_time
                second_half_in_time = emp_time_interval.second_half_in_time

                choices['leave_type'] = {
                    'first_half_day_interval': '{}-{}'.format(
                        in_time.strftime("%H:%M:%S"), first_half_out_time),
                    'second_half_day_interval': '{}-{}'.format(
                        second_half_in_time, out_time.strftime("%H:%M:%S")),
                    'single_day_interval': '{}-{}'.format(
                        in_time.strftime("%H:%M:%S"), out_time.strftime("%H:%M:%S")),
                    'multiple_day_interval': '{}-{}'.format(
                        in_time.strftime("%H:%M:%S"), out_time.strftime("%H:%M:%S"))
                }
                return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
            elif department_schedule_is_exists():
                department_schedule = DepartmentSchedule.objects.get(department__company_id=company_id, department_id=emp.department.id,
                                                                     start_date__lte=datetime.datetime.now().date(),
                                                                     end_date__gte=datetime.datetime.now().date())
                dept_shift = department_schedule.shift
                dept_time_interval = ShiftDetail.objects.filter(shift__company_id=company_id, shift=dept_shift, time_interval_id__isnull=False)[
                    0].time_interval

                in_time = datetime.datetime.combine(
                    datetime.datetime(2019, 1, 1).date(), dept_time_interval.in_time)
                duration = dept_time_interval.duration
                out_time = in_time + datetime.timedelta(minutes=duration)
                first_half_out_time = dept_time_interval.first_half_out_time
                second_half_in_time = dept_time_interval.second_half_in_time

                choices['leave_type'] = {
                    'first_half_day_interval': '{}-{}'.format(
                        in_time.strftime("%H:%M:%S"), first_half_out_time),
                    'second_half_day_interval': '{}-{}'.format(
                        second_half_in_time, out_time.strftime("%H:%M:%S")),
                    'single_day_interval': '{}-{}'.format(
                        in_time.strftime("%H:%M:%S"), out_time.strftime("%H:%M:%S")),
                    'multiple_day_interval': '{}-{}'.format(
                        in_time.strftime("%H:%M:%S"), out_time.strftime("%H:%M:%S"))
                }
                return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
            else:
                return interface_response(
                    MESSAGE_CODE, '', '', '', _('you are not assigned with a schedule at this moment contact HR'))

        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, int, int, int, int, str, int, str, str, str, rtype=str)
    def apply(self, leave_type, start, end, leave_payment_type, day_type, remark, source, device_token, language,
              token):
        """
        Applay leave
        @param leave_type:      leave type  （BioTimeAppLeave --> category ）
        @param start:           start time
        @param end:             end time
        @param leave_payment_type:
        @param day_type
        @param remark:
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code": 1, "error": "", "describe": "", "message": "", "data":{"message":"Pop-up message"}}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        with self._lock:
            start = stamp2datetime(start)
            end = stamp2datetime(end)
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            applier = online_employee_new(device_token)
            try:
                data = {
                    'message': u'{0}'.format(_(u'Request already processing'))
                }
                employee_id = applier.id
                leave_save(employee_id, start, end, day_type, leave_type, leave_payment_type, xssClean(remark), str(company_id))
                return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
            except Exception as e:
                import traceback
                traceback.print_exc()
                return interface_response(MESSAGE_CODE, '', '', e, u'{0}'.format(e))

    @request_valid
    @ladonize(int, int, str, str, str, rtype=str)
    def my_application(self, approve_status, page_num, device_token, language, token):
        """
        Get own apply record(pending, approve, reject)
        @param approve_status:  0:approved&rejected, 1:pending, 2:approved，3：rejected
        @param page_num:        page number（15items/page）
        @param language:
        @param token:
        @rtype:
           success
                {"code":1,"error":"","describe":"","message":"","data":{"category":1,"items":[{"code":object ID,
                "pin":"emp_code","name":"first_name","photo":"photo address","start":"start time","end":"end time",
                "remark":"apply reason","category":"apply category","apply_time":"apply time","approve_status":
                "approve value(int)","approve_describe":"approve status descripe","approved_remark":"approve reason",
                "approved_time":"audit time"}, ]}}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.sql_utils import get_sql, p_query
        from mysite.att import models_choices
        from mysite.mobile.choices import CATEGORY_LEAVE

        if approve_status in (0, 1, 2, 3):
            emp = online_employee_new(device_token)
            if not approve_status:
                _approve_status = ' audit_status in (2, 3) '
            else:
                _approve_status = ' audit_status in (%s) ' % approve_status
            where = ' u.employee_id = %(applier)s and %(audit_status)s' % (
                {'applier': '"' + str(emp.id) + '"', 'audit_status': _approve_status})
            sort_name = 'apply_time'
            if approve_status in (1,):  # Apply
                sort_name = 'apply_time'
            page_num = page_num or 1
            try:
                sql = get_sql('sql', sqlid='leave_application', app="mobile", params={'where': where})
                sql = paging(sql, page_num, sort_name)
                rows = p_query(sql)
                data = {
                    'category': CATEGORY_LEAVE,
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
                return interface_response(MESSAGE_CODE, '', '', SYSTEM_EXCEPTION, e)
        else:
            describe = 'parameter approve_status={0} error'.format(approve_status)
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)

    @request_valid
    @ladonize(int, int, int, int, str, str, str, rtype=str)
    def approval_list(self, approve_status, page_num, order_by, source, device_token, language, token):
        from mysite.att import models_choices
        from mysite.workflow.models import NodeInstance
        from django.contrib.contenttypes.models import ContentType
        from mysite.att.models import Leave
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
                    ct_ot = ContentType.objects.get_by_natural_key('att', 'leave')
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
                        'apply_time'
                    ).distinct().exclude(workflow_instance__employee_id=emp.id)
                    if approve_nodes:
                        for r in approve_nodes:
                            exception_id = r[0]
                            apply_obj = Leave.objects.filter(company_id=company_id, id=exception_id).values_list('category__category_name',
                                                                                          'start_time',
                                                                                          'end_time',
                                                                                          'apply_reason', 'apply_time',
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
                return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
        else:
            describe = 'Approve status not in (0,1,2,3)'
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)

    @request_valid
    @ladonize(int, int, str, int, str, str, str, rtype=str)
    def approve(self, code, approve_status, remark, source, device_token, language, token):
        from mysite.att.models import Leave
        from mysite.att import models_choices
        from mysite.workflow.models import NodeInstance
        from mysite.workflow.models.workflow_instance import WorkflowInstance
        import datetime
        if code:
            if approve_status not in (models_choices.AUDIT_SUCCESS, models_choices.REFUSE):
                describe = 'param approve_status out of range'
                return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
            approver = online_employee_new(device_token)
            company_id = approver.company_id
            objs = Leave.objects.filter(company_id=company_id, abstractexception_ptr_id=code)
            if objs:
                obj = objs[0]
                try:
                    audit_time = datetime.datetime.now()
                    if approve_status == models_choices.AUDIT_SUCCESS:
                        objs.update(
                            audit_time=audit_time,
                            approver=str(approver).split()[1],
                            audit_reason=xssClean(remark)
                        )
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
                        objs.update(
                            audit_time=audit_time,
                            approver=str(approver).split()[1],
                            audit_reason=xssClean(remark)
                        )
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
                describe = 'Object Not Found'
                return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
        else:
            describe = _(u'Object ID Not Found')
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
        from mysite.att.models import Leave
        from mysite.att.models_choices import AUDIT_SUCCESS, CANCEL_AUDIT_SUCCESS
        from mysite.workflow.models.workflow_instance import WorkflowInstance
        from mysite.workflow.models_choices import NODE_REVOKE
        user = online_employee_new(device_token)
        company_id = user.company_id
        obj = Leave.objects.filter(company_id=company_id, id=code)
        if obj:
            if obj.first().audit_status == AUDIT_SUCCESS:
                obj.update(
                    audit_reason=xssClean(remark),
                    audit_status=CANCEL_AUDIT_SUCCESS,
                    approver=user.name,
                    audit_time=datetime.datetime.now(),
                )
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


def update_leave_settings(full_month_cal, leave_cal_start_date, leave_cal_end_date, data, status, category,
                          leave_data, company_id):
    from django.db.models import F
    from mysite.att.actions.leave_actions import check_leave_balance, prefix_suffix_leave_combination
    from mysite.att.models.model_leavesettings import LeaveSettings
    check_bal = check_leave_balance(full_month_cal, leave_cal_start_date, leave_cal_end_date, data['emp'], status,
                                    data['max_leave_per_month'], data['leave_schedule'], data['leave_monthly_schedule'],
                                    category, data['effective_date'], data['increment_date'], data['continous_days'],
                                    data['total_days'])
    if check_bal == 1:
        data = prefix_suffix_leave_combination(category, full_month_cal,leave_cal_start_date,leave_cal_end_date,data, leave_data, leave_apply_type='mobile')
        obj = save_leave(data, leave_data['category'], leave_data['leave_payment_type'],
                         leave_data['day_type'], leave_data['reason'], company_id)
        LeaveSettings.objects.filter(company_id=company_id, employee_id=data['emp'].id).update(
            leave_balance=(F('leave_balance') - data['total_days']))
        return obj


def save_leave(data, category, leave_payment_type, day_type, remark, company_id):
    from mysite.att.models import Leave
    obj = Leave(employee=data['emp'],
                start_time=data['start_time'],
                end_time=data['end_time'],
                category_id=category.id,
                leave_payment_type=leave_payment_type,
                days=data['total_days'],
                leave_schedule=data['leave_schedule'],
                day_type=day_type[0],
                apply_reason=xssClean(remark),
                company_id=company_id)
    if not leave_payment_type:
        obj.set_leave_applied_data({"leave_applied_data": data['date_grp']})
        obj.set_leave_applied_data({"leave_category_data": data['category_data']})
    obj.save()
    return obj

def get_off_month(date_str, leave_cal_start_day, leave_cal_end_day):
    from datetime import datetime

    current_date = datetime.strptime(date_str, '%Y-%m-%d')
    year = current_date.year
    month = current_date.month

    if leave_cal_start_day > leave_cal_end_day:
        start_date = datetime(year, month - 1, leave_cal_start_day) if month > 1 else datetime(year - 1, 12, leave_cal_start_day)
        end_date = datetime(year, month, leave_cal_end_day)
    else:
        start_date = datetime(year, month, leave_cal_start_day)
        end_date = datetime(year, month + 1, leave_cal_end_day) if month < 12 else datetime(year + 1, 1, leave_cal_end_day)
    if start_date > end_date:
        end_date = datetime(year + 1, month % 12 + 1, leave_cal_end_day)
    if start_date <= current_date <= end_date:
        month_key = current_date.strftime('%Y-%m')
    else:
        if current_date < start_date:
            if month == 1:
                month_key = f"{year - 1}-12"
            else:
                month_key = f"{year}-{month - 1:02d}"
        else:
            if month == 12:
                month_key = f"{year + 1}-01"
            else:
                month_key = f"{year}-{month + 1:02d}"
    return month_key


@transaction.atomic
def leave_save(employee_id, start, end, day_type, leave_type, leave_payment_type, remark, company_id):
    from mysite.personnel.models import Employee
    from mysite.att.models.model_attrule import AttRule
    from mysite.att.models.model_leavecategory import LeaveCategory
    from mysite.att.actions.leave_actions import check_all_applied_days_have_schedule

    leave_cal = AttRule.objects.filter(company_id=company_id, param_name='global_att_rule_' + company_id.replace('-', '')).values()
    leave_cal_json = json.loads(leave_cal[0]['param_value'])
    global_rule_prefix = global_rule_suffix = 0
    if 'prefix' and 'suffix' in leave_cal_json.keys():
        global_rule_prefix = int(leave_cal_json['prefix'])
        global_rule_suffix = int(leave_cal_json['suffix'])
    if 'leavemng_condition' in leave_cal_json.keys():
        leave_management_condition = int(leave_cal_json['leavemng_condition'])
    else:
        leave_management_condition = "error"
    # checking day_type parameter
    if type(day_type) == int:
        day_type = [day_type]
    else:
        day_type = day_type
    category = leave_type
    category = LeaveCategory.objects.get(company_id=company_id, id=category)
    leave_apply_details = {}
    leave_category_details = {}
    total_days = 0
    leave_data = {'category': category, 'leave_payment_type': leave_payment_type,
                  "day_type": day_type, 'reason': remark, 'company': company_id,
                  'global_rule_prefix': global_rule_prefix,
                  'global_rule_suffix': global_rule_suffix}
    if len(day_type) == 1 and day_type[0] != 4:
        leave_apply_details[str(start.date())] = day_type[0]
        total_days += 1 if day_type[0] == 1 else 0.5
    else:
        diff_days = (end - start)
        if diff_days.days == 0:
            leave_apply_details[str(start.date())] = 1 if day_type[0] == 4 else day_type[0]
            total_days += 1
        else:
            leave_apply_details[str(start.date())] = 1 if day_type[0] == 4 else day_type[0]
            total_days += 1
            last_iteration = diff_days.days + 1
            for i in range(1, diff_days.days + 1):
                if i == last_iteration - 1:
                    leave_apply_details[str(start.date() + datetime.timedelta(days=i))] = 1 if day_type[0] == 4 else \
                        day_type[-1]
                    total_days += 1
                else:
                    leave_apply_details[str(start.date() + datetime.timedelta(days=i))] = 1
                    total_days += 1
    if leave_management_condition == 1:
        # not consider leave management condition
        try:
            employee_leave_data = check_all_applied_days_have_schedule([employee_id], leave_apply_details, leave_data,
                                                                       leave_management_condition)
            for data in employee_leave_data:
                obj = save_leave(data, category, leave_payment_type, day_type, remark, company_id)
        except Exception as e:
            transaction.set_rollback(True)
            raise Exception(e)
    else:
        # consider leave management condition
        try:
            if 'fullmonth' in leave_cal_json.keys():
                full_month_cal = int(leave_cal_json['fullmonth'])
            else:
                full_month_cal = 0
            leaveCal_start_date = int(leave_cal_json['leave_calculation_start_day']) if leave_cal_json[
                'leave_calculation_start_day'] else 0
            leaveCal_end_date = int(leave_cal_json['leave_calculation_end_day']) if leave_cal_json[
                'leave_calculation_end_day'] else 0
            employee_leave_data = check_all_applied_days_have_schedule([employee_id], leave_apply_details, leave_data,
                                                                       leave_management_condition)
            month_str = ''
            for date_str in leave_apply_details:
                if full_month_cal:
                    date = datetime.datetime.strptime(date_str, '%Y-%m-%d')
                    month_str = str(date.strftime('%Y-%m'))

                else:
                    month_str = get_off_month(date_str, leaveCal_start_date, leaveCal_end_date)
                if not month_str in leave_category_details:
                    leave_category_details[month_str] = 1 if leave_apply_details[date_str] == 1 else 0.5
                else:
                    leave_category_details[month_str] += 1 if leave_apply_details[date_str] == 1 else 0.5

            leave_category_details = {str(leave_type): leave_category_details}
            for data in employee_leave_data:
                if leave_payment_type == 1:
                    # un paid leave
                    obj = save_leave(data, category, leave_payment_type, day_type, remark, company_id)
                else:
                    # paid leave
                    if data['leave_schedule'] == '':
                        raise Exception((_("att_leave_schedule_settings_validation")) % data['emp'].first_name)
                    data['date_grp'] = {data['att_date']: leave_apply_details[data['att_date']]}
                    data['category_data'] = leave_category_details
                    data['employee'] = employee_id
                    if float(data['total_days']) > data['leave_balance']:
                        raise Exception(
                            (_("att_leave_balance_used_validation")) % (data['emp'].first_name, data['start_time']))
                    status = [1, 2]
                    obj = update_leave_settings(full_month_cal, leaveCal_start_date, leaveCal_end_date, data, status,
                                                category, leave_data, company_id)
        except Exception as e:
            transaction.set_rollback(True)
            raise Exception(e)
    return obj.id
