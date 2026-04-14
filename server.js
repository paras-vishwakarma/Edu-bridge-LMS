import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      avatar TEXT,
      bio TEXT,
      joinedAt TEXT,
      status TEXT
    )`);
  }
});

// Helper for generating token 
function makeToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86400000 })
  ).toString('base64');
  return `lerno.${payload}.sig`;
}

// POST /api/register
app.post('/api/register', (req, res) => {
  const { name, email, password, role = 'student' } = req.body;
  const id = `user-${Date.now()}`;
  const joinedAt = new Date().toISOString().slice(0, 10);
  const status = 'active';

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: 'Database error' });
    if (row) return res.json({ success: false, error: 'An account with this email already exists.' });

    const stmt = db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run([id, name, email, password, role, '', '', joinedAt, status], function(insertErr) {
      if (insertErr) {
        return res.status(500).json({ success: false, error: 'Failed to create user' });
      }

      const safeUser = { id, name, email, role, avatar: '', bio: '', joinedAt, status };
      const token = makeToken(safeUser);
      res.json({ success: true, token, user: safeUser });
    });
  });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: 'Database error' });
    if (!user) return res.json({ success: false, error: 'Invalid email or password.' });
    if (user.status === 'banned') {
      return res.json({ success: false, error: 'Your account has been suspended. Please contact support.' });
    }

    const { password: _pw, ...safeUser } = user;
    const token = makeToken(safeUser);
    res.json({ success: true, token, user: safeUser });
  });
});

// GET /api/users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'Database error' });
    const safeUsers = rows.map(({ password, ...u }) => u);
    res.json(safeUsers);
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
