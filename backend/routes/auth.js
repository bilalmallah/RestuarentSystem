const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const { rows } = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, username: user.username },
      process.env.JWT_SECRET || "RestaurantOS_secret",
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
