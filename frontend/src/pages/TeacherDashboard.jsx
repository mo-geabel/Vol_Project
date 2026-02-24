import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Users, BookOpen, GraduationCap, AlertCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ classes: 0, students: 0, pendingActions: 0 });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, classesRes] = await Promise.all([
        api.get('/teacher/stats'),
        api.get('/teacher/classes')
      ]);
      setStats(statsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
      </div>
      
      <div className="card p-6 border-l-4 border-l-secondary-500 bg-linear-to-r from-secondary-50/50 to-transparent">
        <h2 className="text-lg font-medium text-gray-900">Welcome back, {user?.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          View your assigned classes, mark attendance, and log student progress.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary-100 text-secondary-600 rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">My Classes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.classes}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 text-primary-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Actions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingActions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Assigned Classes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${cls.type === 'Quran' ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-600'}`}>
                      {cls.type === 'Quran' ? <BookOpen size={16} /> : <GraduationCap size={16} />}
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {cls.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">{cls.name}</h4>
                  <div className="flex items-center gap-2 mt-3 text-gray-500">
                    <Users size={16} />
                    <span className="text-sm font-medium">{cls.studentCount} Students</span>
                  </div>
                </div>
                <Link 
                  to={cls.type === 'Quran' ? `/teacher/quran/${cls.id}` : `/teacher/theory/${cls.id}`}
                  className="p-2 text-gray-400 group-hover:text-secondary-600 transition-colors"
                >
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 italic">No classes assigned to you yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
