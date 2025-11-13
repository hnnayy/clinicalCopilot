import { useState, useRef } from 'react';
import './AudioRecorder.css';

export default function AudioRecorder({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      alert('Akses mikrofon ditolak');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const submitAudio = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const res = await fetch('http://localhost:3001/api/consultations/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      onRecordingComplete(data);
      setAudioBlob(null);
    } catch (error) {
      alert(`Error transkripsi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="recorder-card">
      <div className="recorder-header">
        <h3>🎤 Rekam Konsultasi Anda</h3>
        <p>Tekan tombol rekam dan mulai berbicara</p>
      </div>

      <div className="recorder-content">
        {!isRecording && !audioBlob && (
          <div className="recording-info">
            <div className="microphone-icon">🎙️</div>
            <p>Siap merekam</p>
          </div>
        )}

        {isRecording && (
          <div className="recording-active">
            <div className="recording-timer">
              <div className="pulse"></div>
              {formatTime(recordingTime)}
            </div>
            <p>Sedang merekam...</p>
          </div>
        )}

        {audioBlob && !isLoading && (
          <div className="recording-success">
            <div className="checkmark">✓</div>
            <p>Audio berhasil direkam</p>
            <p className="file-size">
              {(audioBlob.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {isLoading && (
          <div className="transcribing">
            <div className="loader"></div>
            <p>Sedang melakukan transkripsi...</p>
            <p className="subtitle">Ini mungkin memakan waktu beberapa saat</p>
          </div>
        )}
      </div>

      <div className="recorder-buttons">
        {!isRecording && !audioBlob && (
          <button 
            className="btn btn-record"
            onClick={startRecording}
          >
            🔴 Mulai Rekam
          </button>
        )}

        {isRecording && (
          <button 
            className="btn btn-stop"
            onClick={stopRecording}
          >
            ⏹️ Henti
          </button>
        )}

        {audioBlob && !isLoading && (
          <>
            <button 
              className="btn btn-submit"
              onClick={submitAudio}
            >
              ✓ Proses Transkripsi
            </button>
            <button 
              className="btn btn-retry"
              onClick={() => setAudioBlob(null)}
            >
              🔄 Rekam Ulang
            </button>
          </>
        )}
      </div>
    </div>
  );
}