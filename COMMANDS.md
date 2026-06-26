# Job Tracker — commands

## Run the app (real data)
node server.js
# then open http://localhost:3000

## Run against the dev sandbox instead
DB_NAME=jobtracker_dev node server.js

## Start / stop the database
docker compose up -d
docker compose down        # NEVER use -v on the real data

## Back up my real data
docker exec jobtracker-db pg_dump -U postgres -d jobtracker > backup.sql

## Reset the dev sandbox (safe — does not touch real data)
docker exec -it jobtracker-db psql -U postgres -c "DROP DATABASE jobtracker_dev;"
docker exec -it jobtracker-db psql -U postgres -c "CREATE DATABASE jobtracker_dev;"
docker exec -i jobtracker-db psql -U postgres -d jobtracker_dev < schema.sql