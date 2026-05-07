import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ReceptionDashboard from './pages/ReceptionDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorHistory from './pages/DoctorHistory';    // ✅ new import
import PharmacyDashboard from './pages/PharmacyDashboard';
import Inventory from './pages/Inventory';
import AdminDashboard from './pages/AdminDashboard';
import Reports from './pages/Reports';
import UsersManagement from './pages/UsersManagement';
import ReceptionReport from './pages/ReceptionReport';
import ChangePassword from './pages/ChangePassword';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/reception" element={<ProtectedRoute><ReceptionDashboard /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/history" element={<ProtectedRoute><DoctorHistory /></ProtectedRoute>} />   {/* ✅ new route */}
        <Route path="/pharmacy" element={<ProtectedRoute><PharmacyDashboard /></ProtectedRoute>} />
        <Route path="/pharmacy/dispense" element={<Navigate to="/pharmacy" />} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UsersManagement /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/reception/reports" element={<ProtectedRoute><ReceptionReport /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;