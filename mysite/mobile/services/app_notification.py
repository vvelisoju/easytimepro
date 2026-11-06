# -*- coding: utf-8 -*-
import json

from django.db.models import F
from django.utils.translation import gettext_lazy as _

from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import request_valid, online_employee_new, interface_response, datetime2stamp, \
    get_sender, MESSAGE_CODE, SUCCESS_CODE, DATA_EXCEPTION, paging, read_notification


class BioTimeAppNotification(object):
    """
    【Notification】 Notice
    """

    @request_valid
    @ladonize(int, int, int, str, str, str, rtype=str)
    def pull_approve_flow(self, category, code, source, device_token, language, token):
        """
        get approve notification
        @param category:
        @param code:            object id
        @param source:           data source(1: IOS， 2：Android)
        @param device_token:     Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1, "error":"", "describe":"", "message":"", "data":[{"pin":"emp_code",""name": "first_name",
                "photo": "photo address",approve_status":"int value","approve_describe":"status describe",
                 "action_time":　(stamp)}, ]}
                approve_status: 　１:pending，２：approved，３：rejected
            fail
                {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        from mysite.mobile.choices import CATEGORY_LEAVE, CATEGORY_OVERTIME, CATEGORY_MANUAL, CATEGORY_TRAINING, \
            CATEGORY_SCHEDULE, CATEGORY_ANNOUNCEMENT, CATEGORY_ATTENDANCE, CATEGORY_REIMBURSEMENT
        from mysite.att import models_choices
        from django.contrib.contenttypes.models import ContentType
        from mysite.workflow.models import NodeInstance
        from mysite.mobile.utils import user_photo
        from mysite.personnel.models.model_employee import Employee
        from mysite.workflow.models import WorkflowNode
        emp = online_employee_new(device_token)
        emp_id_format = "'" + emp.id + "'"
        read_notification(category, emp_id_format)
        profile = None
        if category not in (
                CATEGORY_LEAVE, CATEGORY_OVERTIME, CATEGORY_MANUAL, CATEGORY_TRAINING, CATEGORY_SCHEDULE,
                CATEGORY_ANNOUNCEMENT,
                CATEGORY_ATTENDANCE, CATEGORY_REIMBURSEMENT):
            describe = _('Parameter_error')
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
        data = {
            'category': category,
            'items': []
        }
        if category in (CATEGORY_MANUAL,):
            from mysite.att.models.model_manuallog import ManualLog
            objs = ManualLog.objects.filter(id=code).select_related('employee', 'employee__department')
            ct_obj = ContentType.objects.get_by_natural_key('att', 'manuallog')
            if objs:
                obj = objs[0]
                profile = {
                    'code': obj.pk,
                    'pin': obj.employee.emp_code,
                    'name': obj.employee.first_name,
                    'department': obj.employee.department,
                    'approve_status': obj.audit_status,
                    'remark': u'{0}'.format(obj.apply_reason),
                    'action_time': datetime2stamp(obj.apply_time)
                }

        elif category in (CATEGORY_LEAVE,):
            from mysite.att.models.model_leave import Leave
            ct_obj = ContentType.objects.get_by_natural_key('att', 'leave')
            objs = Leave.objects.filter(id=code).select_related('employee', 'employee__department')
            if objs:
                obj = objs[0]
                profile = {
                    'code': obj.pk,
                    'pin': obj.employee.emp_code,
                    'name': obj.employee.first_name,
                    'department': obj.employee.department,
                    'approve_status': obj.audit_status,
                    'remark': u'{0}'.format(obj.apply_reason),
                    'action_time': datetime2stamp(obj.apply_time)
                }

        elif category in (CATEGORY_OVERTIME,):
            from mysite.att.models.model_overtime import Overtime
            ct_obj = ContentType.objects.get_by_natural_key('att', 'overtime')
            objs = Overtime.objects.filter(id=code).select_related('employee', 'employee__department')
            if objs:
                obj = objs[0]
                profile = {
                    'code': obj.pk,
                    'pin': obj.employee.emp_code,
                    'name': obj.employee.first_name,
                    'department': obj.employee.department,
                    'approve_status': obj.audit_status,
                    'remark': u'{0}'.format(obj.apply_reason),
                    'action_time': datetime2stamp(obj.apply_time)
                }
        elif category in (CATEGORY_TRAINING,):
            from mysite.att.models.model_training import Training
            ct_obj = ContentType.objects.get_by_natural_key('att', 'training')
            objs = Training.objects.filter(id=code).select_related('employee', 'employee__department')
            if objs:
                obj = objs[0]
                profile = {
                    'code': obj.pk,
                    'pin': obj.employee.emp_code,
                    'name': obj.employee.first_name,
                    'department': obj.employee.department,
                    'approve_status': obj.audit_status,
                    'remark': u'{0}'.format(obj.apply_reason),
                    'action_time': datetime2stamp(obj.apply_time)
                }
        elif category in (CATEGORY_SCHEDULE,):
            from mysite.att.models.model_changeschedule import ChangeSchedule
            ct_obj = ContentType.objects.get_by_natural_key('att', 'changeschedule')
            objs = ChangeSchedule.objects.filter(id=code).select_related('employee', 'employee__department')
            if objs:
                obj = objs[0]
                profile = {
                    'code': obj.pk,
                    'pin': obj.employee.emp_code,
                    'name': obj.employee.first_name,
                    'department': obj.employee.department,
                    'approve_status': obj.audit_status,
                    'remark': u'{0}'.format(obj.apply_reason),
                    'action_time': datetime2stamp(obj.apply_time)
                }
        elif category in (CATEGORY_REIMBURSEMENT,):
            from mysite.payroll.models import Reimbursement
            objs = Reimbursement.objects.filter(workflow_abstractException_id=code).select_related('employee', 'employee__department')
            ct_obj = ContentType.objects.get_by_natural_key('payroll', 'reimbursement')
            if objs:
                obj = objs[0]
                profile = {
                    'code': obj.pk,
                    'pin': obj.employee.emp_code,
                    'name': obj.employee.first_name,
                    'department': obj.employee.department,
                    'approve_status': obj.workflow_abstractException.audit_status,
                    'remark': u'{0}'.format(obj.audit_reason),
                    'action_time': datetime2stamp(obj.apply_time)
                }
        if profile:
            status = dict(models_choices.ALL_AUDIT_STATUS)
            item = {
                'pin': profile['pin'],
                'name': profile['name'] or profile['pin'],
                'photo': user_photo(profile['pin']),
                'approve_status': profile['approve_status'],
                'approve_describe': u'{0}'.format(status.get(profile['approve_status'], 'Apply')),  # 审批状态描述
                'remark': profile['remark'],
                'action_time': profile['action_time']
            }
            data['items'].append(item)
            approve_node = NodeInstance.objects.filter(
                workflow_instance__workflow_engine__content_type=ct_obj.id,
                workflow_instance__exception_id=code
            ).values(
                'state',
                'remark',
                'apply_time',
                'approver_employee__first_name',
                'approver_employee__emp_code',
                'approver_admin',
                'is_last_node',
                'node_engine__id',
                'node_engine__approver_by_overall',
                'node_engine__node_code'
            ).annotate(
                flow_name=F('node_engine__approver__role_name')
            ).order_by('node_engine__order_id')

            approve_nodes = {}
            for node in approve_node:
                node_engine_id = node['node_engine__id']
                flow_name = node['flow_name']
                if node_engine_id in approve_nodes:
                    approve_nodes[node_engine_id]['flow_name'] += '/' + flow_name
                else:
                    approve_nodes[node_engine_id] = node

            flow_items = []
            if approve_nodes:
                for node in approve_nodes.values():
                    admin_approver = node['approver_admin']
                    # print '[*]admin_approver:', admin_approver
                    if admin_approver:
                        from mysite.accounts.models import MyUser
                        user = MyUser.objects.filter(id=admin_approver).first()
                        node_status = node['state']
                        if user:
                            emp_pin = user.emp_pin or str(user)
                            pin = name = user.first_name or str(user)
                        else:
                            pin = name = emp_pin = 'admin'
                        if node_status == 4:
                            node_status = 3
                        flow_item = {
                            'action_time': datetime2stamp(node['apply_time']),
                            'approve_status': node_status,
                            'name': name,
                            'pin': pin,
                            'photo': user_photo(emp_pin) or '/files/photo/administrator.png',
                            'remark': f"Remark: {node['remark']}" if node['remark'] else '',
                            'approve_describe': f'{status[node_status]}',
                        }
                        flow_items.append(flow_item)
                        break
                    else:
                        node_status = node['state']
                        if node_status in [models_choices.APPLICATION, models_choices.AUDITING,
                                           models_choices.APPLICATION_AGAIN]:
                            node_code = node['node_engine__node_code']
                            emp_pin = f'node:{node_code}'
                            emp_name = f"Approver Role : {node['flow_name']}"
                            emp_photo = ''
                        else:
                            emp_pin = node['approver_employee__emp_code']
                            emp_name = node['approver_employee__first_name']
                            emp_photo = user_photo(node['approver_employee__emp_code'])
                        if node_status == 4:
                            node_status = 3
                        flow_item = {
                            'action_time': datetime2stamp(node['apply_time']),
                            'approve_status': node_status,
                            'approve_describe': u'{0}'.format(status[node_status]),
                            'name': emp_name,
                            'pin': emp_pin,
                            'photo': emp_photo,
                            'remark': u'Remark: {0}'.format(node['remark']) if node['remark'] else '',
                        }
                        flow_items.append(flow_item)
                        if node_status == 3:
                            break
                data['items'].extend(flow_items)
        return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')

    @request_valid
    @ladonize(int, int, int, str, str, str, rtype=str)
    def pull_notification(self, page_num, category, source, device_token, language, token):
        """
        get announcement
        @param page_num: page number(15items/page)
        @param category:
            (1:Leave, 2:Overtime, 3:Manual Punch, 4:Training, 5:Schedule, 6:Announcement, 7:Attendance, 8:Reimbursement)
            category=0 return the unread count
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                category=0
                    {"code":1,"error":"","describe":"","message":"","data":[
                    {"category": (int), "category_name": '', 'category_label': "title name", "unread": 'unread count'},
                    ]}
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
        from mysite.mobile.models.model_notification import AppNotification
        from mysite.mobile.choices import UNREAD, APPLICANT_CATEGORY, SUB_CATEGORY, \
            CATEGORY_LEAVE, CATEGORY_OVERTIME, CATEGORY_MANUAL, CATEGORY_TRAINING, CATEGORY_SCHEDULE, \
            CATEGORY_ANNOUNCEMENT, CATEGORY_ATTENDANCE, CATEGORY_REIMBURSEMENT
        from mysite.sql_utils import get_sql, p_query, p_execute
        from mysite.att import models_choices
        from mysite.att.att_param import get_func_key
        from django.db.models import Count
        from mysite.mobile.utils import employee_transaction_paging
        import datetime
        # support pagination
        page_num = page_num or 1
        PAGE_SIZE = 15
        begin = (page_num - 1) * PAGE_SIZE
        end = page_num * PAGE_SIZE
        emp = online_employee_new(device_token)
        company_id = emp.department.company.id
        status = {models_choices.APPLICATION: 1, models_choices.AUDIT_SUCCESS: 2,
                  models_choices.REFUSE: 3, models_choices.APPLICATION_AGAIN: 4,
                  models_choices.AUDITING: 5, models_choices.CANCEL_AUDIT_SUCCESS: 6,
                  models_choices.WITHDRAW_AUDIT_SUCCESS: 7}
        if category:
            sub_category = dict(SUB_CATEGORY)
            data = {
                'category': category,
                'items': []
            }
            emp_id_format = "'" + emp.id + "'"
            sql = get_sql(
                'sql',
                sqlid='notification',
                app="mobile",
                params={
                    'category': category,
                    'receiver': emp_id_format})
            sql = employee_transaction_paging(sql, sort_name='notification_time', sort_order='desc')
            rows = p_query(sql)
            vals = []
            if rows:
                vals = [{'sub_category': r[0],
                         'sender': r[1],
                         'system_sender': r[2],
                         'content': r[3],
                         'source': r[4],
                         'notification_time': r[5]} for r in rows]
            for val in vals:
                sender = get_sender(val)
                if category in (
                        CATEGORY_LEAVE,
                        CATEGORY_OVERTIME,
                        CATEGORY_TRAINING):
                    '''
                    Leave, Overtime, Training
                    '''
                    item = {
                        'code': val['source'],
                        'name': sender['name'],
                        'photo': sender['photo'],
                        "category": "",
                        "start": "",
                        "end": "",
                        "remark": "",
                        "apply_time": "",
                        "approve_status": "",
                        "approve_describe": ""}
                    if val['content']:
                        detail = json.loads(val['content'])
                        approve_status = detail['approve_status']
                        # if approve_status in (models_choices.AUDITING,):
                        #     approve_status = models_choices.AUDIT_SUCCESS
                        # elif approve_status in (models_choices.CANCEL_AUDIT_SUCCESS,):
                        #     approve_status = models_choices.REFUSE
                        approve_status = status.get(approve_status, None)
                        item.update({
                            'category': detail['category'], 'start': detail['start'],
                            'end': detail['end'], 'remark': detail['remark'],
                            'apply_time': detail['apply_time'],
                            'approve_status': approve_status, 'approve_describe': detail['approve_describe'],
                        })
                    data['items'].append(item)
                elif category in (CATEGORY_MANUAL,):
                    '''
                    Manual Punch
                    '''
                    item = {
                        'code': val['source'],
                        'name': sender['name'],
                        'photo': sender['photo'],
                        "category": "",
                        "punch_time": "",
                        "remark": "",
                        "apply_time": "",
                        "approve_status": "",
                        "approve_describe": ""}
                    if val['content']:
                        detail = json.loads(val['content'])
                        if detail:
                            approve_status = detail['approve_status']
                            # if approve_status in (models_choices.AUDITING,):
                            #     approve_status = models_choices.AUDIT_SUCCESS
                            # elif approve_status in (models_choices.CANCEL_AUDIT_SUCCESS,):
                            #     approve_status = models_choices.REFUSE
                            approve_status = status.get(approve_status, None)
                            item.update({
                                'category': get_func_key(str(detail['category']), company_id),
                                'punch_time': detail['punch_time'],
                                'remark': detail['remark'], 'apply_time': detail['apply_time'],
                                'approve_status': approve_status, 'approve_describe': detail['approve_describe'],
                            })
                        data['items'].append(item)
                elif category in (CATEGORY_SCHEDULE,):
                    '''
                    Change schedule
                    '''
                    item = {
                        'code': val['source'],
                        'name': sender['name'],
                        'photo': sender['photo'],
                        "category": "",
                        "previous_shift": "",
                        "currently_shift": "",
                        "remark": "",
                        "apply_time": "",
                        "approve_status": "",
                        "approve_describe": ""}
                    if val['content']:
                        detail = json.loads(val['content'])
                        approve_status = detail['approve_status']
                        # if approve_status in (models_choices.AUDITING,):
                        #     approve_status = models_choices.AUDIT_SUCCESS
                        # elif approve_status in (models_choices.CANCEL_AUDIT_SUCCESS,):
                        #     approve_status = models_choices.REFUSE
                        approve_status = status.get(approve_status, None)
                        item.update(
                            {
                                'category': detail['category'],
                                'previous_shift': detail['previous_timeinterval'] or 'None',
                                'currently_shift': detail['currently_timeinterval'],
                                'remark': detail['remark'],
                                'apply_time': detail['apply_time'],
                                'approve_status': approve_status,
                                'approve_describe': detail['approve_describe'],
                            })
                    data['items'].append(item)
                elif category in (CATEGORY_ANNOUNCEMENT,):
                    '''
                    Announcement
                    '''
                    read_notification(category, emp_id_format)
                    item = {
                        'code': val['source'],
                        'name': sender['name'],
                        'photo': sender['photo'],
                        'subject': '',
                        'content': '',
                        'category': u'{0}'.format(
                            sub_category.get(
                                val['sub_category'],
                                '')),
                        'category_val': val['sub_category'],
                        'notification_time': datetime2stamp(val['notification_time'])
                    }
                    if val['content']:
                        detail = json.loads(val['content'])
                        item.update(detail)
                    data['items'].append(item)
                elif category in (CATEGORY_ATTENDANCE,):
                    '''
                    Attendance Exception
                    '''
                    read_notification(category, emp_id_format)
                    item = {
                        'code': val['source'],
                        'name': emp.first_name,
                        'photo': sender['photo'],
                        "category": u'{0}'.format(sub_category.get(val['sub_category'], '')),
                        "category_val": val['sub_category'],
                        "content": val['content'],
                        "notification_time": datetime2stamp(val['notification_time'])
                    }
                    data['items'].append(item)
                elif category in (CATEGORY_REIMBURSEMENT,):
                    '''
                    Reimbursement
                    '''
                    item = {
                        'code': val['source'],
                        'name': sender['name'],
                        'photo': sender['photo'],
                        "amount": "",
                        "remark": "",
                        "start": "",
                        "end": "",
                        "start_date": "",
                        "end_date": "",
                        "apply_time": "",
                        "approve_status": "",
                        "approve_describe": ""}
                    if val['content']:
                        detail = json.loads(val['content'])
                        if detail:
                            approve_status = detail['approve_status']
                            # if approve_status in (models_choices.AUDITING,):
                            #     approve_status = models_choices.AUDIT_SUCCESS
                            # elif approve_status in (models_choices.CANCEL_AUDIT_SUCCESS,):
                            #     approve_status = models_choices.REFUSE
                            approve_status = status.get(approve_status, None)
                            item.update({
                                'amount': detail['amount'], 'start': detail['start_date'], 'end': detail['end_date'],
                                'start_date': detail['start_date'], 'end_date':detail['end_date'],
                                'remark': detail['remark'], 'apply_time': detail['apply_time'],
                                'approve_status': approve_status, 'approve_describe': detail['approve_describe'],
                            })
                        data['items'].append(item)
            pagination_items = data['items'][begin:end]
            data['items'] = pagination_items 
        else:
            categorys = dict(APPLICANT_CATEGORY)
            nfcs = AppNotification.objects.filter(receiver__company_id=company_id, receiver=emp, read_status=UNREAD).order_by('category').values(
                'category').annotate(unread=Count('category'))
            data = [
                {'category': 1, 'category_name': 'leave', 'category_label': u'{0}'.format(categorys[1]), 'unread': 0},
                {'category': 2, 'category_name': 'overtime', 'category_label': u'{0}'.format(categorys[2]),
                 'unread': 0},
                {'category': 3, 'category_name': 'manual', 'category_label': u'{0}'.format(categorys[3]), 'unread': 0},
                {'category': 4, 'category_name': 'training', 'category_label': u'{0}'.format(categorys[4]),
                 'unread': 0},
                {'category': 5, 'category_name': 'schedule', 'category_label': u'{0}'.format(categorys[5]),
                 'unread': 0},
                {'category': 6, 'category_name': 'announcement', 'category_label': u'{0}'.format(categorys[6]),
                 'unread': 0},
                {'category': 7, 'category_name': 'attendance', 'category_label': u'{0}'.format(categorys[7]),
                 'unread': 0},
                {'category': 8, 'category_name': 'reimbursement', 'category_label': u'{0}'.format(categorys[8]),
                 'unread': 0},
            ]
            for nfc in nfcs:
                category_index = (nfc['category'] - 1)
                item = data[category_index]
                item['unread'] = nfc['unread']
                data[category_index] = item
        return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')

