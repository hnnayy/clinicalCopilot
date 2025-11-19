import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ConsultationPage from './pages/ConsultationPage';
import ReportPage from './pages/ReportPage';
import PatientRegistration from './components/PatientRegistration';

function App() {
  const handleRegistrationComplete = (data) => {
    // Navigate ke consultation page setelah registrasi
    window.location.href = '/consultation';
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/register" element={<PatientRegistration onRegistrationComplete={handleRegistrationComplete} />} />
        <Route path="/consultation" element={<ConsultationPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </Router>
  );
}

export default App;
