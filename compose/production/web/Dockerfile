FROM python:3.11.14

ENV DEBIAN_FRONTEND noninteractive
ENV WKHTML2PDF_VERSION 0.12.4

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openssl \
        netcat-openbsd \
        gettext \
        fontconfig \
        fonts-dejavu \
        fonts-liberation \
        fonts-noto \
        fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

RUN wget "https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/${WKHTML2PDF_VERSION}/wkhtmltox-${WKHTML2PDF_VERSION}_linux-generic-amd64.tar.xz" -O - | tar -xJf - && \
    mv wkhtmltox/bin/wkhtmltopdf /usr/local/bin/wkhtmltopdf && \
    rm -rf wkhtmltox wkhtmltox-${WKHTML2PDF_VERSION}_linux-generic-amd64.tar.xz

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

ENV TZ=Asia/Kolkata
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone


########for sqlserver  on Ubuntu22 odbc driver 18 
#RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -

#RUN curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list > /etc/apt/sources.list.d/mssql-release.list


#RUN apt-get update && ACCEPT_EULA=Y apt-get install -y msodbcsql18





#RUN  mkdir /app
WORKDIR /app

COPY . /app
COPY ./zkeco_dlls/*.so /lib/
COPY ./compose/production/web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENV LD_LIBRARY_PATH=/app/zkeco_dlls:$LD_LIBRARY_PATH
ENV PIPENV_VENV_IN_PROJECT 1
RUN  pip install --upgrade pip

#RUN pip3 install pipenv
#--ignore-pipfile
#RUN set -ex && pipenv install --system --ignore-pipfile
RUN pip install -i https://pypi.org/simple -r requirements.txt

COPY ./compose/oracle_patch/ /usr/local/lib/python3.11/site-packages/django/db/backends/oracle/


ENTRYPOINT ["/entrypoint.sh"]