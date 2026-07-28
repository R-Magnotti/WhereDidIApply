// server.js
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

// --- Database connection ---
// A Pool manages a set of reusable connections to Postgres.
// These values match the Postgres container from earlier.
// host is "db", the name of the database service we'll define in docker-compose next.
const pool = new Pool({
    host: 'localhost',   // not 'db' — Node is on your machine, not in a container
    user: 'postgres',
    password: 'devpassword',
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
    const match_percentage = data.match_percentage;
    const notes = data.notes;

    // column list is kept in the same order as the params array so values land in the right columns
    const result = await pool.query(
      'INSERT INTO jobapps (company, job_url, applied_date, interviewed_date, reached_out_date, job_status, interest, match_percentage, notes, role, req_num) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [company, job_url, applied_date, interviewed_date, reached_out_date, job_status, interest, match_percentage, notes, role, req_num]
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
    const match_percentage = data.match_percentage;
    const notes = data.notes;

    const result = await pool.query(
        'UPDATE jobapps SET company=$1, job_url=$2, applied_date=$3, interviewed_date=$4, reached_out_date=$5, job_status=$6, interest=$7, match_percentage=$8, notes=$9, role=$10, req_num=$11 WHERE id=$12 RETURNING *',
        [company, job_url, applied_date, interviewed_date, reached_out_date, job_status, interest, match_percentage, notes, role, req_num, id]
    );
    console.log(`UPDATE ok: id=${id}`, result.rows[0]);
    res.status(201).json(result.rows[0]);    //send completed response to browser
  });

///////// GET /////////
// List all tickets, newest first.
app.get('/appwebaddress', async (req, res) => {
    const result = await pool.query('SELECT * FROM jobapps ORDER BY id DESC');
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

    console.log('Successfully deleted:', result.rows[0]);
    res.json(result.rows); // send back confirmation
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

  // companies with 2+ apps
  const companiesMultipleApps = await pool.query(`
    SELECT company, COUNT(*) AS num_companies
    FROM jobapps
    GROUP BY company
    HAVING COUNT(*) > 1
  `);

  // send rows to the browser
  res.json({
    total:                  total.rows[0].total,
    byStatus:               byStatus.rows,
    appsPerStatus:          appsPerStatus.rows, 
    appsPerLane:            appsPerLane.rows, 
    pendingAppsPerLane:     pendingAppsPerLane.rows,
    avgSalaryPerLane:       avgSalaryPerLane.rows,
    companiesMultipleApps:  companiesMultipleApps.rows
  }); 

});
