// Gemini API service for dynamic medical record generation
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyA7KEkQhZQrh-qDJOwZuQi7R_UMHxGVWzg';
const GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Generate medical record format dynamically based on diagnosis
 * Uses Gemini API to determine appropriate medical record structure
 */
export async function generateMedicalRecordFormat(diagnosis, patientData, transcription) {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured. Using fallback format.');
    return null;
  }

  try {
    const prompt = `
Anda adalah asisten medis profesional. Berdasarkan diagnosis berikut, hasilkan struktur rekam medis elektronik yang sesuai dalam format JSON.

DIAGNOSIS: ${diagnosis}

DATA PASIEN:
- Nama: ${patientData?.name || 'N/A'}
- Usia: ${calculateAge(patientData?.dob) || 'N/A'} tahun
- Jenis Kelamin: ${patientData?.jenis_kelamin || 'N/A'}

TRANSKRIP KONSULTASI (ringkas):
${transcription ? transcription.substring(0, 500) : 'N/A'}

Berdasarkan diagnosis tersebut, hasilkan JSON dengan struktur berikut:
{
  "diagnosis_category": "kategori penyakit (e.g., respiratory, cardiovascular, gastrointestinal)",
  "vital_signs_needed": ["list vital signs yang harus dicatat untuk penyakit ini"],
  "examination_sections": ["list pemeriksaan fisik yang relevan"],
  "diagnostic_tests": ["list tes diagnostik yang disarankan"],
  "treatment_considerations": ["list pertimbangan terapi"],
  "warning_signs": ["tanda-tanda bahaya yang harus dipantau"],
  "follow_up_recommendations": "rekomendasi follow-up",
  "medical_record_template": "template ringkas untuk rekam medis"
}

Berikan HANYA JSON, tanpa teks tambahan.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return null;
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.warn('No content from Gemini API');
      return null;
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Could not extract JSON from Gemini response');
      return null;
    }

    const medicalRecordFormat = JSON.parse(jsonMatch[0]);
    return medicalRecordFormat;
  } catch (error) {
    console.error('Error generating medical record format:', error);
    return null;
  }
}

/**
 * Generate diagnosis and recommendations using Gemini
 */
export async function generateDiagnosisAndRecommendations(transcription, patientData) {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured.');
    throw new Error('Gemini API key not configured');
  }

  if (!transcription || transcription.trim().length === 0) {
    throw new Error('Transkripsi kosong. Silakan rekam konsultasi terlebih dahulu.');
  }

  try {
    const prompt = `
Anda adalah dokter konsultan berpengalaman. Analisis transkripsi konsultasi pasien berikut dan berikan diagnosis serta rekomendasi.

DATA PASIEN:
- Nama: ${patientData?.name || 'N/A'}
- Usia: ${calculateAge(patientData?.dob) || 'N/A'} tahun
- Jenis Kelamin: ${patientData?.jenis_kelamin || 'N/A'}
- Golongan Darah: ${patientData?.golongan_darah || 'N/A'}

TRANSKRIP KONSULTASI:
${transcription}

Berdasarkan informasi di atas, hasilkan JSON dengan format:
{
  "primary_diagnosis": "diagnosis utama dalam bahasa Indonesia",
  "differential_diagnosis": ["diagnosis alternatif 1", "diagnosis alternatif 2"],
  "severity": "ringan/sedang/berat",
  "clinical_findings": ["temuan klinis 1", "temuan klinis 2"],
  "recommended_tests": ["tes diagnostik 1", "tes diagnostik 2"],
  "treatment_plan": ["rencana terapi 1", "rencana terapi 2"],
  "medications": ["nama obat 1 - dosis", "nama obat 2 - dosis"],
  "lifestyle_recommendations": ["rekomendasi gaya hidup 1", "rekomendasi gaya hidup 2"],
  "warning_signs": ["tanda bahaya yang memerlukan perhatian medis segera"],
  "follow_up_date": "rekomendasi follow-up (e.g., dalam 3 hari)",
  "notes": "catatan tambahan untuk pasien"
}

Berikan HANYA JSON, tanpa teks tambahan. Pastikan respons medis akurat dan konservatif.
    `;

    console.log('Sending request to Gemini API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1500,
          }
        })
      }
    );

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${errorData?.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Gemini response:', data);
    
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.warn('No content from Gemini API');
      throw new Error('Tidak ada respons dari AI. Silakan coba lagi.');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Could not extract JSON from Gemini response:', content);
      throw new Error('AI tidak menghasilkan format yang valid. Silakan coba lagi.');
    }

    const diagnosis = JSON.parse(jsonMatch[0]);
    console.log('Parsed diagnosis:', diagnosis);
    return diagnosis;
  } catch (error) {
    console.error('Error generating diagnosis:', error);
    throw error;
  }
}

/**
 * Generate dynamic EHR HTML with disease-specific format
 */
export async function generateDynamicEHRHtml(consultation, patientData, medicalRecordFormat) {
  const date = new Date(consultation.created_at);
  const rmNumber = `RM-${date.getFullYear()}-${String(consultation.id).padStart(6, '0')}`;
  const jkn = patientData?.jkn_number || '';
  const patientName = patientData?.name || '—';
  const diagnosis = consultation.diagnosis || 'Belum ditetapkan';
  const category = medicalRecordFormat?.diagnosis_category || 'general';

  // Build vital signs section
  const vitalSignsHtml = medicalRecordFormat?.vital_signs_needed
    ? `
      <div class="card">
        <h3>Tanda-Tanda Vital</h3>
        <div class="vital-grid">
          ${medicalRecordFormat.vital_signs_needed.map(vital => `
            <div class="vital-item">
              <span class="vital-label">${vital}:</span>
              <span class="vital-value">—</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : '';

  // Build examination section
  const examinationHtml = medicalRecordFormat?.examination_sections
    ? `
      <div class="card">
        <h3>Pemeriksaan Fisik Spesifik (${category})</h3>
        <ul>
          ${medicalRecordFormat.examination_sections.map(exam => `<li>${exam}: —</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  // Build diagnostic tests section
  const testsHtml = medicalRecordFormat?.diagnostic_tests && medicalRecordFormat.diagnostic_tests.length > 0
    ? `
      <div class="card">
        <h3>Tes Diagnostik yang Disarankan</h3>
        <ul>
          ${medicalRecordFormat.diagnostic_tests.map(test => `<li>${test}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  // Build warning signs section
  const warningsHtml = medicalRecordFormat?.warning_signs && medicalRecordFormat.warning_signs.length > 0
    ? `
      <div class="card warning">
        <h3>⚠️ Tanda-Tanda Bahaya (Segera ke Rumah Sakit Jika):</h3>
        <ul>
          ${medicalRecordFormat.warning_signs.map(warning => `<li>${warning}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Catatan Medis Elektronik - ${patientName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 24px; color: #222; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #80a1ba; padding-bottom: 20px; margin-bottom: 20px; }
    .header-left h2 { margin: 0 0 10px 0; color: #2c3e50; }
    .header-right { text-align: right; }
    .header-right div { margin-bottom: 5px; font-size: 14px; }
    .header-right strong { color: #80a1ba; }
    .card { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; margin: 16px 0; }
    .card h3 { margin: 0 0 12px 0; color: #2c3e50; font-size: 16px; border-bottom: 2px solid #80a1ba; padding-bottom: 8px; }
    .card ul { margin: 0; padding-left: 20px; }
    .card li { margin-bottom: 6px; }
    .diagnosis-card { background: linear-gradient(135deg, #fff8e1 0%, #fff9c4 100%); border-left: 4px solid #fbc02d; }
    .warning { background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-left: 4px solid #d32f2f; }
    .vital-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
    .vital-item { padding: 8px; background: white; border: 1px solid #ddd; border-radius: 4px; }
    .vital-label { font-weight: 600; color: #555; }
    .vital-value { float: right; color: #80a1ba; font-weight: bold; }
    .category-badge { display: inline-block; background: #80a1ba; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 0 0 10px 0; }
    .recommendation { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin: 12px 0; border-radius: 4px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center; }
    @media print { body { margin: 0; background: white; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h2>Catatan Medis Elektronik</h2>
        <div style="font-size: 13px; color: #666;">
          Tanggal: <strong>${date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
        </div>
        <div style="font-size: 13px; color: #666;">
          Waktu: ${date.toLocaleTimeString('id-ID')}
        </div>
      </div>
      <div class="header-right">
        <div>No. Rekam Medis</div>
        <div style="font-size: 16px; font-weight: bold; color: #80a1ba;">${rmNumber}</div>
        <div style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
          <div>No. BPJS/JKN</div>
          <div style="font-size: 16px; font-weight: bold; color: #80a1ba;">${jkn || '—'}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Informasi Pasien</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px;">
        <div>
          <div style="color: #666; font-size: 12px; text-transform: uppercase;">Nama Lengkap</div>
          <div style="font-weight: 600; font-size: 16px;">${patientName}</div>
        </div>
        <div>
          <div style="color: #666; font-size: 12px; text-transform: uppercase;">Jenis Kelamin</div>
          <div style="font-weight: 600;">${patientData?.jenis_kelamin || '—'}</div>
        </div>
        <div>
          <div style="color: #666; font-size: 12px; text-transform: uppercase;">Tanggal Lahir</div>
          <div style="font-weight: 600;">${patientData?.dob ? new Date(patientData.dob).toLocaleDateString('id-ID') : '—'}</div>
        </div>
        <div>
          <div style="color: #666; font-size: 12px; text-transform: uppercase;">Usia</div>
          <div style="font-weight: 600;">${calculateAge(patientData?.dob) || '—'} tahun</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Keluhan Utama & Riwayat Penyakit Sekarang</h3>
      <div style="line-height: 1.6; white-space: pre-wrap;">
        ${consultation.transcription || 'Tidak ada transkrip tersedia'}
      </div>
    </div>

    ${vitalSignsHtml}
    ${examinationHtml}

    <div class="card diagnosis-card">
      <h3>Diagnosis</h3>
      <div class="category-badge">${category.toUpperCase()}</div>
      <div style="font-size: 16px; font-weight: 600; color: #333; line-height: 1.6;">
        ${diagnosis}
      </div>
    </div>

    ${testsHtml}

    ${warningsHtml}

    <div class="card">
      <h3>Rencana Penatalaksanaan</h3>
      <div class="recommendation">
        <strong>Istirahat yang cukup:</strong> Hindari aktivitas berat, pastikan istirahat 7-8 jam per hari
      </div>
      <div class="recommendation">
        <strong>Nutrisi:</strong> Konsumsi makanan bergizi, minum air putih minimal 8 gelas per hari
      </div>
      <div class="recommendation">
        <strong>Obat-obatan:</strong> Minum obat sesuai resep, jangan melewatkan dosis
      </div>
    </div>

    <div class="card">
      <h3>Anjuran Follow-up</h3>
      <div>${medicalRecordFormat?.follow_up_recommendations || 'Kontrol kembali sesuai kebutuhan atau bila ada keluhan'}</div>
    </div>

    <div class="footer">
      <p style="margin: 0;">Dokter: Dr. (Sistem Asisten)</p>
      <p style="margin: 5px 0 0 0;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      <p style="margin: 10px 0 0 0; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 11px;">
        Dokumen ini adalah catatan medis elektronik resmi. Simpan dengan baik untuk keperluan medis di masa depan.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Helper function to calculate age
function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
