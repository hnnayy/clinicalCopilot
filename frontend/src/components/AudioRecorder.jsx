import { useState, useRef } from 'react';
import { FaMicrophone, FaSpinner, FaCircle, FaStop, FaCheck, FaSync } from 'react-icons/fa';

export default function AudioRecorder({ onRecordingComplete, patient, onPatientCreated }) {
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
    // attach patient info if available
    try {
      let localPatientId = null;
      if (patient) {
        // if patient has no server id, create it first
        localPatientId = patient.patientId || patient.id || null;
        if (!localPatientId && (patient.namaPasien || patient.name)) {
          // create patient on backend
          try {
            const createRes = await fetch('http://127.0.0.1:3001/api/patients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: patient.namaPasien || patient.name || '', jkn_number: patient.noRM || patient.jkn_number || '', dob: patient.tanggalLahir || patient.dob || null })
            });
            const createData = await createRes.json();
            if (createRes.ok && createData.id) {
              localPatientId = createData.id;
              // inform parent so it can persist patientId
              try { if (typeof onPatientCreated === 'function') onPatientCreated(localPatientId); } catch(e) { console.warn('onPatientCreated callback error', e); }
            } else {
              console.warn('Failed to create patient before upload', createData);
            }
          } catch (err) {
            console.warn('Error creating patient before upload', err.message);
          }
        }

        const payload = {
          id: localPatientId,
          name: patient.namaPasien || patient.name || '',
          jkn_number: patient.noRM || patient.jkn_number || '',
          dob: patient.tanggalLahir || patient.dob || ''
        };
        console.log('DEBUG: attaching patient payload to FormData:', payload);
        formData.append('patient', JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('Failed to attach patient info', e);
    }

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
    <div className="space-y-4">
      {/* Status Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        {!isRecording && !audioBlob && !isLoading && (
          <div className="flex items-center gap-2 text-sm">
            <FaMicrophone className="text-primary" />
            <span className="font-medium text-dark">Siap merekam</span>
          </div>
        )}

        {isRecording && (
          <div className="flex items-center gap-3">
            <FaCircle className="text-red-500 text-2xl animate-pulse" />
            <div>
              <p className="text-sm font-bold text-red-600">{formatTime(recordingTime)}</p>
              <p className="text-xs text-gray-text">Sedang merekam...</p>
            </div>
          </div>
        )}

        {audioBlob && !isLoading && (
          <div className="text-sm">
            <p className="font-medium text-dark">Audio tersimpan ({(audioBlob.size / 1024).toFixed(1)} KB)</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2">
            <FaSpinner className="text-primary animate-spin text-sm" />
            <span className="text-sm font-medium text-primary">Sedang transkripsi...</span>
          </div>
        )}
      </div>

      {/* Audio Playback */}
      {audioBlob && (
        <audio src={URL.createObjectURL(audioBlob)} controls className="w-full h-8" />
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {!isRecording && !audioBlob && !isLoading && (
          <button 
            onClick={startRecording}
            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
          >
            <FaCircle style={{fontSize: '10px'}} />Mulai
          </button>
        )}

        {isRecording && (
          <button 
            onClick={stopRecording}
            className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
          >
            <FaStop style={{fontSize: '12px'}} />Berhenti
          </button>
        )}

        {audioBlob && !isLoading && (
          <>
            <button 
              onClick={submitAudio}
              className="flex items-center gap-1 bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <FaCheck style={{fontSize: '12px'}} />Proses
            </button>
            <button 
              onClick={() => setAudioBlob(null)}
              className="flex items-center gap-1 bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <FaSync style={{fontSize: '12px'}} />Ulang
            </button>
          </>
        )}
      </div>
    </div>
  );
}