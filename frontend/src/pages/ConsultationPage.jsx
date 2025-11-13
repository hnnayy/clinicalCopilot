import { useState } from 'react';
import AudioRecorder from '../components/AudioRecorder';

export default function ConsultationPage() {
  const [transcription, setTranscription] = useState('');
  const [consultationId, setConsultationId] = useState(null);
  const [showTranscription, setShowTranscription] = useState(false);

  const handleRecordingComplete = (data) => {
    setTranscription(data.transcription);
    setConsultationId(data.consultationId);
    setShowTranscription(true);
  };

  const handleNewConsultation = () => {
    setTranscription('');
    setConsultationId(null);
    setShowTranscription(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-blue-50 px-5 py-10">
      {/* Header */}
      <div className="text-center mb-12 pt-5">
        <h1 className="text-5xl font-bold text-dark mb-4 tracking-tight">Konsultasi Medis</h1>
        <p className="text-xl text-gray-text font-normal">Rekam percakapan Anda untuk transkripsi otomatis</p>
      </div>

      {!showTranscription ? (
        <div className="max-w-2xl mx-auto">
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto card p-12">
          {/* Result Header */}
          <div className="border-b-2 border-gray-100 pb-6 mb-8">
            <h2 className="text-4xl font-bold text-dark mb-3">✅ Transkripsi Selesai</h2>
            <p className="text-gray-text font-medium">ID Konsultasi: #{consultationId}</p>
          </div>

          {/* Transcription Box */}
          <div className="bg-primary-light border-l-4 border-primary p-7 rounded-xl mb-8">
            <h3 className="text-dark font-bold text-sm uppercase tracking-widest mb-5">Hasil Transkripsi:</h3>
            <div className="text-lg leading-relaxed text-dark font-normal whitespace-pre-wrap">
              {transcription}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap pt-8 border-t border-gray-100">
            <button 
              className="btn-primary"
              onClick={() => {
                alert('Konsultasi disimpan!');
              }}
            >
              Simpan Konsultasi
            </button>
            <button 
              className="btn-secondary"
              onClick={handleNewConsultation}
            >
              Konsultasi Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}