import { useState, useRef } from 'react';

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
    <div className="card p-10 border border-gray-200">
      {/* Header */}
      <div className="text-center mb-8 border-b border-gray-100 pb-6">
        <h3 className="text-2xl font-bold text-dark mb-2">🎤 Rekam Konsultasi Anda</h3>
        <p className="text-gray-text font-normal">Tekan tombol rekam dan mulai berbicara</p>
      </div>

      {/* Content Area */}
      <div className="min-h-40 flex items-center justify-center mb-8 bg-gradient-to-br from-primary-light to-blue-50 rounded-xl p-8 border border-gray-border">
        {!isRecording && !audioBlob && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎙️</div>
            <p className="text-dark font-semibold text-lg">Siap merekam</p>
          </div>
        )}

        {isRecording && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              <div className="text-4xl font-bold text-red-500 font-mono tracking-widest">
                {formatTime(recordingTime)}
              </div>
            </div>
            <p className="text-gray-text font-normal">Sedang merekam...</p>
          </div>
        )}

        {audioBlob && !isLoading && (
          <div className="text-center">
            <div className="text-5xl mb-3">✓</div>
            <p className="text-dark font-semibold text-lg mb-1">Audio berhasil direkam</p>
            <p className="text-gray-text font-medium">
              {(audioBlob.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-border border-t-primary rounded-full animate-spin mx-auto mb-5"></div>
            <p className="text-dark font-semibold text-lg mb-2">Sedang melakukan transkripsi...</p>
            <p className="text-gray-text text-sm">Ini mungkin memakan waktu beberapa saat</p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 justify-center flex-wrap">
        {!isRecording && !audioBlob && (
          <button 
            onClick={startRecording}
            className="btn-primary"
          >
            🔴 Mulai Rekam
          </button>
        )}

        {isRecording && (
          <button 
            onClick={stopRecording}
            className="btn bg-red-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            ⏹️ Henti
          </button>
        )}

        {audioBlob && !isLoading && (
          <>
            <button 
              onClick={submitAudio}
              className="btn-primary"
            >
              ✓ Proses Transkripsi
            </button>
            <button 
              onClick={() => setAudioBlob(null)}
              className="btn-secondary"
            >
              🔄 Rekam Ulang
            </button>
          </>
        )}
      </div>
    </div>
  );
}