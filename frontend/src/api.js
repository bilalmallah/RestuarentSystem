const BASE = "http://localhost:3001/api";

function getToken() { return localStorage.getItem("rc_token"); }

async function req(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (res.status === 401) { localStorage.removeItem("rc_token"); window.location.reload(); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login: (body) => req("POST", "/auth/login", body),

  // Employees
  getEmployees:    ()       => req("GET",    "/employees"),
  addEmployee:     (body)   => req("POST",   "/employees", body),
  updateEmployee:  (id, b)  => req("PUT",    `/employees/${id}`, b),
  deleteEmployee:  (id)     => req("DELETE", `/employees/${id}`),

  // Sales
  getSales:  (p) => req("GET",  "/sales?" + new URLSearchParams(p)),
  saveSale:  (b) => req("POST", "/sales", b),

  // Commissions
  getCommissions:   (p)  => req("GET",    "/commissions?" + new URLSearchParams(p)),
  saveCommission:   (b)  => req("POST",   "/commissions", b),
  deleteCommission: (id) => req("DELETE", `/commissions/${id}`),

  // Payouts
  getPayouts:   (p)  => req("GET",    "/payouts?" + new URLSearchParams(p)),
  addPayout:    (b)  => req("POST",   "/payouts", b),
  deletePayout: (id) => req("DELETE", `/payouts/${id}`),

  // Expenses
  getExpenses:   (p)  => req("GET",    "/expenses?" + new URLSearchParams(p)),
  addExpense:    (b)  => req("POST",   "/expenses", b),
  deleteExpense: (id) => req("DELETE", `/expenses/${id}`),

  // Summary
  getDailySummary:   (date)  => req("GET", `/summary/daily?date=${date}`),
  getMonthlySummary: (month) => req("GET", `/summary/monthly?month=${month}`),

  // Kitchen Items (master list)
  getKitchenItems:   ()      => req("GET",    "/kitchen/items"),
  addKitchenItem:    (b)     => req("POST",   "/kitchen/items", b),
  updateKitchenItem: (id, b) => req("PUT",    `/kitchen/items/${id}`, b),
  deleteKitchenItem: (id)    => req("DELETE", `/kitchen/items/${id}`),

  // Closing Checklists
  getChecklists:       ()       => req("GET",  "/kitchen/checklists"),
  getChecklist:        (id)     => req("GET",  `/kitchen/checklists/${id}`),
  startChecklist:      (b)      => req("POST", "/kitchen/checklists/start", b),
  updateEntry:         (clId, entryId, b) => req("PUT", `/kitchen/checklists/${clId}/entries/${entryId}`, b),
  completeChecklist:   (id)     => req("POST", `/kitchen/checklists/${id}/complete`, {}),

  // Reorder lists
  getReorderLists: () => req("GET", "/kitchen/reorder-lists"),

  // PDF download URL (direct link)
  pdfUrl: (filename) => `${BASE}/kitchen/pdf/${filename}?token=${getToken()}`,

  // Credit / Debit (Khata)
  getCreditPersons:      ()         => req("GET",    "/credit/persons"),
  addCreditPerson:       (b)        => req("POST",   "/credit/persons", b),
  updateCreditPerson:    (id, b)    => req("PUT",    `/credit/persons/${id}`, b),
  deleteCreditPerson:    (id)       => req("DELETE", `/credit/persons/${id}`),
  getCreditTransactions: (personId) => req("GET",    `/credit/transactions/${personId}`),
  addCreditTransaction:  (b)        => req("POST",   "/credit/transactions", b),
  deleteCreditTransaction:(id)      => req("DELETE", `/credit/transactions/${id}`),
  getCreditSummary:      (personId, month) => req("GET", `/credit/summary/${personId}?month=${month||""}`),
};
