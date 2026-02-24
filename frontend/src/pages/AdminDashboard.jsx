import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Users, BookOpen, GraduationCap, ClipboardList } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    classes: 0,
    students: 0,
    enrollments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  
  const statCards = [
    { title: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Classes', value: stats.classes, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Total Students', value: stats.students, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Total Enrollments', value: stats.enrollments, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6 flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '--' : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
