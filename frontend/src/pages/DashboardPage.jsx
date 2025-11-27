import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { cachedQuery } from '../utils/queryCache';

function DashboardPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTable, setExpandedTable] = useState(null);
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [expandedConsultation, setExpandedConsultation] = useState(null);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      console.log('Fetching consultations with optimized queries...');
      
      // Fetch consultations dengan limit lebih kecil untuk performa
      const consultations = await cachedQuery(
        supabase
          .from('consultations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        'consultations',
        { order: 'created_at_desc', limit: 20 }
      );

      if (!consultations || consultations.length === 0) {
        setConsultations([]);
        setLoading(false);
        return;
      }

      // Get unique patient IDs dan doctor IDs
      const uniquePatientIds = [...new Set(consultations.map(c => c.patient_id).filter(Boolean))];
      const uniqueDoctorIds = [...new Set(consultations.map(c => c.doctor_id).filter(Boolean))];

      // Fetch semua patient data dalam 1 query
      const patients = uniquePatientIds.length > 0
        ? await cachedQuery(
            supabase
              .from('patients')
              .select('id, jkn_number, name, dob')
              .in('id', uniquePatientIds),
            'patients',
            { ids: uniquePatientIds }
          )
        : [];

      // Fetch semua doctor data dalam 1 query
      const doctors = uniqueDoctorIds.length > 0
        ? await cachedQuery(
            supabase
              .from('users')
              .select('id, name')
              .in('id', uniqueDoctorIds),
            'users',
            { ids: uniqueDoctorIds }
          )
        : [];

      // Create lookup maps untuk O(1) access
      const patientMap = new Map(patients.map(p => [p.id, p]));
      const doctorMap = new Map(doctors.map(d => [d.id, d]));

      // Transform data dengan lookup maps
      const transformedData = consultations.map(consultation => {
        const patient = patientMap.get(consultation.patient_id);
        const doctor = doctorMap.get(consultation.doctor_id);

        return {
          id: consultation.id,
          diagnosis: consultation.diagnosis,
          transcription: consultation.transcription,
          status: consultation.status,
          created_at: consultation.created_at,
          patient_id: consultation.patient_id,
          jkn_number: patient?.jkn_number || '-',
          patient_name: patient?.name || 'Unknown',
          dob: patient?.dob || null,
          doctor_name: doctor?.name || 'Unknown'
        };
      });

      setConsultations(transformedData);
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
        <div 
          onClick={() => setExpandedTable('patients')}
          className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-lg hover:bg-blue-50 transition"
        >
          <h3 className="text-lg font-semibold">Total Pasien</h3>
          <p className="text-2xl font-bold text-blue-600">
            {consultations.length > 0 ? new Set(consultations.map(c => c.patient_id)).size : 0}
          </p>
        </div>
        <div 
          onClick={() => setExpandedTable('consultations')}
          className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-lg hover:bg-green-50 transition"
        >
          <h3 className="text-lg font-semibold">Total Konsultasi</h3>
          <p className="text-2xl font-bold text-green-600">{consultations.length}</p>
        </div>
        <div 
          onClick={() => setExpandedTable('today')}
          className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-lg hover:bg-purple-50 transition"
        >
          <h3 className="text-lg font-semibold">Konsultasi Hari Ini</h3>
          <p className="text-2xl font-bold text-purple-600">
            {consultations.filter(c =>
              new Date(c.created_at).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </div>
      </div>

      {expandedTable && (
        <div className="bg-white rounded shadow mb-6">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {expandedTable === 'patients' && 'Daftar Pasien'}
              {expandedTable === 'consultations' && 'Semua Konsultasi'}
              {expandedTable === 'today' && 'Konsultasi Hari Ini'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Tanggal</th>
                  <th className="px-4 py-2 text-left">Pasien</th>
                  <th className="px-4 py-2 text-left">JKN</th>
                  <th className="px-4 py-2 text-left">Dokter</th>
                  {expandedTable === 'patients' && <th className="px-4 py-2 text-left">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let filteredData = consultations;
                  
                  if (expandedTable === 'patients') {
                    const uniquePatients = new Map();
                    consultations.forEach(c => {
                      if (!uniquePatients.has(c.patient_id)) {
                        uniquePatients.set(c.patient_id, c);
                      }
                    });
                    filteredData = Array.from(uniquePatients.values());
                  } else if (expandedTable === 'today') {
                    filteredData = consultations.filter(c =>
                      new Date(c.created_at).toDateString() === new Date().toDateString()
                    );
                  }
                  
                  return filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={expandedTable === 'patients' ? "5" : "4"} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((consultation) => (
                      <React.Fragment key={consultation.id}>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {new Date(consultation.created_at).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-2">{consultation.patient_name}</td>
                          <td className="px-4 py-2">{consultation.jkn_number || '-'}</td>
                          <td className="px-4 py-2">{consultation.doctor_name}</td>
                          {expandedTable === 'patients' && (
                            <td className="px-4 py-2">
                              <button
                                onClick={() => setExpandedPatient(expandedPatient === consultation.patient_id ? null : consultation.patient_id)}
                                className="text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                {expandedPatient === consultation.patient_id ? '▼' : '▶'} Konsultasi
                              </button>
                            </td>
                          )}
                        </tr>
                        {expandedTable === 'patients' && expandedPatient === consultation.patient_id && (
                          <tr className="bg-blue-50">
                            <td colSpan="5" className="px-4 py-4">
                              <div className="bg-white rounded border border-blue-200 p-4">
                                <h4 className="font-semibold mb-3 text-sm">Riwayat Konsultasi - {consultation.patient_name}</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left">Tanggal</th>
                                        <th className="px-3 py-2 text-left">Dokter</th>
                                        <th className="px-3 py-2 text-left">Diagnosa</th>
                                        <th className="px-3 py-2 text-left">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {consultations
                                        .filter(c => c.patient_id === consultation.patient_id)
                                        .map((cons, idx) => (
                                          <React.Fragment key={`${cons.id}-${idx}`}>
                                            <tr className="border-b hover:bg-gray-50">
                                              <td className="px-3 py-2">
                                                {new Date(cons.created_at).toLocaleDateString('id-ID')}
                                              </td>
                                              <td className="px-3 py-2">{cons.doctor_name}</td>
                                              <td className="px-3 py-2 truncate">{cons.diagnosis || '-'}</td>
                                              <td className="px-3 py-2">
                                                <button
                                                  onClick={() => setExpandedConsultation(expandedConsultation === cons.id ? null : cons.id)}
                                                  className="text-green-600 hover:text-green-800 font-semibold text-xs"
                                                >
                                                  {expandedConsultation === cons.id ? '▼' : '▶'} EHR
                                                </button>
                                              </td>
                                            </tr>
                                            {expandedConsultation === cons.id && (
                                              <tr className="bg-green-50">
                                                <td colSpan="4" className="px-3 py-4">
                                                  <div className="bg-white rounded border border-green-200 p-4 text-sm">
                                                    <h5 className="font-semibold mb-2">Data EHR</h5>
                                                    <div className="grid grid-cols-2 gap-4">
                                                      <div>
                                                        <p className="text-gray-600 font-semibold">Tanggal Konsultasi</p>
                                                        <p>{new Date(cons.created_at).toLocaleDateString('id-ID', { 
                                                          weekday: 'long', 
                                                          year: 'numeric', 
                                                          month: 'long', 
                                                          day: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit'
                                                        })}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-gray-600 font-semibold">Dokter</p>
                                                        <p>{cons.doctor_name}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-gray-600 font-semibold">Pasien</p>
                                                        <p>{cons.patient_name}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-gray-600 font-semibold">JKN</p>
                                                        <p>{cons.jkn_number || '-'}</p>
                                                      </div>
                                                      <div className="col-span-2">
                                                        <p className="text-gray-600 font-semibold">Diagnosa</p>
                                                        <p className="whitespace-pre-wrap">{cons.diagnosis || 'Tidak ada diagnosa'}</p>
                                                      </div>
                                                      <div className="col-span-2">
                                                        <p className="text-gray-600 font-semibold">Transkripsi</p>
                                                        <p className="whitespace-pre-wrap text-gray-700">{cons.transcription || 'Tidak ada transkripsi'}</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;