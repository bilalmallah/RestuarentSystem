require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api",           require("./routes/finance"));
app.use("/api/kitchen",   require("./routes/kitchen"));
app.use("/api/credit",    require("./routes/credit"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 RestaurantOS Backend running on http://localhost:${PORT}`);
  console.log(`   Login: owner/1234 or manager/1234`);
  console.log(`   Tip: Run 'node migrate.js' first if this is a fresh setup\n`);
});
