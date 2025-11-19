-- Buat tabel users untuk dokter
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50) DEFAULT 'doctor',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Buat tabel patients untuk pasien
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  jkn_number VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  dob DATE,
  alamat TEXT,
  jenis_kelamin VARCHAR(20),
  tempat_lahir VARCHAR(100),
  ibu_kandung VARCHAR(100),
  golongan_darah VARCHAR(5),
  status_nikah VARCHAR(20),
  agama VARCHAR(50),
  pendidikan_terakhir VARCHAR(50),
  bahasa_dipakai VARCHAR(50),
  cacat_fisik TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Buat tabel consultations untuk konsultasi
CREATE TABLE IF NOT EXISTS consultations (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL,
  patient_id INTEGER,
  diagnosis TEXT,
  transcription TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert data dokter dummy untuk testing
INSERT INTO users (id, name, email, role) VALUES
(1, 'Dr. Ahmad', 'ahmad@clinic.com', 'doctor')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security jika diperlukan
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;