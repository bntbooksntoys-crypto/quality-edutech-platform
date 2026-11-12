-- ============================================================
-- Quality EduTech Platform — Supabase (PostgreSQL) schema
-- Matched to the site's actual data:
--   qe_users  -> students
--   qe_qz     -> quiz_results
--   logins    -> login_events
--   lab usage -> lab_activity
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste -> Run
-- ============================================================

-- 1. STUDENTS — mirrors your signup form exactly
--    (name, email, sha256 password hash, grade, age)
CREATE TABLE students (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,          -- sha256 hex, same as your site
    grade         TEXT,                   -- e.g. 'Grade 8'
    age           INT,
    role          TEXT DEFAULT 'student', -- matches export-students.js
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. LOGIN EVENTS — who is using the platform, and when
CREATE TABLE login_events (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id  BIGINT REFERENCES students(id) ON DELETE CASCADE,
    email       TEXT,
    logged_in_at TIMESTAMPTZ DEFAULT now(),
    user_agent  TEXT                      -- browser/device info
);

-- 3. QUIZ RESULTS — mirrors your qe_qz object
CREATE TABLE quiz_results (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id  BIGINT REFERENCES students(id) ON DELETE CASCADE,
    grade       TEXT,                     -- quiz grade level
    subject     TEXT,                     -- e.g. 'Science'
    answers     JSONB,                    -- the answers object as-is
    score       INT,
    total       INT,
    completed_at TIMESTAMPTZ DEFAULT now()
);

-- 4. LAB ACTIVITY — chemistry / biology / physics lab usage
CREATE TABLE lab_activity (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id  BIGINT REFERENCES students(id) ON DELETE CASCADE,
    lab         TEXT NOT NULL,            -- 'chemistry' | 'biology' | 'physics'
    opened_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Your site is a static page using the public (anon) key, so
-- we allow the anon role to insert and read. This is the
-- simplest setup to get you collecting data today.
-- ============================================================
ALTER TABLE students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_insert_students ON students     FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_select_students ON students     FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_logins   ON login_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_insert_quiz     ON quiz_results FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_select_quiz     ON quiz_results FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_lab      ON lab_activity FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- ANALYTICS QUERIES — "who is using the platform?"
-- Run these any time in the SQL Editor.
-- ============================================================

-- All registered students, newest first
-- SELECT id, name, email, grade, age, created_at FROM students ORDER BY created_at DESC;

-- Students active in the last 7 days
-- SELECT DISTINCT s.name, s.email, s.grade
-- FROM students s JOIN login_events le ON le.student_id = s.id
-- WHERE le.logged_in_at >= now() - interval '7 days';

-- Daily active users, last 30 days
-- SELECT date(logged_in_at) AS day, count(DISTINCT student_id) AS active_users
-- FROM login_events
-- WHERE logged_in_at >= now() - interval '30 days'
-- GROUP BY 1 ORDER BY 1 DESC;

-- Quiz performance by subject
-- SELECT subject, count(*) AS attempts, round(avg(score::numeric / nullif(total,0) * 100),1) AS avg_pct
-- FROM quiz_results GROUP BY subject ORDER BY attempts DESC;

-- Most used labs
-- SELECT lab, count(*) AS opens, count(DISTINCT student_id) AS unique_students
-- FROM lab_activity GROUP BY lab ORDER BY opens DESC;