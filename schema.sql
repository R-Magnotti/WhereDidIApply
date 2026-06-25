-- table app: company, applied_date, interviewed_date, job_status, URL, match_percentage, reached_out_date, notes 

CREATE TABLE IF NOT EXISTS jobapps (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company TEXT,

    -- ~ = check this following regex
    applied_date DATE,
    interviewed_date DATE,
    job_status  TEXT CHECK (job_status IN ('PENDING', 'INTERVIEW', 'OFFER', 'REJECTED', 'SAVED')),
    job_url TEXT,
    match_percentage FLOAT CHECK (match_percentage BETWEEN 0 AND 100),
    reached_out_date DATE,
    notes TEXT
);