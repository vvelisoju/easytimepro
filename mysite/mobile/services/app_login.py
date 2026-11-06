#!/usr/bin/env python
# -*- coding:utf-8 -*-
# author: Arvin
# datetime: 2018/10/29 12:15
# software: PyCharm
import base64
import datetime
import json
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from django.contrib.auth.hashers import make_password
from django.utils.timezone import now
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import save_log, SUCCESS_CODE, MESSAGE_CODE, FORCED_OFFLINE, SYSTEM_EXCEPTION, \
    online_employee_new
from mysite.mobile.utils import interface_response, generate_password
from mysite.base.threadlocals import get_current_request
from mysite.mobile.utils import request_valid

from django.utils.translation import gettext_lazy as _, activate
from django.core.cache import cache
from django.conf import settings
from django.db.models import Q



def get_encryption_params():
    if settings.CLOUD_VERSION:
        AES_KEY = 'mMH7L4DFHzo2y8YSgntzfm1x0Z_hFvMA'.encode('utf-8')
        CONSTANT_IV = 'hQHu9xoUeXc=8YSg'.encode('utf-8')
    else:
        AES_KEY = "MySecretKeyForAES256Encryption12".encode('utf-8')
        CONSTANT_IV = b'1234567890abcdef'

    return AES_KEY, CONSTANT_IV


def encrypt_parameter(value):
    """Encrypt a single parameter using AES-256."""
    AES_KEY, CONSTANT_IV = get_encryption_params()
    iv = CONSTANT_IV
    cipher = AES.new(AES_KEY, AES.MODE_CBC, iv)
    value_bytes = value.encode('utf-8')
    encrypted_bytes = cipher.encrypt(pad(value_bytes, AES.block_size))
    return base64.b64encode(iv + encrypted_bytes).decode('utf-8')


def decrypt_parameter(encrypted_value):
    """Decrypt a single parameter using AES-256."""
    AES_KEY, CONSTANT_IV = get_encryption_params()
    encrypted_bytes = base64.b64decode(encrypted_value)
    iv = CONSTANT_IV
    encrypted_message = encrypted_bytes[16:]
    cipher = AES.new(AES_KEY, AES.MODE_CBC, iv)
    decrypted_bytes = unpad(cipher.decrypt(encrypted_message), AES.block_size)
    return decrypted_bytes.decode('utf-8')


def manage_lockout(username, device_token, failed_attempt=False):
    lockout_key = f"lockout_{username}_{device_token}"
    attempts_key = f"attempts_{username}_{device_token}"
    lockout_info = cache.get(lockout_key)
    if lockout_info:
        lockout_time = lockout_info.get('lockout_time')
        lockout_duration = (datetime.datetime.now() - lockout_time).total_seconds()
        if lockout_duration < 900:
            remaining_time = 900 - lockout_duration
            lockout_message = f"You are locked out. Please try again after {int(remaining_time // 60)} minutes."
            return True, lockout_message, remaining_time
        else:
            cache.delete(lockout_key)
            cache.delete(attempts_key)
    if failed_attempt:
        attempts = cache.get(attempts_key, 0)
        if attempts >= 4:  # Lock user after 5 failed attempts
            cache.set(lockout_key, {'lockout_time': datetime.datetime.now()}, 900)
            return True
        else:
            cache.set(attempts_key, attempts + 1, 900)
    return False, None, 0


class BioTimeAppLogin(object):
    @ladonize(str, str, str, str, str, str, str, str, rtype=str)
    def login(self, username, password, isCloud, company, client, source, device_token, language):
        """
            APP Login
            @param username:        emp_code
            @param password:        employee self password
            @param isCloud:         isCloud
            @param company:         company name
            @param client:          mobile id,unique identifier of the mobile
            @param source:          data source(1: IOS， 2：Android)
            @param language
            @rtype: execute result
                request success：
                    {
                        code": "1", "data": {"token": "088d29bfba7bf97090bdf2c171648553", "role": app account role,
                        "copyright": "copyright state", "pin": "工号"}, "error"："", "describe": "", "message": ""
                    }
                    role: 1: Employee, 2: Administrator， 3: Approver
                request fail:
                    {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        source_len = len(source)
        try:
            # print "[*]Login---. Username:{0}, Password:{1}, Client:{2}".format(username, password, client)
            # print "[*]Source:{0}, Device Token:{1}".format(source, device_token)
            from mysite.accounts.models import MyUser
            from mysite.personnel.models.model_employee import Employee
            from mysite.mobile.models.model_applist import AppList
            from django.db.models import Q
            from mysite.cloud.models import Company
            import datetime
            import time
            import os
            import hashlib
            import re
            req = get_current_request()
            encrypted_params = {
                "username": username,
                "password": password,
                "client": client,
                "device_token": device_token,
                "isCloud": isCloud,
                "language": language,
                "source": source,
                "company": company,
            }
            if source_len > 1:
                decrypted_params = {}
                for param_name, param_value in encrypted_params.items():
                    try:
                        decrypted_params[param_name] = decrypt_parameter(param_value)
                    except Exception as e:
                        error = ''
                        describe = _(f"Invalid parameter: {param_name} is not decrypted.")
                        message = _(f"Invalid parameter: {param_name} is not decrypted.")
                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                username = decrypted_params["username"]
                password = decrypted_params["password"]
                client = decrypted_params["client"]
                device_token = decrypted_params["device_token"]
                isCloud = decrypted_params["isCloud"]
                language = decrypted_params["language"]
                source = decrypted_params["source"]
                company = decrypted_params["company"]
            username = username.strip()
            password = password.strip()
            client = client.strip()
            is_locked_out, lockout_message, remaining_time = manage_lockout(username, device_token,
                                                                            failed_attempt=False)
            if is_locked_out:
                activate(language)
                error = _('Too many failed attempts')
                describe = _('Too many failed attempts. Please wait {0} minutes.'.format(remaining_time // 60))
                message = _('Too many failed attempts. Please wait {0} minutes.'.format(remaining_time // 60))
                return interface_response(MESSAGE_CODE, '', error, describe, message)
            if not client:
                error = _('app_login_failed')
                describe = _('appLogin_param_client_missing')
                message = _('appLogin_illegal_request')
                save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
                activate(language)
                return interface_response(MESSAGE_CODE, '', error, describe, message)
        except Exception as e:
            import traceback
            traceback.print_exc()
        if username:
            try:
                email_re = re.compile(r'^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$')
                mobile_re = re.compile(
                    r'^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$')
                emps = []
                user = username
                if isCloud == 'false':
                    if re.match(email_re, user):
                        emps = Employee.objects.filter(email=user)
                    elif re.match(mobile_re, user):
                        emps = Employee.objects.filter(mobile=user)
                    if not emps:
                        # company_id = company_details[0]
                        # company = Company.objects.get(id=company_id)
                        # emps = Employee.objects.filter(Q(email=user) | Q(mobile=user), company_id=company.id)
                        if (getattr(settings, 'SUPPORT_MUL_COMPANY', 1) == 0) or (
                                Company.objects.all().count() == 1):  # when Multi_company==0,also can use employee ID
                            emps = Employee.objects.filter(emp_code=user)
                    if not emps:
                        activate(language)
                        error = _('user_does_not_exist')
                        describe = _('user_does_not_exist')
                        message = _('user_does_not_exist')
                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                    else:
                        company = emps[0].company
                        company_id = str(company.id)
                        # set the company id to cache
                        cache.set('mobile_company_id_' + device_token, company_id)
                        # set the employee id to cache
                        cache.set('mobile_employee_id_' + device_token, str(emps[0].id))
                else:  # for cloud
                    try:
                        company = Company.objects.get(name__iexact=company)
                        company_id = str(company.id)
                    except:
                        activate(language)
                        error = _('company_does_not_exists')
                        describe = _('company_does_not_exists')
                        message = _('company_does_not_exists')
                        return interface_response(MESSAGE_CODE, '', error, describe, message)

                    if re.match(email_re, user):
                        emps = Employee.objects.filter(email=user)
                    elif re.match(mobile_re, user):
                        emps = Employee.objects.filter(mobile=user)
                    if not emps:
                        error = _('app_login_failed')
                        describe = _('appLogin_incorrect_username_or_password')
                        message = _('appLogin_incorrect_username_or_password')
                        save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
                        activate(language)
                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                    is_pwd = emps[0].check_password(password)
                    if is_pwd and username:
                        # set the company id to cache
                        cache.set('mobile_company_id_' + device_token, company_id)
                        # set the employee id to cache
                        cache.set('mobile_employee_id_' + device_token, str(emps[0].id))

                        now = datetime.datetime.now()
                        key = '{0}{1}{2}'.format(user, os.getpid(), int(round(time.time() * 1000)))
                        token = hashlib.md5(key.encode('utf-8')).hexdigest()

                        app = AppList.objects.filter(username=emps[0].emp_code, device_token=device_token,
                                                     company=company)

                        if not app:
                            app = AppList()
                            app.company = company
                            app.username = emps[0].emp_code
                            app.client_id = client
                            app.active = True
                            app.login_time = now
                            app.last_active = now
                            app.token = token
                            app.client_category = source
                            app.device_token = device_token
                            app.save()
                        else:
                            app.update(active=True, login_time=now, last_active=now, token=token,
                                       client_category=source)
                    else:
                        manage_lockout(username, device_token, failed_attempt=True)
                        error = _('app_login_failed')
                        describe = _('appLogin_incorrect_username_or_password')
                        message = _('appLogin_incorrect_username_or_password')
                        save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
                        activate(language)
                        return interface_response(MESSAGE_CODE, '', error, describe, message)

                if emps:
                    emp = emps[0]
                    daily_limit_key = f"password_reset_limit_{emp.id}_{datetime.datetime.now().date()}"
                    daily_limit = cache.get(daily_limit_key, 0)
                    cache_key = f"password_reset_{emp.id}"
                    reset_data = cache.get(cache_key)
                    if reset_data and daily_limit > 0:
                        reset_password = reset_data['password']
                        emp.self_password = make_password(reset_password)
                        emp.save()
                    is_pwd = emp.check_password(password)
                    if not is_pwd:
                        manage_lockout(username, device_token, failed_attempt=True)
                        error = _('app_login_failed')
                        describe = _('appLogin_incorrect_username_or_password')
                        message = _('appLogin_incorrect_username_or_password')
                        save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
                        activate(language)
                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                if not emps or not is_pwd:
                    # delete the company id to cache
                    cache.delete('mobile_company_id_' + device_token)
                    # delete the employee id to cache
                    cache.delete('mobile_employee_id_' + device_token)
                    error = _('app_login_failed')
                    describe = _('appLogin_incorrect_username_or_password')
                    message = _('appLogin_incorrect_username_or_password')
                    save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
                    return interface_response(MESSAGE_CODE, '', error, describe, message)
                else:
                    emp = emps[0]
                    if not emp.app_status:
                        # delete the company id to cache
                        cache.delete('mobile_company_id_' + device_token)
                        # delete the employee id to cache
                        cache.delete('mobile_employee_id_' + device_token)
                        error = _('app_account_disabled')
                        describe = _('app_account_disabled')
                        message = _('app_account_disable, please_contact_admin_to_enable')
                        save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                    # check the client id, prevent users from logging in with other mobile
                    app_list = AppList.objects.filter(username=emp.emp_code, company=company)

                    if app_list.exists():
                        existed_client_id = app_list[0].device_token
                        if device_token != existed_client_id:
                            # delete the company id to cache
                            cache.delete('mobile_company_id_' + device_token)
                            # delete the employee id to cache
                            cache.delete('mobile_employee_id_' + device_token)
                            error = _('Client Id not match')
                            describe = _('Client Id not match')
                            message = _('Client Id not match, Please contact the administrator to reset')
                            save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
                            return interface_response(MESSAGE_CODE, '', error, describe, message)

                    now = datetime.datetime.now()
                    key = '{0}{1}{2}'.format(user, os.getpid(), int(round(time.time() * 1000)))
                    token = hashlib.md5(key.encode('utf-8')).hexdigest()

                    active_apps = AppList.objects.filter(active=True).filter(
                        Q(username=emp.emp_code) | Q(client_id=client))
                    if active_apps:
                        active_apps.update(active=True)
                    apps = AppList.objects.filter(username=emp.emp_code, device_token=device_token, company=company)
                    if apps:
                        app = apps[0]
                        if not app.enable:
                            # delete the company id to cache
                            cache.delete('mobile_company_id_' + device_token)
                            # delete the employee id to cache
                            cache.delete('mobile_employee_id_' + device_token)
                            error = _('appLogin_request_blocked')
                            describe = _('app_client_already_block_by_administrator')
                            message = _('app_client_blocked')
                            save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
                            return interface_response(MESSAGE_CODE, '', error, describe, message)
                    else:
                        app = AppList()
                        app.company = company
                        app.username = emp.emp_code
                        app.client_id = client
                    app.active = True
                    app.login_time = now
                    app.last_active = now
                    app.token = token
                    app.client_category = source
                    app.device_token = device_token
                    app.save()

                    zk_copyright_en = u'{0}'.format(_('Copyright ©2024 ZKTECO LLC.,LTD.All rights reserved.'))
                    zk_copyright_ar = u'{0}'.format(_('Copyright ©2024 ZKTECO LLC.,LTD.All rights reserved.'))
                    app_role = emp.app_role
                    if app_role in (1,):
                        flow_role = emp.flow_role.all()
                        if flow_role:
                            app_role = 3
                    emp_cod = str(emp).split()
                    emp_code = emp.emp_code  # emp_cod[0]
                    company_name = Company.objects.filter(id=company_id).values_list('name', flat=True)[0]
                    response = {
                        'token': token,
                        'role': app_role or 1,
                        'pin': emp_code,
                        'company_name': company_name,
                        'out_door_status': emps[0].enable_outdoor_management,
                        'copyright': zk_copyright_en,
                        'copyright_en': zk_copyright_en,
                        'copyright_ar': zk_copyright_ar
                    }
                    if source_len > 1:
                        response = {key: encrypt_parameter(str(value)) for key, value in response.items()}
                    return interface_response(1, json.dumps(response), '', 'successful')

            except Exception as e:
                # delete the company id to cache
                cache.delete('mobile_company_id_' + device_token)
                # delete the employee id to cache
                cache.delete('mobile_employee_id_' + device_token)
                import traceback
                traceback.print_exc()
                error = _('app_login_failed')
                describe = u'{0}'.format(e)
                message = _('system_exception')
                save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
                return interface_response(MESSAGE_CODE, '', error, describe, message)
        else:
            # delete the company id to cache
            cache.delete('mobile_company_id_' + device_token)
            # delete the employee id to cache
            cache.delete('mobile_employee_id_' + device_token)
            error = _('app_login_failed')
            describe = _('appLogin_request_params_can_not_find_username')
            message = _('appLogin_params_exception')
            save_log(req, 'Login', client, json.dumps((username, password, client)), describe, status=0)
            activate(language)
            return interface_response(MESSAGE_CODE, '', error, describe, message)

    @request_valid
    @ladonize(str, str, int, str, str, str, rtype=str)
    def sign_out(self, isCloud, company, source, device_token, language, token):
        """
        login out
        @param isCloud:         isCloud
        @param company:         company name
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:        language(en/ar/it)
        @param token:           token
        @rtype:
            {"code": 1, "error":"", "describe":"", "message":"", "data":""}
        """
        from mysite.mobile.models.model_applist import AppList
        from mysite.cloud.models import Company
        if device_token:
            try:
                company = Company.objects.filter(name__iexact=company).first()
            except:
                company = None
            apps = AppList.objects.filter(device_token=device_token, company=company)
            if apps:
                apps.update(active=True)
            emp = online_employee_new(device_token)
            app_token = AppList.objects.filter(token=token, device_token=device_token, company=emp.company_id)
            if app_token:
                app_token.update(token='')
            message = _('app_sign_out_successful')
            return interface_response(SUCCESS_CODE, '', '', 'successful', message)
        else:
            emp = online_employee_new(device_token)
            if emp:
                app_token = AppList.objects.filter(token=token, company=emp.company_id)
                if app_token:
                    app_token.update(token='')
            message = _('appLogout_illegal_request')
            return interface_response(FORCED_OFFLINE, '', '', 'Token missing', message)

    @ladonize(str, str, str, int, str, str, str, rtype=str)
    def reset_password(self, search_item, isCloud, company, source, device_token, language, client):
        """
        reset password
        @param search_item:     PIN/Email Addr
        @param isCloud:         isCloud
        @param company:         company name
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    message push Token
        @param language:        APP language
        @param client:          mobile id
        @rtype:
            {"code": 1, "error":"", "describe":"", "message":"", "data":""}
        """
        from mysite.mobile.models.model_applist import AppList
        from mysite.personnel.models.model_employee import Employee
        from mysite.admin.services.email import send_one_mail
        from mysite.cloud.models import Company
        req = get_current_request()
        if search_item:
            try:
                search_item = search_item.strip()
                if search_item.find('@') != -1:  # eamil
                    if isCloud == 'false':
                        company = Company.objects.get(id='6b969e80f3ff11e9afc7acde48001122')
                        emps = Employee.objects.filter(department__company_id=company.id, email=search_item)
                    else:
                        # need to change this line for cloud login
                        company = Company.objects.get(name__iexact=company)
                        emps = Employee.objects.filter(department__company_id=company.id, email=search_item)
                else:
                    pin = search_item
                    if isCloud == 'false':
                        company = Company.objects.get(id='6b969e80f3ff11e9afc7acde48001122')
                        emps = Employee.objects.filter(department__company_id=company.id, emp_code=pin)
                    else:
                        # need to change this line for cloud login
                        company = Company.objects.get(name__iexact=company)
                        emps = Employee.objects.filter(department__company_id=company.id, emp_code=pin)

                if emps.exists():
                    emp = emps.first()
                    company_id = emp.company_id
                    cache_key = f"password_reset_{emp.id}"
                    reset_data = cache.get(cache_key)

                    daily_limit_key = f"password_reset_limit_{emp.id}_{now().date()}"
                    daily_limit = cache.get(daily_limit_key, 0)
                    current_time = datetime.datetime.now()
                    midnight = current_time.replace(hour=0, minute=0, second=0, microsecond=0) + datetime.timedelta(
                        days=1)
                    time_remaining = midnight - current_time
                    timeout = int(time_remaining.total_seconds())

                    if daily_limit >= 3:
                        error = ' '
                        describe = _('email_limit_exceeded')
                        message = _('email_limit_exceeded')
                        save_log(req, 'reset_password', client, json.dumps((search_item, language, client)), describe,
                                 status=0)
                        return interface_response(
                            MESSAGE_CODE,
                            '',
                            error,
                            describe,
                            message=f"Rate limit exceeded. You can try again in {timeout // 3600} hours and {timeout % 3600 // 60} minutes."
                        )

                    if reset_data and not reset_data['is_used']:
                        error = ' '
                        describe = _('old_password_still_valid')
                        message = _('old_password_still_valid')
                        save_log(req, 'reset_password', client, json.dumps((search_item, language, client)),
                                 describe, status=0)
                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                    apps = AppList.objects.filter(username=emp.emp_code, client_id=client, enable=True, company=company)
                    if apps.exists():
                        new_password = generate_password(6)
                        email = emp.email
                        title = _('biotime_app_password_reset')
                        context = u"""
                            Dear {0}, 
                            Please find your new password <font color="blue">{1}</font>
                            """.format(emp.first_name, new_password)
                        try:
                            send_one_mail(title, context, (email,), company_id=company_id)
                            cache.set(cache_key, {
                                'password': new_password,
                                'is_used': False,
                                'created_at': datetime.datetime.now()
                            }, timeout=900)
                            cache.set(daily_limit_key, daily_limit + 1, timeout=timeout)
                            describe = 'successful'
                            save_log(req, 'reset_password', client, json.dumps((search_item, language, client)),
                                     describe)
                            return interface_response(SUCCESS_CODE, '', '', describe)
                        except Exception as e:
                            describe = str(e)
                            return interface_response(MESSAGE_CODE, '', SYSTEM_EXCEPTION, describe)
                    else:
                        error = _('app_password_reset_failed')
                        describe = _('reset_password_must_to_do_on_the_mobile_with_use')
                        message = _('illegal_operation, please_contact_with_administrator')
                        save_log(req, 'reset_password', client, json.dumps((search_item, language, client)), describe,
                                 status=0)
                        return interface_response(MESSAGE_CODE, '', error, describe, message)
                else:
                    error = _('app_password_reset_failed')
                    describe = _('app_password_reset_user_not_exists')
                    message = _('app_password_reset_user_not_found')
                    save_log(req, 'reset_password', client, json.dumps((search_item, language, client)), describe,
                             status=0)
                    return interface_response(MESSAGE_CODE, '', error, describe, message)
            except Exception as e:
                import traceback
                traceback.print_exc()
                error = _('app_password_reset_failed')
                describe = str(e)
                message = _('system_exception')
                save_log(req, 'reset_password', client,
                         json.dumps({'search_item': search_item, 'language': language, 'client': client}), describe)
                return interface_response(MESSAGE_CODE, '', error, describe, message)
        else:
            error = ''
            describe = ''
            message = _('app_reset_password_please_input_the_available_value')
            save_log(req, 'reset_password', client, json.dumps((search_item, language, client)), describe, status=0)
            return interface_response(MESSAGE_CODE, '', error, message, describe)

    @ladonize(str, str, int, str, rtype=str)
    def version_verify(self, version, client, source, device_token):
        """
        @param version:           App Version
        @param client:            mobile unique identifier
        @param source:            data source(1: IOS， 2：Android)
        @param device_token:      message push Token
        @return:
        """
        return interface_response(SUCCESS_CODE, json.dumps({'beta': 1}), '', 'successful')

    @ladonize(str, str, int, str, str, str, rtype=str)
    def firmware_upgrade(self, model, version, source, device_token, language, token):
        """
        @param model:           model
        @param version:            Version
        @param source:            data source(1: IOS， 2：Android)
        @param device_token:             device_token
        @param language:        APP language
        @param token:             token
        @return:
        """
        import boto3
        from mysite.iclock.models import Products
        from django.conf import settings
        product = Products.objects.filter(device_model=model).order_by('major_version', 'minor_version',
                                                                       'bug_fix').reverse()
        try:
            if product[0].firmware_version != version:
                firmware_root = 'firmware/' + '{0}/{1}/{2}'.format(product[0].device_model, product[0].firmware_version,
                                                                   product[0].firmware_file)
                session = boto3.session.Session(aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
                s3 = session.resource('s3')
                object = s3.Object(settings.AWS_STORAGE_BUCKET_NAME, firmware_root)
                file_size = object.content_length
                response = {
                    'key': firmware_root,
                    'bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'version': product[0].firmware_version,
                    'model': product[0].device_model,
                    'file_size': file_size
                }
            else:
                response = {
                    'update': 'Not available'
                }
        except Exception as e:
            response = {
                'update': 'Not available'
            }
        return interface_response(SUCCESS_CODE, json.dumps(response), '', _('successful'))

    @ladonize(str, str, int, str, str, str, rtype=str)
    def forget_password(self, username, company, source, device_token, language, token):
        """
        @param username:           username
        @param company:            company
        @param source:            data source(1: IOS， 2：Android)
        @param device_token:             device_toke
        @param language:        APP language
        @param token:             token
        @return:
        """
        # only for cloud version
        import re
        from mysite.iclock.models import Products
        from mysite.utils import get_system_setting
        from mysite.accounts.models import MyUser
        from mysite.accounts.urls import send_email_reset_pwd_link
        from mysite.tools.encryption_utils import aes_encrypt
        from mysite.base.tasks import reset_pwd_link_email
        from django.conf import settings
        from django.core.urlresolvers import reverse
        from mysite.cloud.models import Company
        from mysite.personnel.models.model_employee import Employee

        email_re = re.compile(r'^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$')
        check_is_user = re.match(email_re, username)
        if not check_is_user:
            company_data = Company.objects.filter(name__iexact=company)
            if not company_data:
                error = _('company_does_not_exists')
                describe = _('company_does_not_exists')
                message = _('company_does_not_exists')
                return interface_response(MESSAGE_CODE, '', error, describe, message)
            company_value = company_data[0]
            company_id = str(company_value.id)
            email_setting = get_system_setting('email_setting', )
            if not email_setting:
                error = _('email_setting_does_not_exists')
                describe = _('email_setting_does_not_exists')
                message = _('email_setting_does_not_exists')
                return interface_response(MESSAGE_CODE, '', error, describe, message)
        if check_is_user:
            #  email -> user
            company_data = Company.objects.filter(name__iexact=company)
            if not company_data:
                error = _('company_does_not_exists')
                describe = _('company_does_not_exists')
                message = _('company_does_not_exists')
                return interface_response(MESSAGE_CODE, '', error, describe, message)
            user = MyUser.objects.filter(email__iexact=username)
        if check_is_user and user.exists():
            is_emp = False
        else:
            #  emp_code -> employee
            user = Employee.objects.filter(emp_code=username, department__company__name__iexact=company)
            if user.exists():
                is_emp = True
        if not user.exists():
            error = _('email_or_employee_id_not_exists')
            describe = _('email_or_employee_id_not_exists')
            message = _('email_or_employee_id_not_exists')
            return interface_response(MESSAGE_CODE, '', error, describe, message)
        # user or emp exist, need check email and company
        user = user[0]
        if is_emp:
            if user.email is None:
                error = _('your_email_not_exist_please_connect_to_admin')
                describe = _('your_email_not_exist_please_connect_to_admin')
                message = _('your_email_not_exist_please_connect_to_admin')
                return interface_response(MESSAGE_CODE, '', error, describe, message)
        # if user need send email
        scheme = True
        host = settings.DOMAIN_HOST
        email = user.email
        if user.is_employee:
            emp_code = user.emp_code
            raw_data = "{'emp_code':'" + emp_code + "', 'company_name':'" + company + "'}"
        else:
            company_id = None  # user get email by zklicense
            raw_data = "{'email':'" + email + "'}"
        aes_data = str(aes_encrypt(raw_data), encoding='utf-8')
        reset_pwd_url = reverse('biotime:reset_pwd')
        link_url = '{scheme}://{host}{reset_pwd_url}?code={code}'.format(scheme=scheme, host=host,
                                                                         reset_pwd_url=reset_pwd_url, code=aes_data)
        reset_pwd_link_email.delay(email, company_id, link_url)
        return interface_response(SUCCESS_CODE, json.dumps({'email': 'sent'}), '', _('successful'))
