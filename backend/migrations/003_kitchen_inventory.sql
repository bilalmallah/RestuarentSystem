-- Migration 003: Kitchen Inventory & Closing Checklists
-- Run order: 3

-- Master list of all kitchen items
CREATE TABLE IF NOT EXISTS kitchen_items (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT DEFAULT 'General',
  unit         TEXT DEFAULT 'kg',
  min_quantity NUMERIC(10,2) DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Each closing checklist session
CREATE TABLE IF NOT EXISTS closing_checklists (
  id           SERIAL PRIMARY KEY,
  date         DATE NOT NULL,
  checked_by   TEXT NOT NULL,
  status       TEXT DEFAULT 'draft',  -- draft | completed
  notes        TEXT DEFAULT '',
  pdf_path     TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Each item checked during a closing session
CREATE TABLE IF NOT EXISTS checklist_entries (
  id              SERIAL PRIMARY KEY,
  checklist_id    INTEGER NOT NULL REFERENCES closing_checklists(id) ON DELETE CASCADE,
  kitchen_item_id INTEGER REFERENCES kitchen_items(id) ON DELETE SET NULL,
  item_name       TEXT NOT NULL,
  unit            TEXT DEFAULT 'kg',
  is_available    BOOLEAN DEFAULT TRUE,
  quantity_found  NUMERIC(10,2),
  needs_reorder   BOOLEAN DEFAULT FALSE,
  reorder_qty     NUMERIC(10,2),
  note            TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Saved shopping/reorder lists generated from checklists
CREATE TABLE IF NOT EXISTS reorder_lists (
  id           SERIAL PRIMARY KEY,
  checklist_id INTEGER REFERENCES closing_checklists(id) ON DELETE SET NULL,
  date         DATE NOT NULL,
  created_by   TEXT DEFAULT '',
  items        JSONB NOT NULL DEFAULT '[]',
  pdf_path     TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
