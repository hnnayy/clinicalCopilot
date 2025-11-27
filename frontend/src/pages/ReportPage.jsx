import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { cachedQuery } from '../utils/queryCache';
import { generateMedicalRecordFormat, generateDynamicEHRHtml } from '../services/geminiService';

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patientData, setPatientData] = useState(null);
  const [editedPatientData, setEditedPatientData] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [medicalRecordFormat, setMedicalRecordFormat] = useState(null);
  const [generatingFormat, setGeneratingFormat] = useState(false);
  const [selectedConsultationEHR, setSelectedConsultationEHR] = useState(null);
  const [showEHR, setShowEHR] = useState(false);

  const patientId = searchParams.get('patientId');
  const { consultationId, transcription, diagnosis } = location.state || {};

  // State untuk legacy mode
  const [legacyPatientData, setLegacyPatientData] = useState(null);
  const [legacyConsultation, setLegacyConsultation] = useState(null);

  const fetchPatientReport = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch patient dan consultations dalam parallel
      const [patientData, consultations] = await Promise.all([
        cachedQuery(
          supabase
            .from('patients')
            .select('*')
            .eq('id', patientId)
            .single(),
          'patients',
          { id: patientId }
        ),
        cachedQuery(
          supabase
            .from('consultations')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(50),
          'consultations',
          { patient_id: patientId, order: 'created_at_desc', limit: 50 }
        )
      ]);

      setPatientData(patientData);
      setEditedPatientData(patientData);
      setConsultations(consultations || []);
    } catch (err) {
      console.error('Error fetching patient report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchLegacyData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch consultation untuk mendapatkan patient_id
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .single();

      if (consultationError) throw consultationError;

      // Fetch patient data berdasarkan patient_id dari consultation
      const patient = await cachedQuery(
        supabase
          .from('patients')
          .select('*')
          .eq('id', consultation.patient_id)
          .single(),
        'patients',
        { id: consultation.patient_id }
      );

      setLegacyPatientData(patient);
      setLegacyConsultation(consultation);
    } catch (err) {
      console.error('Error fetching legacy data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  async function handleSavePatientData() {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update(editedPatientData)
        .eq('id', patientId);

      if (error) throw error;

      setPatientData(editedPatientData);
      setIsEditing(false);
      alert('Data pasien berhasil disimpan');
    } catch (err) {
      console.error('Error saving patient data:', err);
      alert('Gagal menyimpan data: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateConsultationReport(consultation) {
    setGeneratingFormat(true);
    try {
      // Generate medical record format based on diagnosis
      const format = await generateMedicalRecordFormat(
        consultation.diagnosis,
        patientData,
        consultation.transcription
      );

      // Generate dynamic HTML
      const htmlContent = await generateDynamicEHRHtml(
        consultation,
        patientData,
        format || {}
      );

      // Store EHR content in state instead of opening new window
      setSelectedConsultationEHR({
        consultation,
        htmlContent,
        format
      });
      setShowEHR(true);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Gagal membuat laporan dinamis: ' + err.message);
    } finally {
      setGeneratingFormat(false);
    }
  }

  const generateLegacyReport = useCallback(async () => {
    if (!legacyPatientData || !legacyConsultation) return;

    setGeneratingFormat(true);
    try {
      const diagString = diagnosis?.primary_diagnosis || 'Belum ada diagnosis';
      
      // Generate medical record format based on diagnosis
      const format = await generateMedicalRecordFormat(
        diagString,
        legacyPatientData,
        transcription
      );
      setMedicalRecordFormat(format);

      // Generate dynamic HTML
      const htmlContent = await generateDynamicEHRHtml(
        { ...legacyConsultation, created_at: new Date().toISOString(), diagnosis: diagString },
        legacyPatientData,
        format || {}
      );

      // Store EHR content in state instead of opening new window
      setSelectedConsultationEHR({
        consultation: { ...legacyConsultation, created_at: new Date().toISOString(), diagnosis: diagString },
        htmlContent,
        format
      });
      setShowEHR(true);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Gagal membuat laporan dinamis');
    } finally {
      setGeneratingFormat(false);
    }
  }, [legacyPatientData, legacyConsultation, transcription, diagnosis]);

  // Auto-generate report if diagnosis is passed
  useEffect(() => {
    if (diagnosis && legacyPatientData && legacyConsultation && !showEHR && !generatingFormat) {
      generateLegacyReport();
    }
  }, [diagnosis, legacyPatientData, legacyConsultation, showEHR, generatingFormat, generateLegacyReport]);

  useEffect(() => {
    if (patientId) {
      fetchPatientReport();
    } else if (consultationId && transcription) {
      // Legacy mode: fetch data dari database
      fetchLegacyData();
    } else {
      setError('Data pasien tidak ditemukan');
      setLoading(false);
    }
  }, [patientId, consultationId, transcription, fetchPatientReport, fetchLegacyData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat data pasien...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Legacy mode: single consultation report
  if (consultationId && transcription && !patientId) {
    const handleBack = () => {
      navigate('/consultation', {
        state: {
          showTranscription: true,
          transcription,
          consultationId,
          patientData: legacyPatientData
        }
      });
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-blue-50 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-dark mb-6">Catatan Medis Elektronik</h1>

            {/* Patient Info */}
            {legacyPatientData && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                <h3 className="font-semibold text-dark mb-2">Data Pasien</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Nama:</strong> {legacyPatientData.name}</div>
                  <div><strong>JKN:</strong> {legacyPatientData.jkn_number || '-'}</div>
                  <div><strong>Tanggal Lahir:</strong> {legacyPatientData.dob || '-'}</div>
                  <div><strong>Jenis Kelamin:</strong> {legacyPatientData.jenis_kelamin || '-'}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                className="btn-primary text-sm px-4 py-2"
                onClick={generateLegacyReport}
                disabled={generatingFormat}
              >
                {generatingFormat ? 'Membuat Laporan...' : 'Tampilkan Catatan Medis Elektronik'}
              </button>
              <button
                className="btn-secondary text-sm px-4 py-2"
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

        {/* Electronic Health Record Section for Legacy Mode */}
        {showEHR && selectedConsultationEHR && (
          <div className="max-w-4xl mx-auto px-4 mt-6">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary">Catatan Medis Elektronik (EHR)</h2>
                <button
                  onClick={() => setShowEHR(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={selectedConsultationEHR.htmlContent}
                  className="w-full h-96 border-0"
                  title="Electronic Health Record"
                />
              </div>

              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={() => {
                    const printWindow = window.open();
                    printWindow.document.write(selectedConsultationEHR.htmlContent);
                    printWindow.document.close();
                    printWindow.print();
                  }}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Cetak EHR
                </button>
                <button
                  onClick={() => setShowEHR(false)}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // New mode: patient report with all consultations
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-blue-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="card p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-dark">Laporan Pasien</h1>
            <div className="space-x-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Edit Data
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="btn-secondary text-sm px-4 py-2"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>

          {/* Patient Info - Editable */}
          <div className={`p-6 rounded-lg mb-6 ${isEditing ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-blue-50'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Data Pasien</h2>
              {isEditing && (
                <div className="space-x-2">
                  <button
                    onClick={handleSavePatientData}
                    disabled={isSaving}
                    className="btn-primary text-xs px-3 py-1"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedPatientData(patientData);
                    }}
                    className="btn-secondary text-xs px-3 py-1"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editedPatientData?.name || ''}
                    onChange={(e) => setEditedPatientData({ ...editedPatientData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No. JKN / BPJS</label>
                  <input
                    type="text"
                    value={editedPatientData?.jkn_number || ''}
                    onChange={(e) => setEditedPatientData({ ...editedPatientData, jkn_number: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editedPatientData?.dob || ''}
                    onChange={(e) => setEditedPatientData({ ...editedPatientData, dob: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                  <select
                    value={editedPatientData?.jenis_kelamin || ''}
                    onChange={(e) => setEditedPatientData({ ...editedPatientData, jenis_kelamin: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Pilih</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={editedPatientData?.tempat_lahir || ''}
                    onChange={(e) => setEditedPatientData({ ...editedPatientData, tempat_lahir: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Golongan Darah</label>
                  <select
                    value={editedPatientData?.golongan_darah || ''}
                    onChange={(e) => setEditedPatientData({ ...editedPatientData, golongan_darah: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Pilih</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Alamat</label>
                  <textarea
                    value={editedPatientData?.alamat || ''}
                    onChange={(e) => setEditedPatientData({ ...editedPatientData, alamat: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows="3"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Nama:</span> <span>{patientData?.name}</span>
                </div>
                <div>
                  <span className="font-medium">No. JKN:</span> <span>{patientData?.jkn_number || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">Tanggal Lahir:</span> <span>{patientData?.dob ? new Date(patientData.dob).toLocaleDateString('id-ID') : '-'}</span>
                </div>
                <div>
                  <span className="font-medium">Jenis Kelamin:</span> <span>{patientData?.jenis_kelamin || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">Tempat Lahir:</span> <span>{patientData?.tempat_lahir || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">Golongan Darah:</span> <span>{patientData?.golongan_darah || '-'}</span>
                </div>
                {patientData?.alamat && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Alamat:</span> <span>{patientData.alamat}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Consultations History */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Riwayat Konsultasi</h2>
            {consultations.length === 0 ? (
              <p className="text-gray-500">Belum ada riwayat konsultasi</p>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation, index) => (
                  <div key={consultation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">Konsultasi #{consultations.length - index}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(consultation.created_at).toLocaleDateString('id-ID', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="font-medium">ID Dokter:</span> <span>{consultation.doctor_id || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          consultation.status === 'TRANSCRIBED' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {consultation.status}
                        </span>
                      </div>
                    </div>

                    {consultation.transcription && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Transkripsi:</span>
                        <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded text-sm">
                          {consultation.transcription}
                        </p>
                      </div>
                    )}

                    {consultation.diagnosis && (
                      <div>
                        <span className="font-medium text-sm">Diagnosis:</span>
                        <p className="mt-1 text-gray-700 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400 text-sm">
                          {consultation.diagnosis}
                        </p>
                      </div>
                    )}

                    {consultation.diagnosis && (
                      <button
                        onClick={() => handleGenerateConsultationReport(consultation)}
                        disabled={generatingFormat}
                        className="mt-3 bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-xs font-medium transition"
                      >
                        {generatingFormat ? 'Membuat...' : 'Tampilkan Catatan Medis Elektronik'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Electronic Health Record Section */}
          {showEHR && selectedConsultationEHR && (
            <div className="mt-8">
              <div className="bg-white border-2 border-primary rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-primary">Catatan Medis Elektronik (EHR)</h2>
                  <button
                    onClick={() => setShowEHR(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={selectedConsultationEHR.htmlContent}
                    className="w-full h-96 border-0"
                    title="Electronic Health Record"
                  />
                </div>

                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={() => {
                      const printWindow = window.open();
                      printWindow.document.write(selectedConsultationEHR.htmlContent);
                      printWindow.document.close();
                      printWindow.print();
                    }}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Cetak EHR
                  </button>
                  <button
                    onClick={() => setShowEHR(false)}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center mt-8">
            <button
              className="btn-primary text-sm px-6 py-2"
              onClick={() => window.print()}
            >
              Cetak Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}