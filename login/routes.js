const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('./db');
/*const pool = require('./db_pool');*/

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    //console.log(1)
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser.rows[0].id, username: newUser.rows[0].username, email: newUser.rows[0].email }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Logged in successfully',
      user: { id: user.rows[0].id, username: user.rows[0].username, email: user.rows[0].email }
    });

    //console.log(message);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  } else {
    res.status(400).json({ error: 'No active session' });
  }
});


module.exports = router;
