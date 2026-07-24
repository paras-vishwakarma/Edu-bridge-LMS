import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ── ESM __dirname shim ────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Load .env manually ────────────────────────────────────────────────────────
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

// Open CORS — works for both Vercel (same-origin proxied) and local dev
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve built frontend in non-Vercel production
if (IS_PROD && !IS_VERCEL && fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  console.log(`[server] Serving static frontend from ${DIST}`);
}

// ── Seed data (mirrors src/data/mockData.js) ──────────────────────────────────
const SEED_USERS = [
  { id: 'admin-1', name: 'Admin User',        email: 'admin@edubridge.com',  password: 'admin123',      role: 'admin',      avatar: '', bio: 'Platform administrator',                         joinedAt: '2024-01-01', status: 'active' },
  { id: 'inst-1',  name: 'Dr. Sarah Chen',    email: 'sarah@edubridge.com',  password: 'instructor123', role: 'instructor', avatar: '', bio: 'Full-stack developer with 10+ years experience.', joinedAt: '2024-02-15', status: 'active' },
  { id: 'inst-2',  name: 'Prof. James Miller',email: 'james@edubridge.com',  password: 'instructor123', role: 'instructor', avatar: '', bio: 'Data scientist and AI researcher.',               joinedAt: '2024-03-01', status: 'active' },
  { id: 'stu-1',   name: 'Alex Johnson',      email: 'alex@student.com',     password: 'student123',    role: 'student',    avatar: '', bio: 'Computer Science student',                       joinedAt: '2024-04-10', status: 'active' },
  { id: 'stu-2',   name: 'Maya Patel',        email: 'maya@student.com',     password: 'student123',    role: 'student',    avatar: '', bio: 'Aspiring web developer',                         joinedAt: '2024-05-20', status: 'active' },
  { id: 'stu-3',   name: 'Ryan Kim',          email: 'ryan@student.com',     password: 'student123',    role: 'student',    avatar: '', bio: 'Learning to code',                              joinedAt: '2024-06-05', status: 'active' },
  { id: 'stu-4',   name: 'Emma Wilson',       email: 'emma@student.com',     password: 'student123',    role: 'student',    avatar: '', bio: 'UX Designer transitioning to development',       joinedAt: '2024-06-15', status: 'active' },
  { id: 'stu-5',   name: 'David Brown',       email: 'david@student.com',    password: 'student123',    role: 'student',    avatar: '', bio: 'Backend developer learning frontend',            joinedAt: '2024-07-01', status: 'banned'  },
];

// ── Pure JS in-memory database ────────────────────────────────────────────────
// Uses a JavaScript Map — zero native dependencies, works on every platform
// including Vercel serverless. Seeded fresh on every cold start.
const users = new Map(SEED_USERS.map(u => [u.id, { ...u }]));
console.log(`[DB] In-memory database ready with ${users.size} seeded users.`);

/** Return a user object by email (case-insensitive). */
function findByEmail(email) {
  const q = email.toLowerCase();
  for (const u of users.values()) {
    if (u.email.toLowerCase() === q) return { ...u };
  }
  return null;
}

/** Return a user object matching email + password. */
function findByCredentials(email, password) {
  const q = email.toLowerCase();
  for (const u of users.values()) {
    if (u.email.toLowerCase() === q && u.password === password) return { ...u };
  }
  return null;
}

// ── Token helper ──────────────────────────────────────────────────────────────
function makeToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86_400_000 })
  ).toString('base64');
  return `lerno.${payload}.sig`;
}

/** Strip password before sending user to client. */
function safeUser(u) {
  const { password: _pw, ...rest } = u;
  return rest;
}

// ── API Routes ────────────────────────────────────────────────────────────────

// POST /api/register
app.post('/api/register', (req, res) => {
  const { name, email, password, role = 'student' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }
  if (findByEmail(email)) {
    return res.json({ success: false, error: 'An account with this email already exists.' });
  }

  const id       = `user-${Date.now()}`;
  const joinedAt = new Date().toISOString().slice(0, 10);
  const status   = 'active';
  const newUser  = { id, name, email, password, role, avatar: '', bio: '', joinedAt, status };
  users.set(id, newUser);

  const su = safeUser(newUser);
  res.json({ success: true, token: makeToken(su), user: su });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const user = findByCredentials(email, password);
  if (!user) {
    return res.json({ success: false, error: 'Invalid email or password.' });
  }
  if (user.status === 'banned') {
    return res.json({ success: false, error: 'Your account has been suspended. Please contact support.' });
  }

  res.json({ success: true, token: makeToken(safeUser(user)), user: safeUser(user) });
});

// GET /api/users  (admin)
app.get('/api/users', (req, res) => {
  res.json(Array.from(users.values()).map(safeUser));
});

// PATCH /api/users/:id/status  (admin ban/unban)
app.patch('/api/users/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['active', 'banned'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value.' });
  }
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
  user.status = status;
  res.json({ success: true });
});

// DELETE /api/users/:id  (admin)
app.delete('/api/users/:id', (req, res) => {
  if (!users.has(req.params.id)) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }
  users.delete(req.params.id);
  res.json({ success: true });
});

// ── SPA catch-all — serve index.html for all non-API routes (non-Vercel prod) ─
if (IS_PROD && !IS_VERCEL && fs.existsSync(DIST)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST, 'index.html'));
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ── Start (skipped in Vercel serverless) ──────────────────────────────────────
const isMain = process.argv[1] === __filename;
if (!IS_VERCEL && isMain) {
  app.listen(PORT, () => {
    console.log(`[server] Backend running on http://localhost:${PORT}`);
    console.log(`[server] Mode: ${IS_PROD ? 'PRODUCTION' : 'DEVELOPMENT — expecting Vite on :5173'}`);
  });
}

// ── Export for Vercel serverless function ─────────────────────────────────────
export default app;
