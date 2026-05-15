-- Migration 005: Add invoice_number to credit_transactions
-- Run this if upgrading from an existing installation

ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS invoice_number TEXT DEFAULT '';
