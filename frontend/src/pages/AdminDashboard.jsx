import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Users, BookOpen, GraduationCap, ClipboardList, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    classes: 0,
    students: 0,
    enrollments: 0
  });
  const [graphs, setGraphs] = useState({ attendanceTrend: [] });
  const [topStudents, setTopStudents] = useState({ attendance: [], performance: [] });
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, graphsRes, topRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/graphs'),
          api.get('/admin/top-students')
        ]);
        setStats(statsRes.data);
        setGraphs(graphsRes.data);
        setTopStudents(topRes.data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  
  const statCards = [
    { title: t('common.total_users'), value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: t('common.total_classes'), value: stats.classes, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { title: t('common.total_students'), value: stats.students, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: t('common.total_enrollments'), value: stats.enrollments, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.admin_title')}</h1>
      </div>
      
      <div className="card p-6 border-inline-start-4 border-l-primary-500">
        <h2 className="text-lg font-medium text-gray-900">{t('dashboard.welcome', { name: user?.name })}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {t('dashboard.admin_subtitle')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6 flex items-start gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Attendance Trend Chart */}
        <div className="card p-6 border-t-4 border-blue-500">
          <h2 className="text-lg font-bold text-gray-900 mb-6">{t('dashboard.attendance_trend')}</h2>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphs.attendanceTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="present" name={t('attendance.present')} fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="absent" name={t('attendance.absent')} fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performer Card */}
        <div className="card border-t-4 border-primary-500 flex flex-col">
          <div className="p-4 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary-800">{t('dashboard.best_performance')}</h2>
            <TrendingUp size={20} className="text-primary-600" />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
            {topStudents.performance.length > 0 ? (
              <>
                <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-black mb-4">
                  {topStudents.performance[0].name.charAt(0)}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">{topStudents.performance[0].name}</h3>
                <p className="text-gray-500 font-medium mb-4">{topStudents.performance[0].class}</p>
                <div className="inline-flex items-center justify-center px-4 py-2 bg-primary-50 text-primary-700 rounded-full font-bold text-sm">
                  {topStudents.performance[0].progress_count} Logs Recorded
                </div>
              </>
            ) : (
              <p className="text-gray-400 font-medium italic">No performance data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
