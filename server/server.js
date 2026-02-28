const express = require("express");
const initSqlJs = require("sql.js");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, "database.db");
const JWT_SECRET = process.env.JWT_SECRET || "crud-app-secret-key-2026";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["https://mulltiverse.com", "http://localhost:5173"];

app.use(cors({
  origin: "*",
  credentials: false
}));
app.use(express.json());

let db;
let saveTimer = null;

function saveDb() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }, 2000);
}

function saveDbNow() {
  if (saveTimer) clearTimeout(saveTimer);
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

process.on("exit", saveDbNow);
process.on("SIGINT", () => { saveDbNow(); process.exit(); });
process.on("SIGTERM", () => { saveDbNow(); process.exit(); });

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
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

function logActivity(username, action, detail = "") {
  setImmediate(() => {
    try {
      db.run("INSERT INTO activity_log (admin_username, action, detail) VALUES (?, ?, ?)", [username, action, detail]);
      saveDb();
    } catch {}
  });
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nim TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS nilai (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pertemuan INTEGER NOT NULL CHECK(pertemuan >= 1 AND pertemuan <= 16),
    nilai REAL NOT NULL,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, pertemuan)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Migration: tambah kolom pertemuan kalau belum ada (untuk database lama)
  try {
    db.run("ALTER TABLE nilai ADD COLUMN pertemuan INTEGER NOT NULL DEFAULT 1");
  } catch {}

  db.run(`CREATE INDEX IF NOT EXISTS idx_users_nim ON users(nim)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_nama ON users(nama)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_nilai_user_id ON nilai(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_nilai_pertemuan ON nilai(pertemuan)`);

  const existing = queryOne("SELECT * FROM admins WHERE username = ?", ["Fann"]);
  if (!existing) {
    const hash = bcrypt.hashSync("admin", 10);
    db.run("INSERT INTO admins (username, password, role) VALUES (?, ?, ?)", ["Fann", hash, "superadmin"]);
  } else if (existing.role !== "superadmin") {
    db.run("UPDATE admins SET role = ? WHERE username = ?", ["superadmin", "Fann"]);
  }

  saveDbNow();
}

// ==================== AUTH ====================

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username dan password wajib diisi" });

  const admin = queryOne("SELECT * FROM admins WHERE username = ?", [username.trim()]);
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
  const admin = queryOne("SELECT id, username, role, created_at FROM admins WHERE id = ?", [req.adminId]);
  if (!admin) return res.status(404).json({ error: "Admin tidak ditemukan" });
  res.json(admin);
});

// ==================== ADMIN MANAGEMENT ====================

app.get("/api/admins", authMiddleware, superAdminOnly, (req, res) => {
  res.json(queryAll("SELECT id, username, role, created_at FROM admins ORDER BY id ASC"));
});

app.post("/api/admins", authMiddleware, superAdminOnly, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username dan password wajib diisi" });
  if (password.length < 6) return res.status(400).json({ error: "Password minimal 6 karakter" });

  try {
    const hash = bcrypt.hashSync(password.trim(), 10);
    db.run("INSERT INTO admins (username, password, role) VALUES (?, ?, ?)", [username.trim(), hash, "admin"]);
    saveDb();
    const lastId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    const admin = queryOne("SELECT id, username, role, created_at FROM admins WHERE id = ?", [lastId]);
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

  const target = queryOne("SELECT * FROM admins WHERE id = ?", [Number(req.params.id)]);
  if (!target) return res.status(404).json({ error: "Admin tidak ditemukan" });

  const hash = bcrypt.hashSync(password.trim(), 10);
  db.run("UPDATE admins SET password = ? WHERE id = ?", [hash, Number(req.params.id)]);
  saveDb();
  res.json({ message: "Password berhasil direset" });
  logActivity(req.adminUsername, "RESET_PW", `Reset password admin: ${target.username}`);
});

app.delete("/api/admins/:id", authMiddleware, superAdminOnly, (req, res) => {
  const target = queryOne("SELECT * FROM admins WHERE id = ?", [Number(req.params.id)]);
  if (!target) return res.status(404).json({ error: "Admin tidak ditemukan" });
  if (target.role === "superadmin") return res.status(403).json({ error: "Super admin tidak bisa dihapus" });

  db.run("DELETE FROM admins WHERE id = ?", [Number(req.params.id)]);
  saveDb();
  res.json({ message: "Admin berhasil dihapus" });
  logActivity(req.adminUsername, "DELETE_ADMIN", `Menghapus admin: ${target.username}`);
});

// ==================== DASHBOARD ====================

app.get("/api/dashboard/stats", authMiddleware, (req, res) => {
  const stats = queryOne(`
    SELECT
      (SELECT COUNT(*) FROM users) as totalUsers,
      (SELECT COUNT(*) FROM admins) as totalAdmins,
      (SELECT COUNT(*) FROM nilai) as totalNilai,
      (SELECT COUNT(*) FROM users WHERE date(created_at) = date('now')) as todayUsers,
      (SELECT AVG(nilai) FROM nilai) as avgNilai
  `);

  const recentActivity = queryAll("SELECT * FROM activity_log ORDER BY id DESC LIMIT 10");
  const chartData = queryAll(`
    SELECT date(created_at) as date, COUNT(*) as count 
    FROM users WHERE created_at >= date('now', '-7 days')
    GROUP BY date(created_at) ORDER BY date ASC
  `);

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
    res.json(queryAll("SELECT * FROM users WHERE nim LIKE ? OR nama LIKE ? ORDER BY id DESC", [`%${search}%`, `%${search}%`]));
  } else {
    res.json(queryAll("SELECT * FROM users ORDER BY id DESC"));
  }
});

app.get("/api/users/:id", authMiddleware, (req, res) => {
  const user = queryOne("SELECT * FROM users WHERE id = ?", [Number(req.params.id)]);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  res.json(user);
});

app.post("/api/users", authMiddleware, (req, res) => {
  const { nim, nama } = req.body;
  if (!nim || !nama) return res.status(400).json({ error: "NIM dan Nama wajib diisi" });
  try {
    db.run("INSERT INTO users (nim, nama) VALUES (?, ?)", [nim.trim(), nama.trim()]);
    saveDb();
    const lastId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    const user = queryOne("SELECT * FROM users WHERE id = ?", [lastId]);
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
    const existing = queryOne("SELECT * FROM users WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "User tidak ditemukan" });
    db.run("UPDATE users SET nim = ?, nama = ? WHERE id = ?", [nim.trim(), nama.trim(), Number(req.params.id)]);
    saveDb();
    const user = queryOne("SELECT * FROM users WHERE id = ?", [Number(req.params.id)]);
    res.json(user);
    logActivity(req.adminUsername, "UPDATE", `Mengupdate user: ${nama.trim()} (${nim.trim()})`);
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "NIM sudah terdaftar" });
    res.status(500).json({ error: "Gagal mengupdate user" });
  }
});

app.delete("/api/users/:id", authMiddleware, (req, res) => {
  const existing = queryOne("SELECT * FROM users WHERE id = ?", [Number(req.params.id)]);
  if (!existing) return res.status(404).json({ error: "User tidak ditemukan" });
  db.run("DELETE FROM nilai WHERE user_id = ?", [Number(req.params.id)]);
  db.run("DELETE FROM users WHERE id = ?", [Number(req.params.id)]);
  saveDb();
  res.json({ message: "User berhasil dihapus" });
  logActivity(req.adminUsername, "DELETE", `Menghapus user: ${existing.nama} (${existing.nim})`);
});

// ==================== NILAI CRUD ====================

app.get("/api/nilai", authMiddleware, (req, res) => {
  const search = req.query.search || "";
  const pertemuan = req.query.pertemuan || "";

  let sql = `
    SELECT n.id, n.user_id, u.nim, u.nama, n.pertemuan, n.nilai, n.notes, n.created_at
    FROM nilai n JOIN users u ON n.user_id = u.id
    WHERE 1=1
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

  res.json(queryAll(sql, params));
});

app.get("/api/nilai/:id", authMiddleware, (req, res) => {
  const nilai = queryOne(`
    SELECT n.id, n.user_id, u.nim, u.nama, n.pertemuan, n.nilai, n.notes, n.created_at
    FROM nilai n JOIN users u ON n.user_id = u.id WHERE n.id = ?
  `, [Number(req.params.id)]);
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

  if (isNaN(numVal) || numVal < 0 || numVal > 100) {
    return res.status(400).json({ error: "Nilai harus antara 0-100" });
  }
  if (isNaN(numPertemuan) || numPertemuan < 1 || numPertemuan > 16) {
    return res.status(400).json({ error: "Pertemuan harus antara 1-16" });
  }

  const user = queryOne("SELECT * FROM users WHERE id = ?", [Number(user_id)]);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

  try {
    db.run("INSERT INTO nilai (user_id, pertemuan, nilai, notes) VALUES (?, ?, ?, ?)",
      [Number(user_id), numPertemuan, numVal, (notes || "").trim()]);
    saveDb();
    const lastId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    const result = queryOne(`
      SELECT n.id, n.user_id, u.nim, u.nama, n.pertemuan, n.nilai, n.notes, n.created_at
      FROM nilai n JOIN users u ON n.user_id = u.id WHERE n.id = ?
    `, [lastId]);
    res.status(201).json(result);
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

  if (isNaN(numVal) || numVal < 0 || numVal > 100) {
    return res.status(400).json({ error: "Nilai harus antara 0-100" });
  }
  if (isNaN(numPertemuan) || numPertemuan < 1 || numPertemuan > 16) {
    return res.status(400).json({ error: "Pertemuan harus antara 1-16" });
  }

  const existing = queryOne("SELECT * FROM nilai WHERE id = ?", [Number(req.params.id)]);
  if (!existing) return res.status(404).json({ error: "Nilai tidak ditemukan" });

  const user = queryOne("SELECT * FROM users WHERE id = ?", [Number(user_id)]);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

  try {
    db.run("UPDATE nilai SET user_id = ?, pertemuan = ?, nilai = ?, notes = ? WHERE id = ?",
      [Number(user_id), numPertemuan, numVal, (notes || "").trim(), Number(req.params.id)]);
    saveDb();
    const result = queryOne(`
      SELECT n.id, n.user_id, u.nim, u.nama, n.pertemuan, n.nilai, n.notes, n.created_at
      FROM nilai n JOIN users u ON n.user_id = u.id WHERE n.id = ?
    `, [Number(req.params.id)]);
    res.json(result);
    logActivity(req.adminUsername, "UPDATE_NILAI", `Update nilai pertemuan ${numPertemuan} untuk ${user.nama}: ${numVal}`);
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(400).json({ error: `Nilai pertemuan ${numPertemuan} untuk user ini sudah ada` });
    res.status(500).json({ error: "Gagal mengupdate nilai" });
  }
});

app.delete("/api/nilai/:id", authMiddleware, (req, res) => {
  const existing = queryOne(`
    SELECT n.*, u.nama, u.nim FROM nilai n JOIN users u ON n.user_id = u.id WHERE n.id = ?
  `, [Number(req.params.id)]);
  if (!existing) return res.status(404).json({ error: "Nilai tidak ditemukan" });

  db.run("DELETE FROM nilai WHERE id = ?", [Number(req.params.id)]);
  saveDb();
  res.json({ message: "Nilai berhasil dihapus" });
  logActivity(req.adminUsername, "DELETE_NILAI", `Hapus nilai pertemuan ${existing.pertemuan} dari ${existing.nama}`);
});

// ==================== START ====================
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 API Server berjalan di http://localhost:${PORT}`);
    console.log(`👑 Super Admin: Fann / admin\n`);
  });
});