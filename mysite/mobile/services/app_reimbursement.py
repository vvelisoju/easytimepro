# -*- coding: utf-8 -*-
import math
import os
import json
import random
import time
import datetime
import shutil
import base64
import io
from PIL import Image

from django.conf import settings
from django.utils.translation import gettext_lazy as _
from dataclasses import dataclass
from django.db.models import Q

from mysite.att.models_choices import CANCEL_AUDIT_SUCCESS
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import SUCCESS_CODE, MESSAGE_CODE, interface_response, request_valid, online_employee_new, \
    stamp2datetime, datetime2stamp, SYSTEM_EXCEPTION, DATA_EXCEPTION, user_photo
from mysite.utils import xssClean


@dataclass
class ApprovalStatusDTO:
    name: str
    status: str


class BioTimeAppReimbursement(object):
    """
    【Reimbursement】
    """

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def allowanceType(self, source, device_token, language, token):
        """
        Get allowanceType
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":[{}]}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.payroll.models import AllowanceType
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            allowance_type = AllowanceType.objects.filter(company=company_id).order_by('id')
            choices = [
                {'id': obj.id, 'allowance_type': obj.allowance_name} for obj in allowance_type]
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, str, str, str, rtype=str)
    def purposeType(self, source, device_token, language, token):
        """
        Get allowanceType
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":[{}]}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.payroll.models import PurposeType
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            purpose_type = PurposeType.objects.filter(company=company_id).order_by('id')
            choices = [
                {'id': obj.id, 'purpose_type': obj.purpose_name} for obj in purpose_type]
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, int, int, int, str, str, float, str, int, str, str, str, rtype=str)
    def apply(self, start_date, end_date, allowance_type, purpose_type, additional_employee, receipts, amount, remark,
              source, device_token, language, token):
        """
        Apply employee punch status
        @param start_date
        @param end_date
        @param allowance_type
        @param purpose_type
        @param additional_employee
        @param receipts
        @param amount
        @param remark
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
        emp = online_employee_new(device_token)
        try:
            from mysite.payroll.models import AllowanceType, PurposeType
            from mysite.payroll.models import Reimbursement
            from mysite.payroll.models.model_salary_structure import SalaryStructure
            rmb_date = str(datetime.datetime.now())
            rmb_start_date = stamp2datetime(start_date)
            rmb_end_date = stamp2datetime(end_date)
            allowance_type = allowance_type
            allowance_type = AllowanceType.objects.filter(id=allowance_type)
            purpose_type = purpose_type
            purpose_type = PurposeType.objects.filter(id=purpose_type)
            salary_structure_data = SalaryStructure.objects.filter(employee_id=emp.id)
            if not salary_structure_data:
                describe = u'{0}'.format(_('Payroll structure not found'))
                message = u'{0}'.format(_('Payroll structure not found'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if rmb_start_date >= rmb_end_date:
                describe = u'{0}'.format(_('leave_time_invalid_range_start_end'))
                message = u'{0}'.format(_('leave_time_invalid_range_start_end'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if rmb_start_date and rmb_start_date > datetime.datetime.today():
                describe = u'{0}'.format(_('reimbursement_startdate_cannot_greater_than_current_day'))
                message = u'{0}'.format(_('reimbursement_startdate_cannot_greater_than_current_day'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if rmb_end_date and rmb_end_date > datetime.datetime.today():
                describe = u'{0}'.format(_('reimbursement_enddate_cannot_greater_than_current_day'))
                message = u'{0}'.format(_('reimbursement_enddate_cannot_greater_than_current_day'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if not amount:
                describe = u'{0}'.format(_('loan_fields_requied'))
                message = u'{0}'.format(_('loan_fields_requied'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if amount <= 0:
                describe = u'{0}'.format(_('the_amount_need_lager_than_zero'))
                message = u'{0}'.format(_('the_amount_need_lager_than_zero'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            files_name = []
            uploaded_files = json.loads(receipts)
            rmb_files = []
            for x in uploaded_files:
                rmb_files.append(x)
            rpt_files = ''
            source_file = ''
            files_format = ['jpg', 'jpeg', 'png', 'bmp', 'pdf', 'docx', 'xlsx']
            if rmb_files and rmb_date:
                file_date = rmb_date[:10]
                file_root = settings.REIMBURSEMENT_FILE_ROOT + '{0}/'.format(file_date)
                source_file = file_root + '{0}/{1}/'.format('root', hex(int(time.time() * 1000)))
                for rmb_file in rmb_files:
                    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
                    randomstr = ''.join((random.choice(chars)) for x in range(10))
                    find_img_extension = rmb_file.split('@')
                    file_name = str(emp.emp_code) + randomstr + '.' + find_img_extension[0]
                    name_list = file_name.split('.')
                    f_format = name_list[-1]
                    f_format = f_format.lower()
                    if f_format not in files_format:
                        error = ''
                        describe = _('reimbursement_receipt_file_format_constraints')
                        message = _('reimbursement_receipt_file_format_constraints')
                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                    name_list.pop()
                    name_list.append(f_format)
                    files_name.append(file_name)
                    image = base64.b64decode(str(find_img_extension[1]))
                    img = io.BytesIO(image)
                    file_data = img.getvalue()
                    if len(file_data) / (1024 * 1024) > 2:
                        describe = u'{0}'.format(_('file_size_validation'))
                        message = u'{0}'.format(_('file_size_validation'))
                        return interface_response(MESSAGE_CODE, '', '', describe, message)
                    file_path = os.path.join(source_file, file_name)
                    if not os.path.exists(source_file):
                        os.makedirs(source_file)
                    with open(file_path, 'wb') as f:
                        f.write(file_data)
            if len(files_name) > 0:
                rpt_files = '/'.join(files_name)
            else:
                describe = u'{0}'.format(_('receipt_file_validation'))
                message = u'{0}'.format(_('receipt_file_validation'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            obj = Reimbursement.objects.create(employee=emp, allowance_type=allowance_type[0],
                                               purpose_type=purpose_type[0], rmb_amount=amount,
                                               rmb_start_date=rmb_start_date,
                                               rmb_end_date=rmb_end_date, rmb_remark=xssClean(remark),
                                               additional_employee=additional_employee,
                                               company_id= emp.company_id)
            if rpt_files:
                path_info = '{0}/{1}/'.format(emp.id, obj.id)
                emp_files = file_root + path_info
                if not os.path.exists(emp_files):
                    os.makedirs(emp_files)
                img_files = os.listdir(source_file)
                for img in img_files:
                    if not os.path.isfile(img):
                        img = img.encode('utf-8').decode('gbk')
                    s_file = os.path.join(source_file, img)
                    new_file = os.path.join(emp_files, img)
                    shutil.copy(s_file, new_file)
                obj.rmb_file = rpt_files
                obj.save()
            if source_file and os.path.exists(source_file):
                shutil.rmtree(source_file)
                root_path = file_root + 'root/'
                if os.path.exists(root_path):
                    if not os.listdir(root_path):
                        shutil.rmtree(root_path)
            data = {
                'message': u'{0}'.format(_(u'Request already processing'))
            }
            return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, u'{0}'.format(e))

    @request_valid
    @ladonize(int, int, str, str, str, rtype=str)
    def reimbursementView(self, page_num, source, device_token, language, token):
        """
        GET reimbursementView
        @param page_num:        page number(10 items/page)
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":[{}]}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from django.conf import settings
        from mysite.payroll.models import Reimbursement
        from mysite.personnel.models import Employee
        from mysite.att.models_choices import ALL_AUDIT_STATUS
        from mysite.workflow.models.workflow_instance import WorkflowInstance
        try:
            emp = online_employee_new(device_token)
            reimbursement = Reimbursement.objects.filter(employee_id=emp.id).order_by('id')
            page_size = 10
            page_num = page_num or 1
            start = (page_num - 1) * page_size
            end = page_num * page_size
            reimbursement = reimbursement[start:end]
            choices = []
            if reimbursement:
                for x in reimbursement:
                    file_date, emp_id = x.apply_time, x.employee_id
                    if isinstance(file_date, datetime.datetime):
                        file_date = file_date.strftime('%Y-%m-%d')
                    else:
                        file_date = file_date[:10]
                    setting_path = settings.REIMBURSEMENT_FILE_ROOT + '/{0}'.format(file_date)
                    recpt_root = 'files/reimbursement' + '/{0}'.format(file_date)
                    file_info = '{0}/{1}'.format(emp_id, x.id)
                    file_path = os.path.join(setting_path, file_info)
                    recpt_file = os.path.join(recpt_root, file_info)
                    imgs = []
                    if os.path.exists(file_path):
                        img_files = os.listdir(file_path)
                        for file_name in img_files:
                            file_url = os.path.join(recpt_file, file_name)
                            imgs.append(file_url)
                    data = {}
                    allowance = {'id': x.allowance_type.id, 'allowance_type': x.allowance_type.allowance_name}
                    purpose = {'id': x.purpose_type.id, 'purpose_type': x.purpose_type.purpose_name}
                    additional_employee_data = {}
                    if x.additional_employee:
                        for y in json.loads(x.additional_employee):
                            try:
                                emps = Employee.objects.filter(id=y)
                                additional_employee_data[emps[0].id] = emps[0].first_name or emps[
                                    0].emp_code  # Emp_code is Taken because when the data is sync to software from device having only emp_code
                            except:
                                additional_employee_data = {}
                    else:
                        additional_employee_data = {}

                    approval_status = None
                    workflow_excpetion_id = x.workflow_abstractException.id
                    workflow_instance_ = WorkflowInstance.objects.filter(exception=workflow_excpetion_id).first()
                    if workflow_instance_:
                        node_instance_ = workflow_instance_.nodeinstance_set.order_by('order').all()
                        approval_statuses = dict(ALL_AUDIT_STATUS)
                        approval_status = [{'name': i.name, 'status': f'{approval_statuses[i.state]}'} for i in
                                           node_instance_]

                    data['id'] = x.id
                    data['allowance_type'] = allowance
                    data['purpose_type'] = purpose
                    data['amount'] = x.rmb_amount
                    data['additional_employee'] = additional_employee_data
                    data['receipts'] = imgs
                    data['receipts_name'] = x.rmb_file
                    data['rmb_start_date'] = str(x.rmb_start_date)
                    data['rmb_end_date'] = str(x.rmb_end_date)
                    data['remarks'] = x.rmb_remark
                    data['status'] = x.workflow_abstractException.audit_status
                    if approval_status:
                        data['approval_list'] = approval_status
                    choices.append(data)
            return interface_response(SUCCESS_CODE, json.dumps(choices), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, int, str, str, str, rtype=str)
    def reimbursementDelete(self, id, source, device_token, language, token):
        """
        Delete reimbursementDelete
        @param id
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code":1,"error":"","describe":"","message":"","data":[{}]}
            fail
                {"code":-10001,"error":"","describe":"","message":"Pop-up message","data":""}
        """
        from mysite.payroll.models import Reimbursement
        try:
            emp = online_employee_new(device_token)
            company_id = emp.department.company.id
            obj = Reimbursement.objects.filter(id=id)
            obj.delete()
            data = {
                'message': u'{0}'.format(_(u'Request already processing'))
            }
            return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(int, int, int, int, int, str, str, str, float, str, int, str, str, str, rtype=str)
    def reimbursementUpdate(self, id, start_date, end_date, allowance_type, purpose_type, additional_employee, receipts,
                            deleted_receipts, amount, remark,
                            source, device_token, language, token):
        """
        Apply employee punch status
        @param id
        @param start_date
        @param end_date
        @param allowance_type
        @param purpose_type
        @param additional_employee
        @param receipts
        @param amount
        @param remark
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
        emp = online_employee_new(device_token)
        try:
            from mysite.payroll.models import AllowanceType, PurposeType
            from mysite.payroll.models import Reimbursement
            from mysite.payroll.models.model_salary_structure import SalaryStructure
            from mysite.workflow.models import WorkflowInstance
            from mysite.workflow.models_choices import NODE_PENDING
            rmb_date = str(datetime.datetime.now())
            rmb_start_date = stamp2datetime(start_date)
            rmb_end_date = stamp2datetime(end_date)
            allowance_type = allowance_type
            allowance_type = AllowanceType.objects.filter(id=allowance_type)
            purpose_type = purpose_type
            purpose_type = PurposeType.objects.filter(id=purpose_type)
            salary_structure_data = SalaryStructure.objects.filter(employee_id=emp.id)
            if not salary_structure_data:
                describe = u'{0}'.format(_('Payroll structure not found'))
                message = u'{0}'.format(_('Payroll structure not found'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if rmb_start_date >= rmb_end_date:
                describe = u'{0}'.format(_('leave_time_invalid_range_start_end'))
                message = u'{0}'.format(_('leave_time_invalid_range_start_end'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if rmb_start_date and rmb_start_date > datetime.datetime.today():
                describe = u'{0}'.format(_('reimbursement_startdate_cannot_greater_than_current_day'))
                message = u'{0}'.format(_('reimbursement_startdate_cannot_greater_than_current_day'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if rmb_end_date and rmb_end_date > datetime.datetime.today():
                describe = u'{0}'.format(_('reimbursement_enddate_cannot_greater_than_current_day'))
                message = u'{0}'.format(_('reimbursement_enddate_cannot_greater_than_current_day'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if not amount:
                describe = u'{0}'.format(_('loan_fields_requied'))
                message = u'{0}'.format(_('loan_fields_requied'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            if amount <= 0:
                describe = u'{0}'.format(_('the_amount_need_lager_than_zero'))
                message = u'{0}'.format(_('the_amount_need_lager_than_zero'))
                return interface_response(MESSAGE_CODE, '', '', describe, message)
            reimbursement = Reimbursement.objects.filter(id=id)
            workflow_instances = WorkflowInstance.objects.filter(
                exception_id=reimbursement[0].workflow_abstractException_id).first()
            if workflow_instances:
                pending_node_exists = workflow_instances.nodeinstance_set.exclude(state=NODE_PENDING).exists()
                if pending_node_exists:
                    describe = u'{0}'.format(_('application_has_approved_node'))
                    message = u'{0}'.format(_('application_has_approved_node'))
                    return interface_response(MESSAGE_CODE, '', '', describe, message)
            rece = reimbursement[0].rmb_file
            old_file = reimbursement[0].rmb_file.split('/')
            files_name = old_file
            '''checking for old file'''
            try:
                if source == 1:
                    deleted_receipts = json.dumps(
                        [receipts.strip() for receipts in deleted_receipts.strip('[]').split(',')])
                old_deleted_files = json.loads(deleted_receipts)
                for x in range(len(old_deleted_files)):
                    if '\\' in old_deleted_files[x]:
                        old_deleted_newfile = old_deleted_files[x].rsplit("\\")[-1]
                    else:
                        old_deleted_newfile = old_deleted_files[x].rsplit('/')[-1]
                    old_deleted_files[x] = old_deleted_newfile
            except:
                old_deleted_files = []
            uploaded_files = json.loads(receipts)
            file_root = settings.REIMBURSEMENT_FILE_ROOT
            if len(uploaded_files) > 0:
                if len(old_deleted_files) > 0:
                    path_info = '{0}/{1}/{2}'.format(str(reimbursement[0].apply_time)[:10], emp.id, id)
                    for del_file in old_deleted_files:
                        emp_files = file_root + path_info + '/' + del_file
                        try:
                            os.remove(emp_files)
                        except:
                            pass
                        if del_file in files_name:
                            files_name.remove(del_file)
                    rmb_files = []
                    for x in uploaded_files:
                        rmb_files.append(x)
                    files_format = ['jpg', 'jpeg', 'png', 'bmp', 'pdf', 'docx', 'xlsx']
                    if len(rmb_files) > 0:
                        path_info = '{0}/{1}/{2}'.format(str(reimbursement[0].apply_time)[:10], emp.id, id)
                        file_path = file_root + path_info
                        if not os.path.exists(file_path):
                            os.makedirs(file_path)
                        for rmb_file in rmb_files:
                            chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
                            randomstr = ''.join((random.choice(chars)) for x in range(10))
                            find_img_extension = rmb_file.split('@')
                            file_name = str(emp.emp_code) + randomstr + '.' + find_img_extension[0]
                            name_list = file_name.split('.')
                            f_format = name_list[-1]
                            f_format = f_format.lower()
                            if f_format not in files_format:
                                error = ''
                                describe = _('reimbursement_receipt_file_format_constraints')
                                message = _('reimbursement_receipt_file_format_constraints')
                                return interface_response(MESSAGE_CODE, '', error, describe, message)
                            name_list.pop()
                            name_list.append(f_format)
                            files_name.append(file_name)
                            image = base64.b64decode(str(find_img_extension[1]))
                            img = io.BytesIO(image)
                            file_data = img.getvalue()
                            with open(file_path + '/' + file_name, 'wb') as f:
                                f.write(file_data)
                            reimbursement.update(allowance_type=allowance_type[0],
                                                 purpose_type=purpose_type[0], rmb_amount=amount,
                                                 rmb_start_date=rmb_start_date,
                                                 rmb_end_date=rmb_end_date, rmb_remark=xssClean(remark),
                                                 additional_employee=additional_employee, rmb_file='/'.join(files_name))
                            data = {
                                'message': u'{0}'.format(_(u'Request already processing'))
                            }
                            return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
                else:
                    rmb_files = []
                    for x in uploaded_files:
                        rmb_files.append(x)
                    files_format = ['jpg', 'jpeg', 'png', 'bmp', 'pdf', 'docx', 'xlsx']
                    if len(rmb_files) > 0:
                        path_info = '{0}/{1}/{2}'.format(str(reimbursement[0].apply_time)[:10], emp.id, id)
                        file_path = file_root + path_info
                        if not os.path.exists(file_path):
                            os.makedirs(file_path)
                        for rmb_file in rmb_files:
                            chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
                            randomstr = ''.join((random.choice(chars)) for x in range(10))
                            find_img_extension = rmb_file.split('@')
                            file_name = str(emp.emp_code) + randomstr + '.' + find_img_extension[0]
                            name_list = file_name.split('.')
                            f_format = name_list[-1]
                            f_format = f_format.lower()
                            if f_format not in files_format:
                                error = ''
                                describe = _('reimbursement_receipt_file_format_constraints')
                                message = _('reimbursement_receipt_file_format_constraints')
                                return interface_response(MESSAGE_CODE, '', error, describe, message)
                            name_list.pop()
                            name_list.append(f_format)
                            files_name.append(file_name)
                            image = base64.b64decode(str(find_img_extension[1]))
                            img = io.BytesIO(image)
                            file_data = img.getvalue()
                            with open(file_path + '/' + file_name, 'wb') as f:
                                f.write(file_data)
                            reimbursement.update(allowance_type=allowance_type[0],
                                                 purpose_type=purpose_type[0], rmb_amount=amount,
                                                 rmb_start_date=rmb_start_date,
                                                 rmb_end_date=rmb_end_date, rmb_remark=xssClean(remark),
                                                 additional_employee=additional_employee, rmb_file='/'.join(files_name))
                            data = {
                                'message': u'{0}'.format(_(u'Request already processing'))
                            }
                            return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
            elif len(uploaded_files) == 0:
                if len(old_deleted_files) == len(files_name):
                    error = ''
                    describe = _('reimbursement_receipt_file_format_constraints')
                    message = _('reimbursement_receipt_file_format_constraints')
                    return interface_response(MESSAGE_CODE, '', error, describe, message)
                elif len(old_deleted_files) < len(files_name):
                    if (len(old_deleted_files)) > 0:
                        path_info = '{0}/{1}/{2}'.format(str(reimbursement[0].apply_time)[:10], emp.id, id)
                        for del_file in old_deleted_files:
                            emp_files = file_root + path_info + '/' + del_file
                            try:
                                os.remove(emp_files)
                            except:
                                pass
                            if del_file in files_name:
                                files_name.remove(del_file)
                    reimbursement.update(allowance_type=allowance_type[0],
                                         purpose_type=purpose_type[0], rmb_amount=amount,
                                         rmb_start_date=rmb_start_date,
                                         rmb_end_date=rmb_end_date, rmb_remark=remark,
                                         additional_employee=additional_employee, rmb_file='/'.join(files_name))
                    data = {
                        'message': u'{0}'.format(_(u'Request already processing'))
                    }
                    return interface_response(SUCCESS_CODE, json.dumps(data), '', 'successful')
            else:
                data = {
                    'message': u'{0}'.format(_(u'Hi Firend Please test your self'))
                }
                return interface_response(MESSAGE_CODE, json.dumps(data), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, u'{0}'.format(e))

    @request_valid
    @ladonize(int, int, int, int, str, str, str, rtype=str)
    def approval_list(self, approve_status, page_num, order_by, source, device_token, language, token):
        """
        get approve list
        @param approve_status:  ·（required）0:approved&rejected, 1:pending, 2:approved，3：rejected
        @param page_num:        page number(１５items/page)
        @param order_by:        sort(1: apply time，２：approve time), application page default１，approve page default２
        @param source:           data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            {"code": 1, "error": "", "describe": "", "message": "", "data":[{"id": ID, "pin": "emp_code", "name":"first_name",
            "photo":"photo address", "start": "", "end": "", "allowance_type":"", "purpose_type":"", "amount":"", "reimbursement_receipt":"", "remark":"apply reason", "approve_status": ""},]}
        """
        from django.conf import settings
        from mysite.att import models_choices
        from mysite.workflow.models import NodeInstance
        from django.contrib.contenttypes.models import ContentType
        from mysite.payroll.models import Reimbursement, AllowanceType, PurposeType
        from mysite.personnel.models import Employee

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
                    ct_ot = ContentType.objects.get_by_natural_key('payroll', 'reimbursement')
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

                            if exception_id in prv_exception:  #
                                continue
                            apply_obj = Reimbursement.objects.filter(
                                workflow_abstractException_id=exception_id).values_list('allowance_type',
                                                                                        'purpose_type',
                                                                                        'rmb_start_date',
                                                                                        'rmb_end_date', 'rmb_amount',
                                                                                        'additional_employee',
                                                                                        'rmb_file', 'rmb_remark',
                                                                                        'apply_time',
                                                                                        'employee__emp_code',
                                                                                        'employee__first_name',
                                                                                        'employee_id', 'id',
                                                                                        'audit_time')
                            if apply_obj:
                                apply_obj = apply_obj[0]
                                allowance_type = AllowanceType.objects.filter(id=apply_obj[0])
                                purpose_type = PurposeType.objects.filter(id=apply_obj[1])
                                allowance = {'id': allowance_type[0].id,
                                             'allowance_type': allowance_type[0].allowance_name}
                                purpose = {'id': purpose_type[0].id, 'purpose_type': purpose_type[0].purpose_name}
                                additional_employee_data = {}
                                try:
                                    for y in json.loads(apply_obj[5]):
                                        emps = Employee.objects.filter(id=y)
                                        additional_employee_data[emps[0].id] = emps[0].first_name
                                except:
                                    additional_employee_data = {}
                                '''images'''
                                file_date, emp_id = apply_obj[8], apply_obj[11]
                                if isinstance(file_date, datetime.datetime):
                                    file_date = file_date.strftime('%Y-%m-%d')
                                else:
                                    file_date = file_date[:10]
                                setting_path = settings.REIMBURSEMENT_FILE_ROOT + '/{0}'.format(file_date)
                                recpt_root = 'files/reimbursement' + '/{0}'.format(file_date)
                                file_info = '{0}/{1}'.format(emp_id, apply_obj[12])
                                file_path = os.path.join(setting_path, file_info)
                                recpt_file = os.path.join(recpt_root, file_info)
                                imgs = []
                                if os.path.exists(file_path):
                                    img_files = os.listdir(file_path)
                                    for file_name in img_files:
                                        file_url = os.path.join(recpt_file, file_name)
                                        imgs.append(file_url)

                                approval_list = []
                                is_rejected = ""
                                from mysite.workflow.models import WorkflowInstance
                                workflow_instance = WorkflowInstance.objects.get(exception_id=exception_id)
                                for approval in workflow_instance.nodeinstance_set.all().order_by('order'):
                                    approval_status = ""
                                    if approval.state == 2:
                                        approval_status = "Approved"
                                    elif approval.state == 3:
                                        is_rejected = approval.name
                                        approval_status = "Rejected"
                                    elif approval.state == 6:
                                        approval_status = "Revoke"
                                    else:
                                        approval_status = "Pending"
                                    approved_time = approval.apply_time.strftime(
                                        '%d-%m-%Y %H:%M:%S') if approval.apply_time != None else ""
                                    if approval.approver_employee != None:
                                        emp_name = Employee.objects.get(
                                            id=approval.approver_employee_id).first_name
                                        final_status = emp_name + "(" + approval_status + " " + approved_time + ")"
                                    else:
                                        final_status = approval_status
                                    approval_list.append(
                                        ApprovalStatusDTO(name=approval.name, status=final_status).__dict__)

                                res_data = {
                                    'code': exception_id,
                                    'pin': apply_obj[9],
                                    'name': apply_obj[10],
                                    'photo': user_photo(apply_obj[9]),
                                    'allowance_type': allowance,
                                    'purpose_type': purpose,
                                    'additional_employee': additional_employee_data,
                                    'receipts': imgs,
                                    'start_date': datetime2stamp(apply_obj[2]),
                                    'end_date': datetime2stamp(apply_obj[3]),
                                    'amount': apply_obj[4],
                                    'remark': u'{0}'.format(apply_obj[7] or ''),
                                    'apply_time': datetime2stamp(apply_obj[8]),
                                    'approve_status': r[2],
                                    'approve_describe': u'{0}'.format(status.get(r[2], r[2])),
                                    'approved_remark': u'{0}'.format(r[3]),
                                    'approved_time': datetime2stamp(apply_obj[13]),
                                    'approval_list': approval_list
                                }
                                prv_exception.append(exception_id)
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
        overtime approve
        @param code:                ID
        @param approve_status:      ·(required）audit status(2 : approved/ 3 :rejected)
        @param source:              data source(1: IOS， 2：Android)
        @param device_token:        push message Token
        @param language:
        @param token:
        @rtype:
        """
        from mysite.payroll.models import Reimbursement
        from mysite.att import models_choices
        from mysite.workflow.models import NodeInstance
        from mysite.workflow.models.workflow_instance import WorkflowInstance

        if code:
            if approve_status not in (models_choices.AUDIT_SUCCESS, models_choices.REFUSE):
                describe = _('param_approve_status_out_of_range')
                return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
            approver = online_employee_new(device_token)
            objs = Reimbursement.objects.filter(workflow_abstractException_id=code)
            if objs:
                try:
                    obj = objs[0]
                    audit_time = datetime.datetime.now()
                    if approve_status == models_choices.AUDIT_SUCCESS:
                        objs.update(audit_reason=xssClean(remark),
                                    approver=str(approver).split()[1],
                                    audit_time=audit_time)
                        obj.workflow_abstractException.workflowinstance.approve_current_node_by(approver, remark)
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
                        objs.update(audit_reason=xssClean(remark),
                                    approver=str(approver).split()[1])
                        obj.workflow_abstractException.workflowinstance.reject_current_node_by(approver,
                                                                                               obj.audit_reason)
                        state_ = 0
                        workflow_instance = WorkflowInstance.objects.filter(
                            exception=obj.workflow_abstractException_id).first()
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
                return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
        else:
            describe = _('object_id_not_found')
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
        from mysite.payroll.models import Reimbursement
        from mysite.workflow.models import AbstractException
        from mysite.att.models_choices import AUDIT_SUCCESS, CANCEL_AUDIT_SUCCESS
        from mysite.workflow.models.workflow_instance import WorkflowInstance
        from mysite.workflow.models_choices import NODE_REVOKE
        obj = Reimbursement.objects.filter(workflow_abstractException_id=code)
        if obj:
            if obj.first().workflow_abstractException.audit_status == AUDIT_SUCCESS:
                user = online_employee_new(device_token)
                obj.update(audit_reason=xssClean(remark),
                           approver=user.name,
                           audit_time=datetime.datetime.now()
                           )
                AbstractException.objects.filter(id=code).update(audit_status=CANCEL_AUDIT_SUCCESS)
                workflow_instance = WorkflowInstance.objects.filter(
                    exception=obj.first().workflow_abstractException_id).first()
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
        from mysite.personnel.models.model_employee import Employee
        from mysite.mobile.utils import online_employee
        emp = online_employee_new(device_token)
        company_id = emp.company_id
        try:
            emps = Employee.objects.filter(company_id=company_id)
            search_item = search_item.strip()
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
                     'name': obj['first_name'] or '', 'mobile': obj['mobile'] or '',
                     'email': obj['email'] or '', 'position': obj['position__position_name'] or '',
                     'photo': user_photo(obj['emp_code'])} for obj in objs]
            return interface_response(SUCCESS_CODE, json.dumps(data), '', '')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
