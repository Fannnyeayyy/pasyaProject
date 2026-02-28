const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, "database.db");
const JWT_SECRET = process.env.JWT_SECRET || "crud-app-secret-key-2026";

app.use(cors({
  origin: "*",
  credentials: false
}));
app.use(express.json());

// ==================== DATABASE ====================

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nim TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS nilai (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pertemuan INTEGER NOT NULL CHECK(pertemuan >= 1 AND pertemuan <= 16),
    nilai REAL NOT NULL,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, pertemuan)
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_nim ON users(nim);
  CREATE INDEX IF NOT EXISTS idx_users_nama ON users(nama);
  CREATE INDEX IF NOT EXISTS idx_nilai_user_id ON nilai(user_id);
  CREATE INDEX IF NOT EXISTS idx_nilai_pertemuan ON nilai(pertemuan);
`);

// Seed superadmin
const existing = db.prepare("SELECT * FROM admins WHERE username = ?").get("Fann");
if (!existing) {
  const hash = bcrypt.hashSync("admin", 10);
  db.prepare("INSERT INTO admins (username, password, role) VALUES (?, ?, ?)").run("Fann", hash, "superadmin");
} else if (existing.role !== "superadmin") {
  db.prepare("UPDATE admins SET role = ? WHERE username = ?").run("superadmin", "Fann");
}

// ==================== HELPERS ====================

function logActivity(username, action, detail = "") {
  setImmediate(() => {
    try {
      db.prepare("INSERT INTO activity_log (admin_username, action, detail) VALUES (?, ?, ?)").run(username, action, detail);
    } catch {}
  });
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token tidak ditemukan" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    req.adminUsername = decoded.username;
    req.adminRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Token tidak valid" });
  }
}

function superAdminOnly(req, res, next) {
  if (req.adminRole !== "superadmin") {
    return res.status(403).json({ error: "Hanya super admin yang bisa mengakses" });
  }
  next();
}

// ==================== AUTH ====================

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username dan password wajib diisi" });

  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username.trim());
  if (!admin) return res.status(401).json({ error: "Username atau password salah" });

  const valid = bcrypt.compareSync(password, admin.password);
  if (!valid) return res.status(401).json({ error: "Username atau password salah" });

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({ token, admin: { id: admin.id, username: admin.username, role: admin.role } });
  logActivity(admin.username, "LOGIN", "Login berhasil");
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const admin = db.prepare("SELECT id, username, role, created_at FROM admins WHERE id = ?").get(req.adminId);
  if (!admin) return res.status(404).json({ error: "Admin tidak ditemukan" });
  res.json(admin);
});

// ==================== ADMIN MANAGEMENT ====================

app.get("/api/admins", authMiddleware, superAdminOnly, (req, res) => {
  res.json(db.prepare("SELECT id, username, role, created_at FROM admins ORDER BY id ASC").all());
});

app.post("/api/admins", authMiddleware, superAdminOnly, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username dan password wajib diisi" });
  if (password.length < 6) return res.status(400).json({ error: "Password minimal 6 karakter" });

  try {
    const hash = bcrypt.hashSync(password.trim(), 10);
    const result = db.prepare("INSERT INTO admins (username, password, role) VALUES (?, ?, ?)").run(username.trim(), hash, "admin");
    const admin = db.prepare("SELECT id, username, role, created_at FROM admins WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(admin);
    logActivity(req.adminUsername, "CREATE_ADMIN", `Menambahkan admin: ${username.trim()}`);
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Username sudah terdaftar" });
    res.status(500).json({ error: "Gagal menambahkan admin" });
  }
});

app.put("/api/admins/:id", authMiddleware, superAdminOnly, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password wajib diisi" });
  if (password.length < 6) return res.status(400).json({ error: "Password minimal 6 karakter" });

  const target = db.prepare("SELECT * FROM admins WHERE id = ?").get(Number(req.params.id));
  if (!target) return res.status(404).json({ error: "Admin tidak ditemukan" });

  const hash = bcrypt.hashSync(password.trim(), 10);
  db.prepare("UPDATE admins SET password = ? WHERE id = ?").run(hash, Number(req.params.id));
  res.json({ message: "Password berhasil direset" });
  logActivity(req.adminUsername, "RESET_PW", `Reset password admin: ${target.username}`);
});

app.delete("/api/admins/:id", authMiddleware, superAdminOnly, (req, res) => {
  const target = db.prepare("SELECT * FROM admins WHERE id = ?").get(Number(req.params.id));
  if (!target) return res.status(404).json({ error: "Admin tidak ditemukan" });
  if (target.role === "superadmin") return res.status(403).json({ error: "Super admin tidak bisa dihapus" });

  db.prepare("DELETE FROM admins WHERE id = ?").run(Number(req.params.id));
  res.json({ message: "Admin berhasil dihapus" });
  logActivity(req.adminUsername, "DELETE_ADMIN", `Menghapus admin: ${target.username}`);
});

// ==================== DASHBOARD ====================

app.get("/api/dashboard/stats", authMiddleware, (req, res) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users) as totalUsers,
      (SELECT COUNT(*) FROM admins) as totalAdmins,
      (SELECT COUNT(*) FROM nilai) as totalNilai,
      (SELECT COUNT(*) FROM users WHERE date(created_at) = date('now')) as todayUsers,
      (SELECT AVG(nilai) FROM nilai) as avgNilai
  `).get();

  const recentActivity = db.prepare("SELECT * FROM activity_log ORDER BY id DESC LIMIT 10").all();
  const chartData = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count 
    FROM users WHERE created_at >= date('now', '-7 days')
    GROUP BY date(created_at) ORDER BY date ASC
  `).all();

  res.json({
    totalUsers: stats.totalUsers || 0,
    totalAdmins: stats.totalAdmins || 0,
    totalNilai: stats.totalNilai || 0,
    todayUsers: stats.todayUsers || 0,
    avgNilai: stats.avgNilai ? Number(stats.avgNilai).toFixed(1) : "0",
    recentActivity,
    chartData,
  });
});

// ==================== USER CRUD ====================

app.get("/api/users", authMiddleware, (req, res) => {
  const search = req.query.search || "";
  if (search) {
    res.json(db.prepare("SELECT * FROM users WHERE nim LIKE ? OR nama LIKE ? ORDER BY id DESC").all(`%${search}%`, `%${search}%`));
  } else {
    res.json(db.prepare("SELECT * FROM users ORDER BY id DESC").all());
  }
});

app.get("/api/users/:id", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  res.json(user);
});

app.post("/api/users", authMiddleware, (req, res) => {
  const { nim, nama } = req.body;
  if (!nim || !nama) return res.status(400).json({ error: "NIM dan Nama wajib diisi" });
  try {
    const result = db.prepare("INSERT INTO users (nim, nama) VALUES (?, ?)").run(nim.trim(), nama.trim());
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(user);
    logActivity(req.adminUsername, "CREATE", `Menambahkan user: ${nama.trim()} (${nim.trim()})`);
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "NIM sudah terdaftar" });
    res.status(500).json({ error: "Gagal menambahkan user" });
  }
});

app.put("/api/users/:id", authMiddleware, (req, res) => {
  const { nim, nama } = req.body;
  if (!nim || !nama) return res.status(400).json({ error: "NIM dan Nama wajib diisi" });
  try {
    const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(req.params.id));
    if (!existing) return res.status(404).json({ error: "User tidak ditemukan" });
    db.prepare("UPDATE users SET nim = ?, nama = ? WHERE id = ?").run(nim.trim(), nama.trim(), Number(req.params.id));
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(req.params.id));
    res.json(user);
    logActivity(req.adminUsername, "UPDATE", `Mengupdate user: ${nama.trim()} (${nim.trim()})`);
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "NIM sudah terdaftar" });
    res.status(500).json({ error: "Gagal mengupdate user" });
  }
});

app.delete("/api/users/:id", authMiddleware, (req, res) => {
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: "User tidak ditemukan" });
  db.prepare("DELETE FROM nilai WHERE user_id = ?").run(Number(req.params.id));
  db.prepare("DELETE FROM users WHERE id = ?").run(Number(req.params.id));
  res.json({ message: "User berhasil dihapus" });
  logActivity(req.adminUsername, "DELETE", `Menghapus user: ${existing.nama} (${existing.nim})`);
});

// ==================== NILAI CRUD ====================

app.get("/api/nilai", authMiddleware, (req, res) => {
  const search = req.query.search || "";
  const pertemuan = req.query.pertemuan || "";

  let sql = `
    SELECT n.id, n.user_id, u.nim, u.nama, n.pertemuan, n.nilai, n.notes, n.created_at
    FROM nilai n JOIN users u ON n.user_id = u.id WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (u.nim LIKE ? OR u.nama LIKE ? OR n.notes LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (pertemuan) {
    sql += ` AND n.pertemuan = ?`;
    params.push(Number(pertemuan));
  }

  sql += ` ORDER BY n.pertemuan ASC, n.id DESC`;
  res.json(db.prepare(sql).all(...params));
});

app.get("/api/nilai/:id", authMiddleware, (req, res) => {
  const nilai = db.prepare(`
    SELECT n.id, n.user_id, u.nim, u.nama, n.pertemuan, n.nilai, n.notes, n.created_at
    FROM nilai n JOIN users u ON n.user_id = u.id WHERE n.id = ?
  `).get(Number(req.params.id));
  if (!nilai) return res.status(404).json({ error: "Nilai tidak ditemukan" });
  res.json(nilai);
});

app.post("/api/nilai", authMiddleware, (req, res) => {
  const { user_id, pertemuan, nilai, notes } = req.body;

  if (!user_id || !pertemuan || nilai === undefined || nilai === null || nilai === "") {
    return res.status(400).json({ error: "User, Pertemuan, dan Nilai wajib diisi" });
  }

  const numVal = Number(nilai);
  const numPertemuan = Number(pertemuan);

  if (isNaN(numVal) || numVal < 0 || numVal > 100)
    return res.status(400).json({ error: "Nilai harus antara 0-100" });
  if (isNaN(numPertemuan) || numPertemuan < 1 || numPertemuan > 16)
    return res.status(400).json({ error: "Pertemuan harus antara 1-16" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(user_id));
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

  try {
    const result = db.prepare("INSERT INTO nilai (user_id, pertemuan, nilai, notes) VALUES (?, ?, ?, ?)").run(Number(user_id), numPertemuan, numVal, (notes || "").trim());
    const data = db.prepare(`
      SELECT n.id, n.user_id, u.nim, u.nama, n.pertemuan, n.nilai, n.notes, n.created_at
      FROM nilai n JOIN users u ON n.user_id = u.id WHERE n.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(data);
    logActivity(req.adminUsername, "CREATE_NILAI", `Nilai pertemuan ${numPertemuan} untuk ${user.nama}: ${numVal}`);
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ error: `Nilai pertemuan ${numPertemuan} untuk user ini sudah ada` });
    res.status(500).json({ error: "Gagal menambahkan nilai" });
  }
});

app.put("/api/nilai/:id", authMiddleware, (req, res) => {
  const { user_id, pertemuan, nilai, notes } = req.body;

  if (!user_id || !pertemuan || nilai === undefined || nilai === null || nilai === "") {
    return res.status(400).json({ error: "User, Pertemuan, dan Nilai wajib diisi" });
  }

  const numVal = Number(nilai);
  const numPertemuan = Number(pertemuan);

  if (isNaN(numVal) || numVal < 0 || numVal > 100)
    return res.status(400).json({ error: "Nilai harus antara 0-100" });
  if (isNaN(numPertemuan) || numPertemuan < 1 || numPertemuan > 16)
    return res.status(400).json({ error: "Pertemuan harus antara 1-16" });

  const existing = db.prepare("SELECT * FROM nilai WHERE id = ?").get(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: "Nilai tidak ditemukan" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(user_id));
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

  try {
    db.prepare("UPDATE nilai SET user_id = ?, pertemuan = ?, nilai = ?, notes = ? WHERE id = ?").run(Number(user_id), numPertemuan, numVal, (notes || "").trim(), Number(req.params.id));
    const data = db.prepare(`
      SELECT n.id, n.user_id, u.nim, u.nama, n.pertemuan, n.nilai, n.notes, n.created_at
      FROM nilai n JOIN users u ON n.user_id = u.id WHERE n.id = ?
    `).get(Number(req.params.id));
    res.json(data);
    logActivity(req.adminUsername, "UPDATE_NILAI", `Update nilai pertemuan ${numPertemuan} untuk ${user.nama}: ${numVal}`);
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ error: `Nilai pertemuan ${numPertemuan} untuk user ini sudah ada` });
    res.status(500).json({ error: "Gagal mengupdate nilai" });
  }
});

app.delete("/api/nilai/:id", authMiddleware, (req, res) => {
  const existing = db.prepare(`
    SELECT n.*, u.nama, u.nim FROM nilai n JOIN users u ON n.user_id = u.id WHERE n.id = ?
  `).get(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: "Nilai tidak ditemukan" });

  db.prepare("DELETE FROM nilai WHERE id = ?").run(Number(req.params.id));
  res.json({ message: "Nilai berhasil dihapus" });
  logActivity(req.adminUsername, "DELETE_NILAI", `Hapus nilai pertemuan ${existing.pertemuan} dari ${existing.nama}`);
});

// ==================== START ====================
app.listen(PORT, () => {
  console.log(`\n🚀 API Server berjalan di http://localhost:${PORT}`);
  console.log(`👑 Super Admin: Fann / admin\n`);
});