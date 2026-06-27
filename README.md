# Software Job Hunt Tracker

A PostgreSQL-backed web app for tracking software job applications: log each role, record its status and match, track outreach, and persist everything to a relational database.

Searching for jobs can be stressful, and I wanted to make the clerical side of it simple. Once you apply to something, it's easy to forget the details without going back and searching for them on a per-application basis. I wanted all of it in one place: easy logging, easy tracking, easy retrieval, and visualizations for insights.

I built this as a single-developer portfolio project, oriented toward data engineering and analytics through relational schema design, a containerized Postgres stack, and an analytics layer on the roadmap.

## Status

- **Database layer:** complete. A Dockerized Postgres 18 container hosts the `jobapps` table, with values guarded by `CHECK` constraints and data persisted across restarts through a named volume.
- **Backend and frontend:** in active development. A Node backend serves a vanilla JS frontend (a submission form, a tile list of logged applications, and a details panel); the form and list panel are being wired together into a single page.

## Tech stack

- **Database:** PostgreSQL 18
- **Containerization:** Docker / Docker Compose
- **Backend:** Node.js
- **Frontend:** Vanilla JavaScript, HTML, CSS

## Database schema

The core `jobapps` table:

```sql
CREATE TABLE IF NOT EXISTS jobapps (
    id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company          TEXT,
    applied_date     DATE,
    interviewed_date DATE,
    job_status       TEXT CHECK (job_status IN ('PENDING', 'INTERVIEW', 'OFFER', 'REJECTED', 'SAVED')),
    job_url          TEXT,
    match_percentage FLOAT CHECK (match_percentage BETWEEN 0 AND 100),
    reached_out_date DATE,
    notes            TEXT
);
```

Design notes:

- Dates use the `DATE` type, so date math, sorting, and "last 7 days" style queries work correctly and an invalid date is rejected at write time.
- `job_status` is restricted to a fixed set with `CHECK (... IN (...))`, which keeps status values clean enough for reliable funnel queries (`GROUP BY job_status`).
- `match_percentage` is bounded to 0 through 100 with a `CHECK` constraint.

## Getting started

### Prerequisites

- Docker Desktop (includes Docker Compose)
- Node.js [version] for the backend

### Run the database

```bash
git clone https://github.com/R-Magnotti/Software-Job-Hunt-Tracking.git
cd Software-Job-Hunt-Tracking

# Start the Postgres container; the schema loads automatically on first boot
docker compose up -d
docker compose ps
```

The schema in `db/schema.sql` runs automatically the first time the container starts against an empty volume. Confirm the table loaded:

```bash
docker exec -it jobtracker-db psql -U postgres -d jobtracker -c "\d jobapps"
```

To apply a schema change, wipe the volume and reboot. This deletes all rows, so only do it before there is real data to keep:

```bash
docker compose down -v
docker compose up -d
```

### Run the backend

```bash
cd backend
npm install
npm start
```

Then open `http://localhost:[port]` in your browser.

## Project structure

```
Software-Job-Hunt-Tracking/
├── docker-compose.yml
├── db/
│   └── schema.sql          # jobapps table, auto-loaded on a fresh volume
├── backend/
│   ├── server.js           # Node backend and static file server
│   ├── package.json
│   └── public/             # vanilla JS frontend
│       ├── index.html
│       └── app.js
├── COMMANDS.md             # Docker and dev command reference
└── README.md
```

## Roadmap

Done:

- [x] Dockerized Postgres 18 database with a persistent named volume
- [x] `jobapps` relational schema with CHECK constraints, auto-loaded on first container boot
- [x] Node backend serving the frontend and connected to Postgres
- [x] JS submission form
- [x] JS tile list that fetches and displays logged applications
- [x] Job details view in the right display panel, showing all details of a logged application

To do:

- [ ] Merge the submission form and the application list into a single page
- [ ] React dashboard to replace the vanilla JS frontend
- [ ] Normalize outreach into its own table (one application, many staged contact touches) linked by a foreign key
- [ ] Python data-processing layer
- [ ] Snowflake analytics warehouse added as an ELT destination in a second phase
- [ ] Metabase dashboards over the warehouse for funnel and conversion analytics

## License

[MIT, or your choice]