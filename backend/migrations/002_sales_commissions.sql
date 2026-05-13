-- Migration 002: Sales, Commissions, Payouts, Expenses
-- Run order: 2

CREATE TABLE IF NOT EXISTS daily_sales (
  id         SERIAL PRIMARY KEY,
  date       DATE UNIQUE NOT NULL,
  total_sale INTEGER NOT NULL DEFAULT 0,
  note       TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commissions (
  id            SERIAL PRIMARY KEY,
  date          DATE NOT NULL,
  employee_id   INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  amount        INTEGER NOT NULL DEFAULT 0,
  note          TEXT DEFAULT '',
  recorded_by   TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, employee_id)
);

CREATE TABLE IF NOT EXISTS fixed_payouts (
  id             SERIAL PRIMARY KEY,
  date           DATE NOT NULL,
  recipient      TEXT NOT NULL,
  recipient_type TEXT NOT NULL DEFAULT 'other',
  amount         INTEGER NOT NULL DEFAULT 0,
  note           TEXT DEFAULT '',
  recorded_by    TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  category    TEXT DEFAULT 'Other',
  description TEXT NOT NULL,
  amount      INTEGER NOT NULL DEFAULT 0,
  paid_by     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
