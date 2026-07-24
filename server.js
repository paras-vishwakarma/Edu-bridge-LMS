import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ── ESM __dirname shim ────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const [key, ...rest] = line.trim().split('=');
      if (key && !key.startsWith('#')) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    });
}

const PORT      = process.env.PORT || 5000;
const IS_PROD   = process.env.NODE_ENV === 'production';
const IS_VERCEL = !!process.env.VERCEL;
const DIST      = path.join(__dirname, 'dist');

// ── Express setup ─────────────────────────────────────────────────────────────
const app = express();

// CORS: allow Vite dev server in dev; restrict to same-origin in prod
const allowedOrigins = IS_PROD
  ? [`http://localhost:${PORT}`]
  : ['http://localhost:5173', 'http://127.0.0.1:5173', `http://localhost:${PORT}`];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. curl, Postman) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Serve built frontend in production ────────────────────────────────────────
if (IS_PROD && fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  console.log(`[server] Serving static frontend from ${DIST}`);
}

// ── SQLite database — absolute path (use /tmp on Vercel serverless) ─────────
const DB_PATH = IS_VERCEL
  ? '/tmp/database.sqlite'
  : path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[DB] Error opening database:', err.message);
    process.exit(1);
  }
  console.log(`[DB] Connected to SQLite at ${DB_PATH}`);
  setupDatabase();
});

// ── Mock seed data (mirrors src/data/mockData.js) ────────────────────────────
const SEED_USERS = [
  { id: 'admin-1',  name: 'Admin User',        email: 'admin@edubridge.com',    password: 'admin123',       role: 'admin',      avatar: '', bio: 'Platform administrator',                                                         joinedAt: '2024-01-01', status: 'active' },
  { id: 'inst-1',   name: 'Dr. Sarah Chen',     email: 'sarah@edubridge.com',    password: 'instructor123',  role: 'instructor', avatar: '', bio: 'Full-stack developer with 10+ years of experience.',                             joinedAt: '2024-02-15', status: 'active' },
  { id: 'inst-2',   name: 'Prof. James Miller', email: 'james@edubridge.com',    password: 'instructor123',  role: 'instructor', avatar: '', bio: 'Data scientist and AI researcher.',                                              joinedAt: '2024-03-01', status: 'active' },
  { id: 'stu-1',    name: 'Alex Johnson',       email: 'alex@student.com',       password: 'student123',     role: 'student',    avatar: '', bio: 'Computer Science student',                                                       joinedAt: '2024-04-10', status: 'active' },
  { id: 'stu-2',    name: 'Maya Patel',         email: 'maya@student.com',       password: 'student123',     role: 'student',    avatar: '', bio: 'Aspiring web developer',                                                         joinedAt: '2024-05-20', status: 'active' },
  { id: 'stu-3',    name: 'Ryan Kim',           email: 'ryan@student.com',       password: 'student123',     role: 'student',    avatar: '', bio: 'Learning to code',                                                               joinedAt: '2024-06-05', status: 'active' },
  { id: 'stu-4',    name: 'Emma Wilson',        email: 'emma@student.com',       password: 'student123',     role: 'student',    avatar: '', bio: 'UX Designer transitioning to development',                                       joinedAt: '2024-06-15', status: 'active' },
  { id: 'stu-5',    name: 'David Brown',        email: 'david@student.com',      password: 'student123',     role: 'student',    avatar: '', bio: 'Backend developer learning frontend',                                            joinedAt: '2024-07-01', status: 'banned'  },
];

// ── Database setup & seeding ──────────────────────────────────────────────────
function setupDatabase() {
  db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id       TEXT PRIMARY KEY,
      name     TEXT,
      email    TEXT UNIQUE,
      password TEXT,
      role     TEXT,
      avatar   TEXT,
      bio      TEXT,
      joinedAt TEXT,
      status   TEXT
    )`, (err) => {
      if (err) { console.error('[DB] Failed to create users table:', err.message); return; }

      // Seed default users if table is empty
      db.get('SELECT COUNT(*) AS cnt FROM users', (err2, row) => {
        if (err2) return;
        if (row.cnt === 0) {
          const stmt = db.prepare(
            'INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          );
          SEED_USERS.forEach(u => {
            stmt.run([u.id, u.name, u.email, u.password, u.role, u.avatar, u.bio, u.joinedAt, u.status]);
          });
          stmt.finalize(() => {
            console.log(`[DB] Seeded ${SEED_USERS.length} default users.`);
          });
        } else {
          console.log(`[DB] Users table already has ${row.cnt} record(s). Skipping seed.`);
        }
      });
    });
  });
}

// ── Token helper ──────────────────────────────────────────────────────────────
function makeToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86_400_000 })
  ).toString('base64');
  return `lerno.${payload}.sig`;
}

// ── API Routes ────────────────────────────────────────────────────────────────

// POST /api/register
app.post('/api/register', (req, res) => {
  const { name, email, password, role = 'student' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }

  const id       = `user-${Date.now()}`;
  const joinedAt = new Date().toISOString().slice(0, 10);
  const status   = 'active';

  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (err)  return res.status(500).json({ success: false, error: 'Database error.' });
    if (row)  return res.json({ success: false, error: 'An account with this email already exists.' });

    const stmt = db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run([id, name, email, password, role, '', '', joinedAt, status], function (insertErr) {
      if (insertErr) {
        return res.status(500).json({ success: false, error: 'Failed to create user.' });
      }
      const safeUser = { id, name, email, role, avatar: '', bio: '', joinedAt, status };
      res.json({ success: true, token: makeToken(safeUser), user: safeUser });
    });
    stmt.finalize();
  });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, user) => {
    if (err)   return res.status(500).json({ success: false, error: 'Database error.' });
    if (!user) return res.json({ success: false, error: 'Invalid email or password.' });
    if (user.status === 'banned') {
      return res.json({ success: false, error: 'Your account has been suspended. Please contact support.' });
    }

    const { password: _pw, ...safeUser } = user;
    res.json({ success: true, token: makeToken(safeUser), user: safeUser });
  });
});

// GET /api/users  (admin use)
app.get('/api/users', (req, res) => {
  db.all('SELECT id, name, email, role, avatar, bio, joinedAt, status FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'Database error.' });
    res.json(rows);
  });
});

// PATCH /api/users/:id/status  (admin ban/unban)
app.patch('/api/users/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['active', 'banned'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value.' });
  }
  db.run('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err)            return res.status(500).json({ success: false, error: 'Database error.' });
    if (!this.changes)  return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true });
  });
});

// DELETE /api/users/:id  (admin delete)
app.delete('/api/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
    if (err)           return res.status(500).json({ success: false, error: 'Database error.' });
    if (!this.changes) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true });
  });
});

// ── SPA catch-all — must come AFTER all API routes ───────────────────────────
// In production: serve index.html for all non-API routes so React Router works
if (IS_PROD && fs.existsSync(DIST)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST, 'index.html'));
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ── Start (skip in Vercel serverless — it manages the HTTP lifecycle) ────────
const isMain = process.argv[1] === __filename;
if (!IS_VERCEL && isMain) {
  app.listen(PORT, () => {
    console.log(`[server] Backend running on http://localhost:${PORT}`);
    if (IS_PROD) console.log(`[server] Mode: PRODUCTION — serving frontend from /dist`);
    else         console.log(`[server] Mode: DEVELOPMENT — expecting Vite on :5173`);
  });
}

// Export for Vercel serverless function
export default app;
