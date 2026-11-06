# -*- coding: utf-8 -*-
from mysite.ladon.ladonizer import ladonize
from mysite.mobile.utils import request_valid, online_employee_new, stamp2datetime, datetime2stamp, interface_response
from mysite.mobile.utils import save_notification, user_photo, get_sender
from mysite.mobile.utils import SUCCESS_CODE, MESSAGE_CODE, SYSTEM_EXCEPTION, DATA_EXCEPTION, paging

from django.utils.translation import gettext_lazy as _
import json

from mysite.utils import xssClean


class BioTimeAppAnnouncement(object):
    """
    【Announcement】
    """

    @request_valid
    @ladonize(str, str, str, str, int, int, str, str, str, rtype=str)
    def upload_announcement(self, user, subject, content, category, send_time, source, device_token, language, token):
        """
        @param user:            employee id , add Private it's required
        @param subject:         (required)title
        @param content:         (required)content
        @param category:        1:Public, 2:Private
        @param send_time:       upload time（stamp）
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code": 1, "error": "", "describe": "", "message": "", "data":{"message":"Pop-up message"}}
            fail
                {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        from mysite.mobile.models.model_announcement import Announcement
        from mysite.mobile.choices import PUBLIC_ANNOUNCEMENT, PRIVATE_ANNOUNCEMENT
        if int(category) == PRIVATE_ANNOUNCEMENT and not user:
            error = _(u'Data Error')
            describe = _(u'Private announcement must be with user.')
            return interface_response(MESSAGE_CODE, '', error, describe, DATA_EXCEPTION)
        try:
            send_time = stamp2datetime(send_time)
            emp = online_employee_new(device_token)
            anc = Announcement()
            anc.subject = xssClean(subject)
            anc.content = xssClean(content)
            anc.category = category
            anc.company_id = emp.company_id
            anc.sender = emp.id
            anc.system_sender = ''
            anc.send_time = send_time
            if int(category) == PRIVATE_ANNOUNCEMENT and user:
                anc.receiver_id = user
            anc.save()
            data = {
                'message': u'{0}'.format(_(u'Request is processing'))
            }
            return interface_response(SUCCESS_CODE, json.dumps(data), '', '')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)

    @request_valid
    @ladonize(str, int, int, str, str, str, rtype=str)
    def pull_announcement(self, category, page_num, source, device_token, language, token):
        """
        get announcement
        @param category:        １：Public, ２：Private
        @param page_num:        page number(１５items/page)
        @param source:          data source(1: IOS， 2：Android)
        @param device_token:    Token for push message
        @param language:
        @param token:
        @rtype:
            success
                {"code": 1, "error": "", "describe": "", "message": "", "data":[{"code": object ID, "subject":"title",
                "content":"", "send_time":"(stamp)"},]}
            fail
               {"code": -10001, "error": "", "describe": "exception state", "message": "Pop-up message", "data":""}
        """
        from mysite.sql_utils import get_sql, p_query
        from mysite.mobile.choices import ANNOUNCEMENT_CATEGORY, PRIVATE_ANNOUNCEMENT
        from mysite.mobile.models.model_announcement import Announcement
        from mysite.personnel.models import Employee
        from mysite.mobile.utils import employee_transaction_paging
        from django.db.models import Q
        if not category:
            describe = u'{0}'.format(_(u'Params category="{0}" error.'.format(category)))
            return interface_response(MESSAGE_CODE, '', '', describe, DATA_EXCEPTION)
        try:
            emp = online_employee_new(device_token)
            emp_id_format = "'" + emp.id + "'"
            page_num = page_num or 1
            PAGE_SIZE = 15
            begin = (page_num - 1) * PAGE_SIZE
            end = page_num * PAGE_SIZE
            params = {'receiver': emp_id_format, 'category': category}
            id_part = {"and": []}
            if category in (PRIVATE_ANNOUNCEMENT,):
                id_part['and'].append('receiver')
            sql = get_sql('sql', sqlid='announcement', app="mobile", params=params, id_part=id_part)
            sql = employee_transaction_paging(sql, sort_name='create_time', sort_order='desc')
            rows = p_query(sql)
            data = []
            if rows:
                # announcement_system_sender = Announcement.objects.filter(system_sender__exact='admin',
                #                                                          company_id=emp.company_id)
                announcement_public_message = Announcement.objects.filter(category=1, company_id=emp.company_id)

                if emp.app_role == 2:
                    params = (Q(sender=emp.id) | Q(receiver_id__exact=emp.id)) & Q(company_id=emp.company_id)
                else:
                    params = Q(receiver_id__exact=emp.id) & Q(company_id=emp.company_id)
                announcement_private_message = Announcement.objects.filter(params, category=2)

                '''
                Above Used Three Filters Because Employee may send the messages
                if he has role as well he may receive the messages
                and Admin may send the messages to all Employees. 
                The Reason why used Three filter conditions based on the requirement as to satisfy the
                Sent, Receive messages
                '''
                announcementList = []
                if int(category) != PRIVATE_ANNOUNCEMENT:
                    # for system_sender in announcement_system_sender:
                    #     announcementList.append(system_sender.id)
                    for public_message in announcement_public_message:
                        announcementList.append(public_message.id)
                else:
                    # for system_sender in announcement_system_sender:
                    #     announcementList.append(system_sender.id)
                    for private_message in announcement_private_message:
                        announcementList.append(private_message.id)
                categories = dict(ANNOUNCEMENT_CATEGORY)
                data = []
                for r in rows:
                    try:
                        emp_name = Employee.objects.filter(id=r[4]).first()
                        if emp_name:
                            first_name = emp_name.first_name
                            last_name = emp_name.last_name
                        else:
                            first_name = 'Admin'
                            last_name = 'Admin'
                    except:
                        first_name = ''
                        last_name = ''
                    if r[0] in announcementList:
                        row = dict()
                        is_sender = False
                        if r[4] == emp.id:
                            is_sender = True
                        row['code'] = r[0]
                        row['name'] = first_name or last_name
                        row['photo'] = get_sender({'sender': r[4], 'system_sender': r[6]})['photo']
                        row['category'] = u'{0}'.format(categories[int(category)])
                        row['category_val'] = category
                        row['subject'] = r[1]
                        # This Boolean is for Android team will distinguish wheather sent
                        # or received message in the front end.
                        row['sender'] = is_sender
                        row['content'] = r[2]
                        row['notification_time'] = datetime2stamp(r[3])
                        data.append(row)
            return interface_response(SUCCESS_CODE, json.dumps(data[begin:end]), '', 'successful')
        except Exception as e:
            import traceback
            traceback.print_exc()
            return interface_response(MESSAGE_CODE, '', '', e, SYSTEM_EXCEPTION)
