-- Migration 004: Credit / Debit (Khata) System
-- Run order: 4

CREATE TABLE IF NOT EXISTS credit_persons (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id          SERIAL PRIMARY KEY,
  person_id   INTEGER NOT NULL REFERENCES credit_persons(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL,   -- positive = credit (they owe us), negative = debit (payment/we owe)
  type        TEXT NOT NULL CHECK (type IN ('credit','debit')),
  description TEXT DEFAULT '',
  txn_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_txn_person ON credit_transactions(person_id);
CREATE INDEX IF NOT EXISTS idx_credit_txn_date   ON credit_transactions(txn_date);
