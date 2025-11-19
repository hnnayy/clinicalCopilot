import { useLocation, useNavigate } from 'react-router-dom';

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

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { consultationId, transcription, patientData } = location.state || {};

  if (!consultationId || !transcription) {
    return <div className="min-h-screen flex items-center justify-center">Data tidak tersedia. Kembali ke halaman konsultasi.</div>;
  }

  const date = new Date();
  const htmlContent = generateEHRHtml({
    consultationId,
    date,
    transcription,
    diagnosis: null, // bisa tambah nanti
    therapy: null,
    vitals: null,
    patient: { name: patientData?.namaPasien, jkn_number: patientData?.noRM }
  });

  const handleBack = () => {
    navigate('/consultation', {
      state: {
        showTranscription: true,
        transcription,
        consultationId,
        patientData
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-blue-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-dark mb-6">Laporan Konsultasi</h1>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          <div className="flex gap-3 justify-center mt-6">
            <button
              className="btn-primary text-sm px-4 py-2"
              onClick={() => window.print()}
            >
              Cetak
            </button>
            <button
              className="btn-secondary text-sm px-4 py-2"
              onClick={handleBack}
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}