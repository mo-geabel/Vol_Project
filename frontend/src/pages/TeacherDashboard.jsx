import { useAuth } from '../context/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
      </div>
      
      <div className="card p-6 border-l-4 border-l-secondary-500">
        <h2 className="text-lg font-medium text-gray-900">Welcome back, {user?.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          View your assigned classes, mark attendance, and log student progress.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900">My Classes</h3>
          <p className="text-3xl font-bold text-secondary-600 mt-2">--</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900">Pending Actions</h3>
          <p className="text-3xl font-bold text-secondary-600 mt-2">--</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
