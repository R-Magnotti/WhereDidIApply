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
    const job_url = data.job_url;
    const applied_date = data.applied_date;
    const job_status = data.job_status;
    const match_percentage = data.match_percentage;
    const notes = data.notes;
  
    const result = await pool.query(
      'INSERT INTO jobapps (company, job_url, applied_date, job_status, match_percentage, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [company, job_url, applied_date, job_status, match_percentage, notes]
    );
  
    res.status(201).json(result.rows[0]);
  });

///////// GET /////////  
// List all tickets, newest first.
app.get('/appwebaddress', async (req, res) => {
    const result = await pool.query('SELECT * FROM jobapps ORDER BY id DESC');
    res.json(result.rows);
  });

///////// DELETE /////////  
async function deleteEntry(entryId) {
// define the parameterized DELETE query
const text = 'DELETE FROM users WHERE id = $1 RETURNING *';
const values = [entryId];

try {
    // execute the query
    const res = await pool.query(text, values);
    
    if (res.rowCount === 0) {
    console.log('No entry found with that ID.');
    } else {
    console.log('Successfully deleted:', res.rows[0]); // Returns the deleted row data
    }
} catch (err) {
    console.error('Error executing query:', err.stack);
} finally {
    // close the pool connection when done
    await pool.end();
}
}

// --- Start the server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

