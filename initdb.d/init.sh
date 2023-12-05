set -e

dbname=chatpost

psql -c "CREATE DATABASE ${dbname};"
psql -d ${dbname} -f /docker-entrypoint-initdb.d/ddl
psql -d ${dbname} -f /docker-entrypoint-initdb.d/dml
