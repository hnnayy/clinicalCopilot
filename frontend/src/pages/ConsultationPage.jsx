import { useState } from 'react';
import AudioRecorder from '../components/AudioRecorder';
import PatientRegistration from '../components/PatientRegistration';
import { FaCheckCircle } from 'react-icons/fa';

export default function ConsultationPage() {
  const [patientData, setPatientData] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);

  const handleRegistrationComplete = (data) => {
    setPatientData(data);
  };

  const handleRecordingComplete = (data) => {
    setTranscription(data.transcription);
    setShowTranscription(true);
  };

  const handleNewConsultation = () => {
    setTranscription('');
    setShowTranscription(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-blue-50 py-6">
      <div className="max-w-full mx-auto px-4">
        {patientData === null ? (
          <PatientRegistration onRegistrationComplete={handleRegistrationComplete} />
        ) : !showTranscription ? (
          <>
            {/* Patient Info + Audio Recorder Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Patient Info */}
              <div className="lg:col-span-2">
                <div className="card p-6 bg-gradient-to-r from-secondary to-secondary/80 h-full">
                  <h2 className="text-sm font-bold text-white/80 mb-4 uppercase tracking-wide">Data Pasien</h2>
                  <div className="space-y-3 text-white text-sm">
                    <div>
                      <p className="text-xs opacity-70 font-medium">Nama</p>
                      <p className="text-base font-bold">{patientData.namaPasien}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs opacity-70 font-medium">No. RM</p>
                        <p className="font-semibold">{patientData.noRM || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-70 font-medium">Jenis Kelamin</p>
                        <p className="font-semibold">{patientData.jenisKelamin || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 font-medium">Alamat</p>
                      <p className="text-xs font-semibold">{patientData.alamat}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="opacity-70 font-medium">Golongan Darah</p>
                        <p className="font-semibold">{patientData.golonganDarah || '-'}</p>
                      </div>
                      <div>
                        <p className="opacity-70 font-medium">Tgl. Lahir</p>
                        <p className="font-semibold">{patientData.tanggalLahir || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Audio Recorder */}
              <div>
                <div className="card p-6">
                  <h2 className="text-sm font-bold text-dark mb-4 uppercase tracking-wide">Perekaman</h2>
                  <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-100">
                <FaCheckCircle className="text-2xl text-green-500" />
                <h2 className="text-2xl font-bold text-dark">Transkripsi Selesai</h2>
              </div>

              <div className="bg-blue-50 border-l-4 border-primary p-6 rounded-lg mb-6">
                <p className="text-xs font-bold text-gray-text uppercase mb-3">Hasil Transkripsi</p>
                <p className="text-dark text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {transcription}
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button 
                  className="btn-primary text-sm px-4 py-2"
                  onClick={() => alert('Konsultasi disimpan!')}
                >
                  Simpan
                </button>
                <button 
                  className="btn-secondary text-sm px-4 py-2"
                  onClick={handleNewConsultation}
                >
                  Konsultasi Baru
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}