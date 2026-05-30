ALTER TABLE t_p48437139_create_project_4.users
  ADD COLUMN ref_code VARCHAR(12) UNIQUE,
  ADD COLUMN referred_by INTEGER REFERENCES t_p48437139_create_project_4.users(id);

UPDATE t_p48437139_create_project_4.users
SET ref_code = UPPER(SUBSTRING(MD5(id::text || email), 1, 8))
WHERE ref_code IS NULL;

CREATE TABLE t_p48437139_create_project_4.referral_bonuses (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES t_p48437139_create_project_4.users(id),
  referee_id INTEGER NOT NULL REFERENCES t_p48437139_create_project_4.users(id),
  amount NUMERIC(10,2) NOT NULL,
  source_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);