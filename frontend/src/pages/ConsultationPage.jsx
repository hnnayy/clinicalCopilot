import { useState } from 'react';
import AudioRecorder from '../components/AudioRecorder';
import './ConsultationPage.css';

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
    <div className="consultation-container">
      <div className="consultation-header">
        <h1>Konsultasi Medis</h1>
        <p>Rekam percakapan Anda untuk transkripsi otomatis</p>
      </div>

      {!showTranscription ? (
        <div className="consultation-recorder">
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
      ) : (
        <div className="consultation-result">
          <div className="result-header">
            <h2>✅ Transkripsi Selesai</h2>
            <p className="consultation-id">ID Konsultasi: #{consultationId}</p>
          </div>

          <div className="transcription-box">
            <h3>Hasil Transkripsi:</h3>
            <div className="transcription-text">
              {transcription}
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => {
                // TODO: Save/submit consultation
                alert('Konsultasi disimpan!');
              }}
            >
              Simpan Konsultasi
            </button>
            <button 
              className="btn btn-secondary"
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