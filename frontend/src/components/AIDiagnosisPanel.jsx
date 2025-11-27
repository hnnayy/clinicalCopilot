import React, { useState } from 'react';
import { generateDiagnosisAndRecommendations } from '../services/geminiService';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function AIDiagnosisPanel({ transcription, patientData, onDiagnosisGenerated }) {
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleGenerateDiagnosis = async () => {
    setLoading(true);
    setError(null);
    let retryCount = 0;
    const maxRetries = 2;
    
    const attemptGenerate = async () => {
      try {
        if (!transcription || transcription.trim().length === 0) {
          throw new Error('Transkripsi kosong. Silakan rekam konsultasi terlebih dahulu.');
        }

        if (!patientData) {
          throw new Error('Data pasien tidak tersedia.');
        }

        console.log(`Attempt ${retryCount + 1}: Generating diagnosis...`);
        const result = await generateDiagnosisAndRecommendations(transcription, patientData);
        
        if (result) {
          console.log('Diagnosis generated successfully:', result);
          setDiagnosis(result);
          setExpanded(true);
          if (onDiagnosisGenerated) {
            onDiagnosisGenerated(result);
          }
        } else {
          throw new Error('Gagal menghasilkan diagnosis. Response kosong dari AI.');
        }
      } catch (err) {
        retryCount++;
        console.error(`Attempt ${retryCount} failed:`, err);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying... (${retryCount}/${maxRetries})`);
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptGenerate();
        } else {
          throw err;
        }
      }
    };

    try {
      await attemptGenerate();
    } catch (err) {
      console.error('Error generating diagnosis after retries:', err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan diagnosis. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {!diagnosis ? (
        <button
          onClick={handleGenerateDiagnosis}
          disabled={loading || !transcription}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
            loading || !transcription
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" />
              Menghasilkan Diagnosis AI...
            </span>
          ) : (
            '🤖 Hasilkan Diagnosis dengan AI'
          )}
        </button>
      ) : (
        <div className="bg-white rounded-lg border-2 border-purple-200 overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200 hover:bg-purple-100 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-500 text-lg" />
              <span className="font-semibold text-dark">Diagnosis AI Generated</span>
            </div>
            <span className="text-lg">{expanded ? '▼' : '▶'}</span>
          </button>

          {expanded && (
            <div className="p-6 space-y-6">
              {/* Primary Diagnosis */}
              <div>
                <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Diagnosis Utama</h4>
                <p className="text-lg font-bold text-purple-600">{diagnosis.primary_diagnosis}</p>
              </div>

              {/* Severity */}
              <div>
                <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Tingkat Keparahan</h4>
                <span
                  className={`inline-block px-4 py-2 rounded-full font-semibold text-white ${
                    diagnosis.severity === 'berat'
                      ? 'bg-red-500'
                      : diagnosis.severity === 'sedang'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                >
                  {diagnosis.severity?.toUpperCase()}
                </span>
              </div>

              {/* Differential Diagnosis */}
              {diagnosis.differential_diagnosis && diagnosis.differential_diagnosis.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Diagnosis Alternatif</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    {diagnosis.differential_diagnosis.map((diag, idx) => (
                      <li key={idx} className="text-dark">{diag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clinical Findings */}
              {diagnosis.clinical_findings && diagnosis.clinical_findings.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Temuan Klinis</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    {diagnosis.clinical_findings.map((finding, idx) => (
                      <li key={idx} className="text-dark">{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Tests */}
              {diagnosis.recommended_tests && diagnosis.recommended_tests.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Tes Diagnostik yang Direkomendasikan</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    {diagnosis.recommended_tests.map((test, idx) => (
                      <li key={idx} className="text-dark">{test}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Treatment Plan */}
              {diagnosis.treatment_plan && diagnosis.treatment_plan.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Rencana Terapi</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    {diagnosis.treatment_plan.map((plan, idx) => (
                      <li key={idx} className="text-dark">{plan}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medications */}
              {diagnosis.medications && diagnosis.medications.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Obat-obatan</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    {diagnosis.medications.map((med, idx) => (
                      <li key={idx} className="text-dark font-semibold">{med}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lifestyle Recommendations */}
              {diagnosis.lifestyle_recommendations && diagnosis.lifestyle_recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Rekomendasi Gaya Hidup</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    {diagnosis.lifestyle_recommendations.map((rec, idx) => (
                      <li key={idx} className="text-dark">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warning Signs */}
              {diagnosis.warning_signs && diagnosis.warning_signs.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-start gap-2 mb-2">
                    <FaExclamationTriangle className="text-red-600 mt-1 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-gray-text uppercase">Tanda-Tanda Bahaya</h4>
                  </div>
                  <ul className="list-disc pl-6 space-y-1">
                    {diagnosis.warning_signs.map((sign, idx) => (
                      <li key={idx} className="text-red-700 font-semibold">{sign}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up */}
              {diagnosis.follow_up_date && (
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Tindak Lanjut</h4>
                  <p className="text-dark font-semibold">{diagnosis.follow_up_date}</p>
                </div>
              )}

              {/* Additional Notes */}
              {diagnosis.notes && (
                <div>
                  <h4 className="text-sm font-bold text-gray-text uppercase mb-2">Catatan Tambahan</h4>
                  <p className="text-dark leading-relaxed">{diagnosis.notes}</p>
                </div>
              )}

              {/* Generate Again Button */}
              <button
                onClick={() => {
                  setDiagnosis(null);
                  setError(null);
                }}
                className="w-full py-2 px-4 rounded-lg font-semibold text-purple-600 border-2 border-purple-600 hover:bg-purple-50 transition"
              >
                Hasilkan Ulang Diagnosis
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 font-semibold mb-2">Error: {error}</p>
          <p className="text-red-600 text-sm">
            Pastikan:
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Transkripsi sudah selesai</li>
              <li>Koneksi internet stabil</li>
              <li>API key Gemini valid</li>
            </ul>
          </p>
          <button
            onClick={() => setError(null)}
            className="mt-3 text-red-700 hover:text-red-900 font-semibold underline text-sm"
          >
            Tutup pesan ini
          </button>
        </div>
      )}
    </div>
  );
}
