import multiprocessing

# host:ip
bind = "0.0.0.0:8000"
# workers count. cpu_count * 2 + 1
workers = multiprocessing.cpu_count() * 2 + 1

worker_class = 'gevent'
timeout = 120
limit_request_line = 0
