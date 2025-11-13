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
                <div className="card p-6 bg-gray-50 border-2 border-secondary/30 h-full">
                  <h2 className="text-sm font-bold text-dark mb-4 uppercase tracking-wide">Data Pasien</h2>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    {/* Nama */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Nama</p>
                      <p className="text-dark font-bold mt-1">{patientData.namaPasien}</p>
                    </div>
                    {/* No. RM */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">No. RM</p>
                      <p className="text-dark font-bold mt-1">{patientData.noRM || '-'}</p>
                    </div>
                    {/* Jenis Kelamin */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Jenis Kelamin</p>
                      <p className="text-dark font-bold mt-1">{patientData.jenisKelamin || '-'}</p>
                    </div>
                    {/* Tempat Lahir */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Tempat Lahir</p>
                      <p className="text-dark font-bold mt-1">{patientData.tempatLahir || '-'}</p>
                    </div>
                    {/* Tanggal Lahir */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Tanggal Lahir</p>
                      <p className="text-dark font-bold mt-1">{patientData.tanggalLahir || '-'}</p>
                    </div>
                    {/* Ibu Kandung */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Ibu Kandung</p>
                      <p className="text-dark font-bold mt-1">{patientData.ibuKandung || '-'}</p>
                    </div>
                    {/* Golongan Darah */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Golongan Darah</p>
                      <p className="text-dark font-bold mt-1">{patientData.golonganDarah || '-'}</p>
                    </div>
                    {/* Status Nikah */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Status Nikah</p>
                      <p className="text-dark font-bold mt-1">{patientData.statusNikah || '-'}</p>
                    </div>
                    {/* Agama */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Agama</p>
                      <p className="text-dark font-bold mt-1">{patientData.agama || '-'}</p>
                    </div>
                    {/* Pendidikan */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Pendidikan</p>
                      <p className="text-dark font-bold mt-1">{patientData.pendidikanTerakhir || '-'}</p>
                    </div>
                    {/* Bahasa */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Bahasa</p>
                      <p className="text-dark font-bold mt-1">{patientData.bahasaDipakai || '-'}</p>
                    </div>
                    {/* Cacat Fisik */}
                    <div>
                      <p className="text-xs text-gray-text font-semibold uppercase">Cacat Fisik</p>
                      <p className="text-dark font-bold mt-1">{patientData.cacatFisik || '-'}</p>
                    </div>
                    {/* Alamat - Full Width */}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-text font-semibold uppercase">Alamat</p>
                      <p className="text-dark font-bold mt-1">{patientData.alamat}</p>
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