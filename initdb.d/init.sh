set -e

dbname=chatpost

psql -c "CREATE DATABASE ${dbname};"
psql -d ${dbname} -f /docker-entrypoint-initdb.d/${dbname}.ddl
psql -d ${dbname} -f /docker-entrypoint-initdb.d/${dbname}.dml
