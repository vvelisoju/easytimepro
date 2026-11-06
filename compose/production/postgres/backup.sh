#!/usr/bin/env bash



# we might run into trouble when using the default `postgres` user, e.g. when dropping the postgres
# database in restore.sh. Check that something else is used here
if [ "$POSTGRES_USER" == "postgres" ]
then
    echo "creating a backup as the postgres user is not supported, make sure to set the POSTGRES_USER environment variable"
    exit 1
fi



# export the postgres password so that subsequent commands don't ask for it
export PGPASSWORD=$POSTGRES_PASSWORD
con=$(docker container ls --all | grep postgres | awk '{print $1}')
echo "creating backup"



cd ../../..
if [ -d "backups" ]
then
    cd backups/
    FILENAME=backup_$(date +'%Y_%m_%dT%H_%M_%S').sql.gz
    docker exec -t $con pg_dumpall -c -U my_super_user | gzip > $FILENAME
else
    mkdir backups
    chmod 777 backups/
    cd backups/
    FILENAME=backup_$(date +'%Y_%m_%dT%H_%M_%S').sql.gz
    docker exec -t $con pg_dumpall -c -U my_super_user | gzip > $FILENAME
fi
chmod 777 $FILENAME


echo "successfully created backup $FILENAME"
