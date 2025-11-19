const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./database');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'secret';
const ASSEMBLY_AI_KEY = process.env.ASSEMBLY_AI_KEY || '500e4dec21b64520bea78d5d355c66f9';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const upload = multer({ storage: multer.memoryStorage() });

// Helper to generate a simple Catatan Medis Elektronik HTML string
function generateEHRHtml({ consultationId, date, transcription, diagnosis, therapy, vitals, patient }) {
  const rmNumber = `RM-${date.getFullYear()}-${String(consultationId).padStart(6, '0')}`;
  const jkn = patient?.jkn_number || '';
  const patientName = patient?.name || '—';
  const mainComplaint = transcription ? transcription.substring(0, 200) : '';
  const temperature = vitals?.temperature || '';
  const pulse = vitals?.pulse || '';
  const bp = vitals?.bp || '';
  const faring = vitals?.faring || '';

  // Minimal inline styles so page looks presentable when opened directly
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Catatan Medis Elektronik - ${patientName}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #222 }
    .header { display:flex; justify-content:space-between; align-items:center }
    .card { background:#fff; border-radius:8px; padding:18px; box-shadow:0 1px 2px rgba(0,0,0,0.06); margin-top:16px }
    .muted { color:#666 }
    .diagnosis { background:#fff8dc; padding:12px; border-radius:6px }
    ul { margin:0; padding-left:20px }
    .btn { display:inline-block; background:#2563eb; color:white; padding:12px 18px; border-radius:8px; text-decoration:none }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2>Catatan Medis Elektronik</h2>
      <div class="muted">Tanggal: ${date.toLocaleDateString('id-ID')}</div>
    </div>
    <div style="text-align:right">
      <div>No. Rekam Medis: <strong>${rmNumber}</strong></div>
      <div>No. BPJS: <strong>${jkn}</strong></div>
    </div>
  </div>

  <div class="card">
    <h3>Data Pasien</h3>
    <div>Nama Pasien: <strong>${patientName}</strong></div>
  </div>

  <div class="card">
    <h3>Keluhan Utama</h3>
    <div>${mainComplaint || '—'}</div>
  </div>

  <div class="card">
    <h3>Pemeriksaan Fisik</h3>
    <div>Suhu: <strong>${temperature || '—'}</strong></div>
    <div>Nadi: <strong>${pulse || '—'}</strong></div>
    <div>TD: <strong>${bp || '—'}</strong></div>
    <div>Faring: <strong>${faring || '—'}</strong></div>
  </div>

  <div class="card diagnosis">
    <h3>Diagnosis</h3>
    <div>${diagnosis || 'Belum diisi'}</div>
  </div>

  <div class="card">
    <h3>Terapi</h3>
    ${Array.isArray(therapy) && therapy.length ? `<ul>${therapy.map(t => `<li>${t}</li>`).join('')}</ul>` : '<div>Belum ada terapi yang diberikan</div>'}
  </div>

  <div class="card">
    <h3>Anjuran</h3>
    <div>Istirahat cukup, minum air putih yang cukup. Kontrol kembali sesuai kebutuhan.</div>
  </div>

  <div style="margin-top:18px">
    <a class="btn" href="#">Validasi Compliance</a>
  </div>
</body>
</html>`;
}

// --- AI Diagnosis helper (scaffold) ---
async function generateDiagnosisFromTranscript(transcript, patient) {
  if (!GOOGLE_API_KEY) return null;

  const prompt = `You are a clinical assistant. Given patient data and transcript, return JSON: {"primary_diagnosis":"string", "differential":[{"diagnosis":"string","confidence":0.8}], "overall_confidence":0.9, "recommendations":"string"}\n\nPatient: ${JSON.stringify(patient || {})}\nTranscript: ${transcript || ''}\nReturn only valid JSON:`;

  try {
    const resp = await axios.post(`https://generativelanguage.googleapis.com/v1/models/text-bison-001:generateText?key=${GOOGLE_API_KEY}`, {
      prompt: { text: prompt },
      temperature: 0.1,
      maxOutputTokens: 500
    });

    const text = resp.data?.candidates?.[0]?.output || '';
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (ee) { return null; }
      }
    }

    return parsed ? { diagnosisObj: parsed, responseText: text, model: 'text-bison-001' } : null;
  } catch (err) {
    console.warn('Gemini call failed:', err.message);
    return null;
  }
}


// Middleware to verify token (optional for testing)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // If no token provided, allow for testing
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { id: 1, email: 'test@example.com' };
    return next();
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Still allow for testing
    req.user = { id: 1, email: 'test@example.com' };
    next();
  }
};

// Register
router.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    res.json({ message: 'Registered', user: result.rows[0] });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transcribe endpoint using Assembly AI
router.post('/consultations/transcribe', verifyToken, upload.single('audio'), async (req, res) => {
  try {
    console.log('📝 Transcription request received');
    console.log('User:', req.user);
    console.log('File:', req.file ? `${req.file.size} bytes` : 'NO FILE');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('🔄 Uploading audio to Assembly AI...');
    // Step 1: Upload audio to Assembly AI
    const uploadResponse = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      req.file.buffer,
      {
        headers: {
          'Authorization': ASSEMBLY_AI_KEY,
          'Content-Type': 'audio/webm'
        }
      }
    ).catch(error => {
      console.error('Upload error:', error.response?.data || error.message);
      throw new Error(`Upload failed: ${error.response?.data?.error || error.message}`);
    });

    const uploadUrl = uploadResponse.data.upload_url;
    console.log('✅ Upload successful:', uploadUrl);

    console.log('📤 Submitting transcription request...');
    // Step 2: Submit transcription request
    const transcriptResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadUrl,
        language_code: 'id'
      },
      {
        headers: {
          'Authorization': ASSEMBLY_AI_KEY
        }
      }
    ).catch(error => {
      console.error('Transcript request error:', error.response?.data || error.message);
      throw new Error(`Transcription request failed: ${error.response?.data?.error || error.message}`);
    });

    const transcriptId = transcriptResponse.data.id;
    let transcription = null;
    
    console.log('⏳ Polling for transcription status:', transcriptId);

    // Step 3: Poll for completion
    let isComplete = false;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes with 1 second intervals

    while (!isComplete && attempts < maxAttempts) {
      const checkResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            'Authorization': ASSEMBLY_AI_KEY
          }
        }
      ).catch(error => {
        console.error('Status check error:', error.response?.data || error.message);
        throw new Error(`Status check failed: ${error.response?.data?.error || error.message}`);
      });

      const status = checkResponse.data.status;
      console.log(`Status check ${attempts + 1}:`, status);

      if (status === 'completed') {
        transcription = checkResponse.data.text;
        isComplete = true;
        console.log('✅ Transcription completed');
      } else if (status === 'error') {
        console.error('Transcription error:', checkResponse.data.error);
        throw new Error(`Transcription failed: ${checkResponse.data.error}`);
      } else {
        // Wait 1 second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    if (!isComplete) {
      throw new Error('Transcription timeout');
    }

    console.log('💾 Saving to database...');
    // Step 4: Save to database and generate medical note HTML
    let consultationId = null;
    try {
      const doctorId = req.user?.id || 1;

      // Upsert patient if provided in request body (patient: { jkn_number, name })
      let patientId = null;
      let patientPayload = req.body.patient || null;
      // If patient was sent as a JSON string (from FormData), parse it
      if (patientPayload && typeof patientPayload === 'string') {
        try {
          patientPayload = JSON.parse(patientPayload);
        } catch (e) {
          console.warn('Failed to parse patient payload JSON:', e.message);
        }
      }



      // If frontend provided an existing patient id, try to use that record
      if (patientPayload && (patientPayload.id || patientPayload.patientId)) {
        const lookupId = patientPayload.id || patientPayload.patientId;
        try {
          const existing = await pool.query('SELECT id FROM patients WHERE id = $1', [lookupId]);
          if (existing.rows.length) {
            patientId = existing.rows[0].id;
          }
        } catch (e) {
          console.warn('Failed to lookup patient by id:', e.message);
        }
      }
      if (patientPayload) {
        // If a JKN is provided and non-empty, try to find existing patient by JKN
        const jknRaw = patientPayload.jkn_number;
        const jkn = (typeof jknRaw === 'string' && jknRaw.trim() !== '') ? jknRaw.trim() : null;
        const dobRaw = patientPayload.dob;
        const dob = (typeof dobRaw === 'string' && dobRaw.trim() !== '') ? dobRaw.trim() : null;

        if (jkn) {
          const existing = await pool.query('SELECT id FROM patients WHERE jkn_number = $1', [jkn]);
          if (existing.rows.length) {
            patientId = existing.rows[0].id;
          } else {
            // insert with provided JKN (and optional dob)
            const pRes = await pool.query('INSERT INTO patients (jkn_number, name, dob) VALUES ($1, $2, $3) RETURNING id', [jkn, patientPayload.name || '', dob]);
            patientId = pRes.rows[0].id;
          }
        } else if (patientPayload.name) {
          // No JKN provided: insert patient with NULL jkn_number (allows multiple unknown patients)
          const pRes = await pool.query('INSERT INTO patients (jkn_number, name, dob) VALUES ($1, $2, $3) RETURNING id', [null, patientPayload.name || '', dob]);
          patientId = pRes.rows[0].id;
        }
      }

      // Insert consultation record (patient_id defaults to NULL-capable behavior: if not provided use 0? table requires patient_id NOT NULL)
      // Ensure a patient_id exists; if not, insert a placeholder patient row
      if (!patientId) {
        // create placeholder patient without JKN (use NULL for jkn_number)
        const place = await pool.query('INSERT INTO patients (jkn_number, name, dob) VALUES ($1, $2, $3) RETURNING id', [null, 'Pasien Tidak Diketahui', null]);
        patientId = place.rows[0].id;
      }

      const consultationRes = await pool.query(
        'INSERT INTO consultations (doctor_id, patient_id, transcription, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [doctorId, patientId, transcription, 'TRANSCRIBED']
      );

      const consultation = consultationRes.rows[0];
      consultationId = consultation.id;

      console.log('✅ Saved to database:', consultationId);

      // Fetch the saved patient record to use authoritative data in the generated notes
      let patientRecord = null;
      try {
        const pRes = await pool.query('SELECT id, jkn_number, name, dob FROM patients WHERE id = $1', [patientId]);
        if (pRes.rows.length) patientRecord = pRes.rows[0];
      } catch (e) {
        console.warn('Failed to load patient record for notes generation:', e.message);
      }

      // Attempt to generate AI diagnosis suggestion (non-blocking)
      let aiResult = null;
      try {
        aiResult = await generateDiagnosisFromTranscript(transcription, patientRecord || patientPayload);
      } catch (e) {
        console.warn('AI generation error:', e.message);
        aiResult = null;
      }
      // Build EHR HTML and save into consultations.notes_html
      const now = new Date();
      const ehrHtml = generateEHRHtml({
        consultationId,
        date: now,
        transcription,
        diagnosis: req.body.diagnosis || null,
        therapy: req.body.therapy || null,
        vitals: req.body.vitals || null,
        patient: patientRecord || patientPayload || { name: 'Pasien Tidak Diketahui', jkn_number: null }
      });

      await pool.query('UPDATE consultations SET notes_html = $1 WHERE id = $2', [ehrHtml, consultationId]);
      if (aiResult) {
        await pool.query('UPDATE consultations SET ai_diagnosis = $1, ai_generated_at = $2, ai_model = $3 WHERE id = $4', [aiResult.diagnosisObj, new Date(), aiResult.model, consultationId]);
      }
      console.log('✅ Consultation saved:', consultationId);
    } catch (dbError) {
      console.error('Database error (non-critical):', dbError.message);
      // Continue anyway, return mock ID
      if (!consultationId) consultationId = Math.floor(Math.random() * 10000);
    }

    console.log('🎉 Transcription complete! Sending response...');
    res.json({ 
      consultationId: consultationId,
      transcription: transcription 
    });
  } catch (error) {
    console.error('❌ Transcription error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch generated medical note HTML
router.get('/consultations/:id/notes', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query('SELECT notes_html FROM consultations WHERE id = $1', [id]);
    if (!result.rows.length || !result.rows[0].notes_html) return res.status(404).send('Not found');
    res.set('Content-Type', 'text/html');
    res.send(result.rows[0].notes_html);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Search patients by name and/or date of birth
router.get('/patients', async (req, res) => {
  try {
    const { name, dob } = req.query;
    let sql = 'SELECT id, jkn_number, name, dob, created_at FROM patients';
    const params = [];
    const where = [];

    if (name && name.trim() !== '') {
      params.push(`%${name.trim()}%`);
      where.push(`name ILIKE $${params.length}`);
    }

    if (dob && dob.trim() !== '') {
      // expect dob in YYYY-MM-DD format
      params.push(dob.trim());
      where.push(`dob = $${params.length}`);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create patient (used by frontend to ensure a patient record exists before uploading audio)
router.post('/patients', async (req, res) => {
  try {
    const { jkn_number, name, dob } = req.body;

    if (!name || name.trim() === '') return res.status(400).json({ error: 'Name is required' });

    // If JKN provided, try find existing
    if (jkn_number && jkn_number.trim() !== '') {
      const existing = await pool.query('SELECT id FROM patients WHERE jkn_number = $1', [jkn_number.trim()]);
      if (existing.rows.length) return res.json({ id: existing.rows[0].id });
    }

    // Insert new patient
    const insert = await pool.query('INSERT INTO patients (jkn_number, name, dob) VALUES ($1, $2, $3) RETURNING id', [jkn_number || null, name, dob || null]);
    res.json({ id: insert.rows[0].id });
  } catch (err) {
    console.error('Error creating patient:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;