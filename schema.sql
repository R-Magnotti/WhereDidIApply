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
    rejected_date DATE
);