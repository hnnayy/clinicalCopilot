const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./database');
const authRoutes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);

// Test connection
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', time: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

module.exports = app;