#!/usr/bin/env bash

#!/usr/bin/env bash

if [ "$CONTAINER_DEPLOY" == "compose" ]; then
  echo "Waiting for postgres..."
  echo ${POSTGRES_HOST} ${POSTGRES_PORT}

  until nc -z postgres 5432; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
  done
  echo "PostgreSQL started"
fi

if [ "${SERVICE}" == "web" ]; then
  echo "migrate database"
  python manage.py migrate
  echo "migration done"
  
  echo "run web server"
  gunicorn -c gunicorn.conf.py mysite.wsgi
fi

if [ "${SERVICE}" == "worker" ]; then
  celery -A mysite worker --loglevel=error
fi

if [ "${SERVICE}" == "beat" ]; then
  celery -A mysite beat --schedule=./celery_schedule/celerybeat=schedule --loglevel=error
fi

exec "$@"
