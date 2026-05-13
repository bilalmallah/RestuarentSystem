# 🍽 RestaurantOS v2.0 — Full Stack with PostgreSQL

Complete restaurant management: **Commission tracking + Kitchen closing checklist + PDF generation**

---

## 🗄 Where Data is Stored

All data is stored in **PostgreSQL** — a professional database.

| What | Where |
|------|-------|
| Database server | Your local PostgreSQL installation |
| Database name | `RestaurantOS` (auto-created) |
| Tables | Auto-created by migrations |
| PDFs | `backend/pdfs/` folder |
| View data visually | pgAdmin → Database: `RestaurantOS` |

---

## 🚀 Quick Setup (Step by Step)

### Step 1 — Install PostgreSQL

**Windows:** Download from https://www.postgresql.org/download/windows/
- During install, set a password for `postgres` user (remember this!)
- pgAdmin is included automatically

**Mac:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Linux:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

### Step 2 — Configure Database Password

Edit `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=RestaurantOS
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
```

---

### Step 3 — Run Migrations (Creates DB + Tables)

```bash
cd backend
npm install
node migrate.js
```

This will:
- ✅ Create `RestaurantOS` database automatically
- ✅ Create all tables (users, employees, commissions, kitchen_items, etc.)
- ✅ Seed default login accounts: **owner/1234** and **manager/1234**
- ✅ Add 28 sample kitchen items (chicken, mirch, oil, etc.)

---

### Step 4 — Start the Backend

```bash
cd backend
node server.js
```

Running on: **http://localhost:3001**

---

### Step 5 — Start the Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm start
```

Opens at: **http://localhost:3000**

---

## 🖥 Viewing Data in pgAdmin

1. Open pgAdmin (installed with PostgreSQL)
2. Connect to server: `localhost` port `5432` with your password
3. Navigate: **Servers → PostgreSQL → Databases → RestaurantOS → Schemas → public → Tables**
4. Right-click any table → **View/Edit Data → All Rows**

Tables you'll see:
- `users` — Login accounts
- `employees` — Staff list
- `daily_sales` — Daily revenue
- `commissions` — Employee daily earnings
- `fixed_payouts` — Owner/manager withdrawals
- `expenses` — Daily costs
- `kitchen_items` — Your ingredient master list
- `closing_checklists` — Nightly closing records
- `checklist_entries` — Per-item check results
- `reorder_lists` — Auto-generated shopping lists
- `_migrations` — Tracks which migrations ran

---

## 🥬 Kitchen Closing Checklist — How to Use

### 1. Setup Kitchen Items
Go to **Kitchen Items** → Add all your ingredients:
- Chicken (kg), Hari Mirch (kg), Laal Mirch (kg), Cooking Oil (litre), etc.
- Set categories and minimum quantities

### 2. At Closing Time
Go to **Closing Checklist** → Click **"Start Tonight's Checklist"**

The system loads ALL your kitchen items. For each one:
- Click **✅ Available** — item is fine
- Click **⚠️ Low Stock** — available but running low (enter how much you have and how much to order)
- Click **❌ Not Available** — completely out (enter how much to order)

### 3. Complete & Generate PDF
Click **"Complete & Generate PDF"** — the system:
- Saves everything to PostgreSQL
- Generates a **Closing Checklist PDF** (full item list with status)
- Generates a **Shopping/Reorder List PDF** (only items that need purchasing)

### 4. Download & Print
Go to **Reorder / Shopping** page → Download the PDF → Print and take to market!

---

## 📁 Project Structure

```
RestaurantOS/
├── backend/
│   ├── server.js              # Express server
│   ├── db.js                  # PostgreSQL connection
│   ├── migrate.js             # Migration runner
│   ├── .env                   # Database config (EDIT THIS)
│   ├── migrations/
│   │   ├── 001_users_employees.sql
│   │   ├── 002_sales_commissions.sql
│   │   └── 003_kitchen_inventory.sql
│   ├── routes/
│   │   ├── auth.js
│   │   ├── employees.js
│   │   ├── finance.js         # Sales, commissions, payouts, expenses
│   │   └── kitchen.js         # Kitchen items, checklists, PDF generation
│   ├── middleware/
│   │   └── auth.js
│   └── pdfs/                  # Generated PDFs (auto-created)
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── DashboardPage.jsx
        │   ├── CommissionsPage.jsx     # Daily commissions & payouts
        │   ├── HistoryPage.jsx         # Commission history
        │   ├── EmployeesPage.jsx
        │   ├── ExpensesPage.jsx
        │   ├── ReportsPage.jsx         # Monthly reports
        │   ├── KitchenItemsPage.jsx    # ⭐ Manage kitchen ingredients
        │   ├── ClosingChecklistPage.jsx # ⭐ Nightly closing check
        │   └── ReorderListsPage.jsx    # ⭐ Shopping lists + PDF download
        └── components/
            └── UI.jsx                  # Shared components
```

---

## 🔑 Default Logins

| Role    | Username  | Password |
|---------|-----------|----------|
| Owner   | `owner`   | `1234`   |
| Manager | `manager` | `1234`   |

---

## 🖨 Windows Quick Start

Double-click **START-WINDOWS.bat** — runs migrations, backend, and frontend automatically.

## 🖥 Mac/Linux Quick Start

```bash
chmod +x START-MAC-LINUX.sh
./START-MAC-LINUX.sh
```
