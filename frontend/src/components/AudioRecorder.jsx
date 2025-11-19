import { useState, useRef } from 'react';
import { FaMicrophone, FaSpinner, FaCircle, FaStop, FaCheck, FaSync } from 'react-icons/fa';
import { supabase } from '../supabaseClient';

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
    try {
      let localPatientId = null;
      if (patient) {
        // if patient has no server id, create it first
        localPatientId = patient.patientId || patient.id || null;
        if (!localPatientId && (patient.namaPasien || patient.name)) {
          // create patient on Supabase
          try {
            const patientPayload = {
              name: patient.namaPasien || patient.name || '',
              jkn_number: patient.noRM || patient.jkn_number || null,
              dob: patient.tanggalLahir || patient.dob || null
            };

            const { data, error } = await supabase
              .from('patients')
              .insert(patientPayload)
              .select()
              .single();

            if (error) throw error;
            localPatientId = data.id;
            // inform parent so it can persist patientId
            try { if (typeof onPatientCreated === 'function') onPatientCreated(localPatientId); } catch(e) { console.warn('onPatientCreated callback error', e); }
          } catch (err) {
            console.warn('Error creating patient before upload', err.message);
          }
        }
      }

      // Upload audio to Assembly AI
      console.log('Uploading audio to Assembly AI...');
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': '500e4dec21b64520bea78d5d355c66f9', // Assembly AI API key
          'Content-Type': 'audio/webm'
        },
        body: audioBlob
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio');
      }

      const uploadData = await uploadResponse.json();
      const uploadUrl = uploadData.upload_url;

      // Submit transcription request
      console.log('Submitting transcription request...');
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': '500e4dec21b64520bea78d5d355c66f9',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: uploadUrl,
          language_code: 'id'
        })
      });

      if (!transcriptResponse.ok) {
        throw new Error('Failed to submit transcription');
      }

      const transcriptData = await transcriptResponse.json();
      const transcriptId = transcriptData.id;

      // Poll for completion
      let transcription = null;
      let attempts = 0;
      const maxAttempts = 120;

      while (!transcription && attempts < maxAttempts) {
        const checkResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            'Authorization': '500e4dec21b64520bea78d5d355c66f9'
          }
        });

        const statusData = await checkResponse.json();

        if (statusData.status === 'completed') {
          transcription = statusData.text;
          break;
        } else if (statusData.status === 'error') {
          throw new Error('Transcription failed');
        }

        // Wait 1 second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!transcription) {
        throw new Error('Transcription timeout');
      }

      // Save to Supabase
      console.log('Saving to Supabase...');
      const consultationPayload = {
        doctor_id: 1, // Default doctor ID
        patient_id: localPatientId,
        transcription: transcription,
        status: 'TRANSCRIBED'
      };

      const { data: consultationData, error: consultationError } = await supabase
        .from('consultations')
        .insert(consultationPayload)
        .select()
        .single();

      if (consultationError) throw consultationError;

      const result = {
        transcription: transcription,
        consultationId: consultationData.id
      };

      onRecordingComplete(result);
      setAudioBlob(null);
    } catch (error) {
      console.error('Transcription error:', error);
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