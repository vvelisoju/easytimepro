#!/usr/bin/env python
# -*- coding:utf-8 -*-
# author: michael.wang
# datetime: 2022/09/13 18:08
# last modified by:
"""
This file is very important to serve the console program
"""
import uuid
import os,sys


PROJECT_PATH = os.path.abspath(os.path.dirname(os.path.dirname('__file__')))
def saveToFile(text, fn=None, append=True, ctlsize=False):
    """/files/conn_logs.zk dont rename or change,this file is used by bioCat to check result"""
    if not fn:
        fn = os.path.join(PROJECT_PATH+'/files/' , 'conn_logs.zk')
    with open(fn, "w") as f:
        try:
            f.write(text)
        except:
            pass
    return fn



def conn_db():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
    from django.db import connection
    from django.conf import settings
    LMAC = uuid.uuid1().hex[-12:].lower()
    print("mac=%s" % LMAC)
    s = ''
    import time
    try:
        t1=time.time()
        cursor = connection.cursor()
        s = "connection is successful"
        tables = connection.introspection.table_names(cursor)
        if len(tables) < 50:
            s = '%s,No tables'%(s)
        db_engine = settings.DATABASE_ENGINE.lower()
        if db_engine in ['sql_server']:
            cursor = connection.cursor()
            cursor.execute("SELECT @@version")
            ver = cursor.fetchone()[0]
            s = '%s\r\nSqlSever Version:%s' % (s,ver)
        elif db_engine in ['mysql']:
            cursor.execute("SELECT VERSION()")
            ver = cursor.fetchone()[0]
            s = '%s\r\nMySQL Version: %s' % (s,ver)
        elif db_engine in ['postgresql', 'postgresql_psycopg2']:
            cursor.execute("SELECT version()")
            ver = cursor.fetchone()[0]
            s = '%s\r\nPostgreSQL Version: %s' % (s,ver)
        elif db_engine in ['oracle']:  
            cursor.execute("SELECT * FROM v$version WHERE banner LIKE 'Oracle%'")
            ver = cursor.fetchone()[0]
            s = '%s\r\nOracle Version: %s' % (s,ver)            
        t2=(time.time()-t1)*1000
        s = '%s\r\nConnection time: %.2f ms' % (s,t2)
            
    except Exception as e:
        s = '%s' % e

        s = "connection failed:" + s

    s = '%s %s'%(settings.DATABASE_ENGINE,s)
    print(s)
    saveToFile(s)


def check_db():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
    from django.db import connection
    from django.core.management import call_command
    s = 'create tables failed:'
    try:
        import django
        django.setup()
        call_command('migrate')

        with connection.cursor() as cursor:
            tables = connection.introspection.table_names(cursor)
            if len(tables) > 50:
                s = 'create tables successfully'
    except Exception as e:
        print(e)
    print(s)
    saveToFile(s)


def clear_cache():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
    from django.conf import settings
    from django.core.cache import cache
    if 'django_redis' in settings.CACHES['default']['BACKEND']:
        from django_redis import get_redis_connection
        get_redis_connection("default").flushall()
    cache.clear()
    print('Cache cleanup completed')
    
def upgrade_software():
    from glob import glob

    p=os.path.split(os.path.realpath(__file__))[0]

    os.environ['PATH']="%s/%s"%(p,"zkeco_dlls;")+"%(p)s\\Python;"%{"p":p}+os.environ['PATH']

#    new_sys_path = [p]
#    virtualenv=['%s/Python','%s/zkeco_dlls','%s/python/scripts','%s/python37/lib','%s/Python37/lib/site-packages']
#    for d in virtualenv:
#        new_sys_path.append(d%p)

#    sys.path = new_sys_path

    easy_upgrade_pyd = glob("easy_upgrade.*.pyd")
    easy_upgrade_py = os.path.join(PROJECT_PATH, 'easy_upgrade.py')
    if easy_upgrade_pyd and os.path.exists(easy_upgrade_py):
        os.remove(easy_upgrade_py)

    from easy_upgrade import easytime_upgrade
    easytime_upgrade()

def create_command(cmd_str):
    """
    SET OPTION LimitAllocSpace=2048
    """
    import django
    django.setup()
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
    from django.conf import settings
    from mysite.iclock.models import Terminal    
    from mysite.utils import saveCmd    
    devices = Terminal.objects.exclude(area__is_default=True)
    for dev in devices:
        saveCmd(dev.pk,cmd_str)
        print(dev.sn+' done')



if __name__ == '__main__':
    if len(sys.argv) == 1 or (len(sys.argv) > 1 and sys.argv[1] == 'conndb'):
        conn_db()
    elif len(sys.argv) > 1 and sys.argv[1] == 'checkdb':
        check_db()
    elif len(sys.argv) > 1 and sys.argv[1] == 'clear_cache':
        clear_cache()
    elif len(sys.argv) > 1 and sys.argv[1] == 'upgrade_software':
        upgrade_software()
    elif len(sys.argv) > 1 and sys.argv[1] == 'command':
        if len(sys.argv) ==2:
            print('params must be 2,actual 1 given,for ex:')
            print('python ConnDb.py command "INFO"')
        else:
            print(sys.argv[2])
            create_command(sys.argv[2])
    else:
        print('nothing to do')
