import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>
      
      <div className="card p-6 border-l-4 border-l-primary-500">
        <h2 className="text-lg font-medium text-gray-900">Welcome, {user?.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          From here you can manage users, students, classes, and schedules.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900">Total Users</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">--</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900">Total Classes</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">--</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900">Total Students</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">--</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
