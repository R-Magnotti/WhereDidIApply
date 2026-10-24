-- table app: company, applied_date, interviewed_date, job_status, URL, match_percentage, reached_out_date, notes 

CREATE TABLE IF NOT EXISTS jobapps (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company TEXT,
    applied_date DATE,
    interviewed_date DATE,
    job_status  TEXT CHECK (job_status IN ('PENDING', 'INTERVIEW', 'OFFER', 'REJECTED', 'SAVED')),
    job_url TEXT,
    interest TEXT CHECK (interest IN ('Rep Farm', 'Safety', 'Priority')),
    match_percentage FLOAT CHECK (match_percentage BETWEEN 0 AND 100),
    reached_out_date DATE,
    notes TEXT,
    role TEXT,
    lane TEXT CHECK (lane in ('DE', 'SWE', 'AI', 'DS', 'DA', 'SE/FDE')),
    salary DECIMAL, -- salary requested
    min_salary DECIMAL,
    max_salary DECIMAL,
    req_num TEXT,
    -- one date per status, in pipeline order. applied_date is the PENDING date
    -- and interviewed_date is the INTERVIEW date; these two complete the set.
    offer_date DATE,
    rejected_date DATE,
    resume_ver FLOAT CHECK (resume_ver BETWEEN 0 AND 100) -- which version of the resume went out
);

-- one row per interview round. jobapps.interviewed_date is left alone and still
-- holds the first round, because the status trail reads its dates out of jobapps.
-- cascade so deleting a job takes its rounds with it.
CREATE TABLE IF NOT EXISTS interviews (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_id INT NOT NULL REFERENCES jobapps(id) ON DELETE CASCADE,
    round_date DATE,
    round_type TEXT, -- phone screen, technical, onsite, whatever it was
    outcome TEXT CHECK (outcome IN ('PASSED', 'REJECTED', 'WAITING')),
    notes TEXT
);
