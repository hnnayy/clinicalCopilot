import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function DashboardPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      console.log('Fetching consultations from Supabase...');
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched consultations:', data);

      // For now, just show the consultations without patient/user details
      // We'll enhance this later with proper joins
      const transformedData = data.map(consultation => ({
        id: consultation.id,
        diagnosis: consultation.diagnosis,
        transcription: consultation.transcription,
        status: consultation.status,
        created_at: consultation.created_at,
        patient_id: consultation.patient_id,
        jkn_number: 'Loading...',
        patient_name: 'Loading...',
        dob: null,
        doctor_name: 'Loading...'
      }));

      setConsultations(transformedData);

      // Now fetch patient and doctor details for each consultation
      for (let i = 0; i < transformedData.length; i++) {
        try {
          const [patientRes, doctorRes] = await Promise.all([
            supabase.from('patients').select('jkn_number, name, dob').eq('id', data[i].patient_id).single(),
            supabase.from('users').select('name').eq('id', data[i].doctor_id).single()
          ]);

          if (patientRes.data) {
            transformedData[i].jkn_number = patientRes.data.jkn_number || '-';
            transformedData[i].patient_name = patientRes.data.name;
            transformedData[i].dob = patientRes.data.dob;
          }

          if (doctorRes.data) {
            transformedData[i].doctor_name = doctorRes.data.name;
          }
        } catch (err) {
          console.warn('Error fetching details for consultation', data[i].id, err);
        }
      }

      setConsultations([...transformedData]);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Klinik</h1>
        <Link
          to="/register"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Daftar Pasien Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Total Pasien</h3>
          <p className="text-2xl font-bold text-blue-600">
            {consultations.length > 0 ? new Set(consultations.map(c => c.patient_id)).size : 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Total Konsultasi</h3>
          <p className="text-2xl font-bold text-green-600">{consultations.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Konsultasi Hari Ini</h3>
          <p className="text-2xl font-bold text-purple-600">
            {consultations.filter(c =>
              new Date(c.created_at).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Riwayat Konsultasi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Tanggal</th>
                <th className="px-4 py-2 text-left">Pasien</th>
                <th className="px-4 py-2 text-left">JKN</th>
                <th className="px-4 py-2 text-left">Dokter</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {consultations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    Belum ada data konsultasi
                  </td>
                </tr>
              ) : (
                consultations.map((consultation) => (
                  <tr key={consultation.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {new Date(consultation.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-2">{consultation.patient_name}</td>
                    <td className="px-4 py-2">{consultation.jkn_number || '-'}</td>
                    <td className="px-4 py-2">{consultation.doctor_name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        consultation.status === 'TRANSCRIBED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {consultation.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/consultation?id=${consultation.id}`}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Lihat Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;