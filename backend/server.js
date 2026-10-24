// server.js
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// --- Database connection ---
// A Pool manages a set of reusable connections to Postgres.
// host is "db", the name of the database service we'll define in docker-compose next.
const pool = new Pool({
    host: 'localhost',   // not 'db' — Node is on your machine, not in a container
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME || 'jobtracker',
});

// --- App setup ---
const app = express();
app.use(express.json()); // parse incoming JSON bodies into req.body
app.use(express.static(path.join(__dirname, 'public')));

///////// POST /////////  
// --- Routes ---
app.post('/appwebaddress', async (req, res) => {
    // get body of HTML message
    const { body } = req.body;
  
    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

    data = body
    // now get actual variables contained in message, parity with frontend js
    const company = data.company;
    const role = data.role;
    const req_num = data.req_num;
    const job_url = data.job_url;
    const interviewed_date = data.interviewed_date;
    const reached_out_date = data.reached_out_date;
    const applied_date = data.applied_date;
    const job_status = data.job_status;
    const interest = data.interest;
    const lane = data.lane;
    const match_percentage = data.match_percentage;
    const notes = data.notes;
    const salary = data.salary;
    const min_salary = data.min_salary;
    const max_salary = data.max_salary;
    const offer_date = data.offer_date;
    const rejected_date = data.rejected_date;
    const resume_ver = data.resume_ver;

    // column list is kept in the same order as the params array so values land in the right columns
    const result = await pool.query(
      'INSERT INTO jobapps (company, job_url, applied_date, interviewed_date, reached_out_date, job_status, interest, match_percentage, notes, role, req_num, lane, salary, min_salary, max_salary, offer_date, rejected_date, resume_ver) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *',
      [company, job_url, applied_date, interviewed_date, reached_out_date, job_status, interest, match_percentage, notes, role, req_num, lane, salary, min_salary, max_salary, offer_date, rejected_date, resume_ver]
    );
  
    res.status(201).json(result.rows[0]);
  });

///////// PUT (update not add) /////////  
// --- Routes ---
app.put('/appwebaddress', async (req, res) => {
    // get body of HTML message
    const { body } = req.body;
  
    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

   const data = body;
    // now get actual variables contained in message, parity with frontend js
    const id = data.job_id;
    const company = data.company;
    const role = data.role;
    const req_num = data.req_num;
    const job_url = data.job_url;
    const interviewed_date = data.interviewed_date;
    const reached_out_date = data.reached_out_date;
    const applied_date = data.applied_date;
    const job_status = data.job_status;
    const interest = data.interest;
    const lane = data.lane;
    const match_percentage = data.match_percentage;
    const notes = data.notes;
    const salary = data.salary;
    const min_salary = data.min_salary;
    const max_salary = data.max_salary;
    const offer_date = data.offer_date;
    const rejected_date = data.rejected_date;
    const resume_ver = data.resume_ver;

    const result = await pool.query(
        'UPDATE jobapps SET company=$1, job_url=$2, applied_date=$3, interviewed_date=$4, reached_out_date=$5, job_status=$6, interest=$7, match_percentage=$8, notes=$9, role=$10, req_num=$11, lane=$12, salary=$13, min_salary=$14, max_salary=$15, offer_date=$16, rejected_date=$17, resume_ver=$18 WHERE id=$19 RETURNING *',
        [company, job_url, applied_date, interviewed_date, reached_out_date, job_status, interest, match_percentage, notes, role, req_num, lane, salary, min_salary, max_salary, offer_date, rejected_date, resume_ver, id]
    );
    res.status(201).json(result.rows[0]);    //send completed response to browser
  });

///////// GET /////////
// List all tickets, newest first.
app.get('/appwebaddress', async (req, res) => {
  const result = await pool.query(`
    SELECT *,
           CURRENT_DATE - applied_date      AS days_since_applied,
           CURRENT_DATE - reached_out_date  AS days_since_reachout
    FROM jobapps ORDER BY id DESC
  `);
  res.json(result.rows);
});

///////// DELETE /////////
app.delete('/appwebaddress', async (req, res) => {
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

    const data = body;
    const id = data.job_id;
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const result = await pool.query(
        'DELETE FROM jobapps WHERE id=$1 RETURNING *', [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'no job found with that id' });
    }

    res.json(result.rows); // send back confirmation
});

///////// GET /interviews /////////
// every round for one job, oldest first. id breaks ties when two rounds share a date.
app.get('/interviews', async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM interviews WHERE job_id=$1 ORDER BY round_date, id', [req.query.job_id]
    );
    res.json(result.rows);
});

///////// POST /interviews /////////
// add one round to a job. jobapps is untouched, the round lands in its own table.
app.post('/interviews', async (req, res) => {
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

    const data = body;
    const result = await pool.query(
        'INSERT INTO interviews (job_id, round_date, round_type, outcome, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [data.job_id, data.round_date, data.round_type, data.outcome, data.notes]
    );

    res.status(201).json(result.rows[0]);
});

///////// PUT /interviews /////////
// update one round. the browser sends the whole round back, so the same handler
// covers whichever field got changed.
app.put('/interviews', async (req, res) => {
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

    const data = body;
    const result = await pool.query(
        'UPDATE interviews SET round_date=$1, round_type=$2, outcome=$3, notes=$4 WHERE id=$5 RETURNING *',
        [data.round_date, data.round_type, data.outcome, data.notes, data.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'no round found with that id' });
    }

    res.status(201).json(result.rows[0]);
});

///////// DELETE /interviews /////////
// drop one round. deleting the job itself already takes its rounds with it, this is
// for fixing a round added by mistake.
app.delete('/interviews', async (req, res) => {
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

    const result = await pool.query(
        'DELETE FROM interviews WHERE id=$1 RETURNING *', [body.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'no round found with that id' });
    }

    res.json(result.rows);
});

// --- Start the server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

///////// GET /analytics /////////
app.get('/analytics', async (req, res) => {
  // each query returns { rows: [...] }
  const total    = await pool.query('SELECT COUNT(*) AS total FROM jobapps');
  const byStatus = await pool.query(
      'SELECT job_status, COUNT(*) AS count FROM jobapps GROUP BY job_status'
  );
  // apps per job status
  // listed job status, measured number of applications
  const appsPerStatus = await pool.query(`
    SELECT job_status, COUNT(*) AS applications
    FROM jobapps
    GROUP BY job_status
  `);

  //applications per job lane
  // listed job lane, measured by num applications
  const appsPerLane = await pool.query(`
    SELECT lane, COUNT(*) AS applications
    FROM jobapps
    GROUP BY lane
  `);

  // pending apps per lane
  const pendingAppsPerLane = await pool.query(`
    SELECT lane, COUNT(*) AS applications
    FROM jobapps
    WHERE job_status = 'PENDING'
    GROUP BY lane
  `);

  const avgSalaryPerLane = await pool.query(`
    SELECT lane, AVG(salary) AS avg_salaries
    FROM jobapps
    GROUP BY lane
  `);

  // application contribution graph by date (like git contribution graph)
  // want to return rows grouped by application date, with number of applications on that date
  const contributionGraph = await pool.query(`
    SELECT to_char(applied_date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS applications
    FROM jobapps
    GROUP BY applied_date
    ORDER BY applied_date
    `)

  // lane -> outcome, FOR SANKEY
  // anything silent 30+ days is a ghost, not live pipeline. the clock runs from the last
  // time they were in touch: the application date if they never interviewed, otherwise the
  // most recent round. measuring an interview from applied_date would ghost a job you sat
  // an interview for last week just because you applied two months ago.
  // cast as int because node-postgres returns COUNT(*) as a str and the sankey needs a number
  const laneOutcomes = await pool.query(`
    SELECT lane, outcome, COUNT(*)::int AS applications
    FROM (
      SELECT j.lane,
             CASE WHEN j.job_status IN ('OFFER', 'REJECTED') THEN j.job_status
                  WHEN j.job_status = 'PENDING'
                       AND CURRENT_DATE - j.applied_date > 30 THEN 'GHOSTED'
                  WHEN (SELECT i2.outcome FROM interviews i2 WHERE i2.job_id = j.id
                              ORDER BY i2.round_date DESC, i2.id DESC LIMIT 1) = 'REJECTED' THEN 'REJECTED'
                  WHEN j.job_status = 'INTERVIEW'
                       AND CURRENT_DATE - COALESCE(MAX(i.round_date), j.applied_date) > 30 THEN 'GHOSTED'
                  ELSE j.job_status END AS outcome
      FROM jobapps j
      LEFT JOIN interviews i ON i.job_id = j.id
      GROUP BY j.id, j.lane, j.job_status, j.applied_date
    ) t
    GROUP BY 1, 2
  `);

  // a round marked REJECTED ends that job's path there, even while job_status still reads
  // INTERVIEW -- the round outcome is the more specific fact. a job-level OFFER or REJECTED
  // still wins over it, and a rejected round beats the 30-day ghost rule, because knowing
  // you lost is better information than silence. in the lane chart these land in the same
  // REJECTED node as jobs rejected without ever interviewing, which is what they are.
  // interview funnel, FOR SANKEY #2
  // one row per "got this many rounds deep, ended up here". naming the rounds and
  // chaining them together is a display job, so buildFunnel in analytics_view.js does it.
  const interviewFunnel = await pool.query(`
    SELECT rounds, outcome, COUNT(*)::int AS applications
    FROM (
      SELECT COUNT(i.id)::int AS rounds,
             CASE WHEN j.job_status = 'OFFER'    THEN 'Offer'
                  WHEN j.job_status = 'REJECTED' THEN 'Rejected'
                  WHEN j.job_status = 'PENDING'
                       AND CURRENT_DATE - j.applied_date > 30 THEN 'Ghosted'
                  WHEN (SELECT i2.outcome FROM interviews i2 WHERE i2.job_id = j.id
                              ORDER BY i2.round_date DESC, i2.id DESC LIMIT 1) = 'REJECTED' THEN 'Rejected'
                  WHEN j.job_status = 'INTERVIEW'
                       AND CURRENT_DATE - COALESCE(MAX(i.round_date), j.applied_date) > 30 THEN 'Ghosted'
                  WHEN j.job_status = 'PENDING'   THEN 'Waiting'
                  WHEN j.job_status = 'INTERVIEW' THEN 'In progress'
                  ELSE 'Saved' END AS outcome
      FROM jobapps j
      LEFT JOIN interviews i ON i.job_id = j.id
      GROUP BY j.id, j.job_status, j.applied_date
    ) t
    GROUP BY 1, 2
  `);

  // send rows to the browser
  res.json({
    total:                  total.rows[0].total,
    byStatus:               byStatus.rows,
    appsPerStatus:          appsPerStatus.rows, 
    appsPerLane:            appsPerLane.rows, 
    pendingAppsPerLane:     pendingAppsPerLane.rows,
    avgSalaryPerLane:       avgSalaryPerLane.rows,
    contributionGraph:      contributionGraph.rows,
    laneOutcomes:           laneOutcomes.rows,
    interviewFunnel:        interviewFunnel.rows
  });

});
