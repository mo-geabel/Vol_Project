import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';

import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/admin/Users';
import Classes from './pages/admin/Classes';
import QuranicStudents from './pages/admin/QuranicStudents';
import TheoricStudents from './pages/admin/TheoricStudents';
import Schedules from './pages/admin/Schedules';
import Settings from './pages/admin/Settings';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherClasses from './pages/teacher/TeacherClasses';
import Attendance from './pages/teacher/Attendance';

// Placeholder Pages
const Unauthorized = () => <div className="p-8"><h2>Unauthorized Access</h2></div>;

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/classes" element={<Classes />} />
            <Route path="/admin/students/quranic" element={<QuranicStudents />} />
            <Route path="/admin/students/theoric" element={<TheoricStudents />} />
            <Route path="/admin/schedules" element={<Schedules />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin', 'teacher']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/attendance" element={<Attendance />} />
          </Route>
        </Route>

        {/* Redirect / to the appropriate dashboard based on role */}
        <Route path="/" element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/teacher" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        
        {/* 404 Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
