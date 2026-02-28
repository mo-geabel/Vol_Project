import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
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
import Reports from './pages/admin/Reports';
import TeacherAttendance from './pages/admin/TeacherAttendance';
import AdminStatistics from './pages/admin/Statistics';
import Compliance from './pages/admin/Compliance';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherClasses from './pages/teacher/TeacherClasses';
import Attendance from './pages/teacher/Attendance';
import QuranProgress from './pages/teacher/QuranProgress';
import StudentProgress from './pages/teacher/StudentProgress';
import TheoryProgress from './pages/teacher/TheoryProgress';
import TeacherStatistics from './pages/TeacherStatistics';

// Placeholder Pages
const Unauthorized = () => {
  const { t } = useTranslation();
  return <div className="p-8"><h2>{t('common.unauthorized')}</h2></div>;
};


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
            <Route path="/admin/students/compliance" element={<Compliance />} />
            <Route path="/admin/schedules" element={<Schedules />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/teacher-attendance" element={<TeacherAttendance />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/statistics" element={<AdminStatistics />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin', 'teacher']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/attendance" element={<Attendance />} />
            <Route path="/teacher/quran/:classId" element={<QuranProgress />} />
            <Route path="/teacher/progress/:enrollmentId" element={<StudentProgress />} />
            <Route path="/teacher/theory/:classId" element={<TheoryProgress />} />
            <Route path="/teacher/statistics" element={<TeacherStatistics />} />
            <Route path="/teacher/reports" element={<Reports />} />
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
