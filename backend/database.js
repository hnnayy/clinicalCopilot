const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'hnn',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'clinical_copilot'
});

// Create tables on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'DOCTOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
     jkn_number VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    dob DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES users(id),
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    diagnosis TEXT,
    transcription TEXT,
    ina_cbg_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.log('Tables already exist or error:', err.message));

// Ensure we have a column to store generated medical note HTML
pool.query(`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS notes_html TEXT;`)
  .catch(err => console.log('Error ensuring notes_html column:', err.message));

// Add basic AI columns for diagnosis suggestions
pool.query(`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS ai_diagnosis JSONB;`)
  .catch(err => console.log('Error ensuring consultations.ai_diagnosis column:', err.message));

pool.query(`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMP;`)
  .catch(err => console.log('Error ensuring consultations.ai_generated_at column:', err.message));

pool.query(`ALTER TABLE consultations ADD COLUMN IF NOT EXISTS ai_model VARCHAR(255);`)
  .catch(err => console.log('Error ensuring consultations.ai_model column:', err.message));

// Allow jkn_number to be nullable in case patient doesn't have JKN
pool.query(`ALTER TABLE patients ALTER COLUMN jkn_number DROP NOT NULL;`)
  .catch(err => console.log('Error allowing nullable jkn_number (may already be nullable):', err.message));

// Ensure we have a dob column for patients
pool.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob DATE;`)
  .catch(err => console.log('Error ensuring patients.dob column:', err.message));

module.exports = pool;