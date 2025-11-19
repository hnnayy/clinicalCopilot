import { useState } from 'react';

export default function PatientRegistration({ onRegistrationComplete }) {
  const [formData, setFormData] = useState({
    noRM: '',
    namaPasien: '',
    alamat: '',
    jenisKelamin: '',
    tempatLahir: '',
    tanggalLahir: '',
    ibuKandung: '',
    golonganDarah: '',
    statusNikah: '',
    agama: '',
    pendidikanTerakhir: '',
    bahasaDipakai: '',
    cacatFisik: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [patientId, setPatientId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.namaPasien || !formData.alamat) {
        // if patient already selected (patientId) allow missing alamat
        if (!patientId) throw new Error('Harap isi semua field yang wajib');
      }

      // Save to localStorage for now (will be saved to DB later)
      const out = { ...formData, patientId };
      localStorage.setItem('patientData', JSON.stringify(out));

      onRegistrationComplete(out);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    setSearchResults([]);
    setError('');
    try {
      const name = formData.namaPasien || '';
      const dob = formData.tanggalLahir || '';
      const params = new URLSearchParams();
      if (name) params.append('name', name);
      if (dob) params.append('dob', dob);
      const res = await fetch(`http://localhost:3001/api/patients?${params.toString()}`);
      const data = await res.json();
      setSearchResults(data || []);
      if (!data || data.length === 0) {
        setError('Tidak ada pasien ditemukan. Anda bisa lanjut membuat pasien baru.');
      }
    } catch (err) {
      setError('Gagal mencari pasien: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = (p) => {
    setPatientId(p.id);
    setFormData(prev => ({
      ...prev,
      namaPasien: p.name || prev.namaPasien,
      tanggalLahir: p.dob ? p.dob.toString().slice(0,10) : prev.tanggalLahir,
      noRM: prev.noRM || ''
    }));
    setSearchResults([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-blue-50 px-5 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2 tracking-tight">
            Pendaftaran Pasien
          </h1>
          <p className="text-lg text-gray-text">Lengkapi data diri Anda sebelum konsultasi</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: No RM & Nama Pasien */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  No. RM
                </label>
                <input
                  type="text"
                  name="noRM"
                  value={formData.noRM}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Nama Pasien *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="namaPasien"
                    value={formData.namaPasien}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                  <button type="button" onClick={handleSearch} disabled={searching} className="btn-secondary">
                    {searching ? 'Mencari...' : 'Cari'}
                  </button>
                </div>
                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border rounded shadow-sm p-2">
                    {searchResults.map(p => (
                      <div key={p.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectPatient(p)}>
                        <div className="text-sm font-semibold">{p.name} {p.jkn_number ? `• JKN: ${p.jkn_number}` : ''}</div>
                        <div className="text-xs text-gray-500">DOB: {p.dob || '-'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Alamat */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Alamat *
              </label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                className="input-field resize-none"
                rows="2"
                required
              />
            </div>

            {/* Row 3: Jenis Kelamin, Tempat Lahir, Tanggal Lahir */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Jenis Kelamin
                </label>
                <select
                  name="jenisKelamin"
                  value={formData.jenisKelamin}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Pilih</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  name="tempatLahir"
                  value={formData.tempatLahir}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  name="tanggalLahir"
                  value={formData.tanggalLahir}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            {/* Row 4: Ibu, Golongan Darah, Status Nikah */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Ibu Kandung
                </label>
                <input
                  type="text"
                  name="ibuKandung"
                  value={formData.ibuKandung}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Golongan Darah
                </label>
                <select
                  name="golonganDarah"
                  value={formData.golonganDarah}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Pilih</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Status Nikah
                </label>
                <select
                  name="statusNikah"
                  value={formData.statusNikah}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Pilih</option>
                  <option value="Belum Menikah">Belum Menikah</option>
                  <option value="Menikah">Menikah</option>
                  <option value="Cerai">Cerai</option>
                  <option value="Duda/Janda">Duda/Janda</option>
                </select>
              </div>
            </div>

            {/* Row 5: Agama, Pendidikan, Bahasa, Cacat */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Agama
                </label>
                <select
                  name="agama"
                  value={formData.agama}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Pilih</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Pendidikan
                </label>
                <select
                  name="pendidikanTerakhir"
                  value={formData.pendidikanTerakhir}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Pilih</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Bahasa
                </label>
                <input
                  type="text"
                  name="bahasaDipakai"
                  value={formData.bahasaDipakai}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Cacat Fisik
                </label>
                <input
                  type="text"
                  name="cacatFisik"
                  value={formData.cacatFisik}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Menyimpan...' : 'Lanjut ke Konsultasi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
