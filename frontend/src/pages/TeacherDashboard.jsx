import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, AlertCircle, ChevronRight, GraduationCap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const TeacherDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({ classes: 0, students: 0, pendingActions: 0 });
  const [classes, setClasses] = useState([]);
  const [graphs, setGraphs] = useState({ attendanceTrend: [] });
  const [topStudents, setTopStudents] = useState({ attendance: [], performance: [] });
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.language === 'ar';

  const fetchData = async () => {
    try {
      const [statsRes, classesRes, graphsRes, topRes] = await Promise.all([
        api.get('/teacher/stats'),
        api.get('/teacher/classes'),
        api.get('/teacher/graphs'),
        api.get('/teacher/top-students')
      ]);
      setStats(statsRes.data);
      setClasses(classesRes.data);
      setGraphs(graphsRes.data);
      setTopStudents(topRes.data);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      toast.error(t('dashboard.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-primary-600 font-medium">{t('dashboard.loading')}</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('dashboard.teacher_title')}</h1>
      </div>
      
      <div className={`card p-6 border-secondary-500 bg-linear-to-r from-secondary-50/50 to-transparent border-inline-start-4`}>
        <h2 className="text-lg font-bold text-gray-900">{t('dashboard.welcome_back', { name: user?.name })}</h2>
        <p className="mt-1 text-sm text-gray-500 font-medium">
          {t('dashboard.teacher_subtitle')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-white hover:shadow-md transition-all hover:-translate-y-1">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className="p-3 bg-secondary-100 text-secondary-600 rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('common.my_classes')}</p>
              <p className="text-3xl font-black text-gray-900">{stats.classes}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-white hover:shadow-md transition-all hover:-translate-y-1">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className="p-3 bg-primary-100 text-primary-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('common.total_students')}</p>
              <p className="text-3xl font-black text-gray-900">{stats.students}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-white hover:shadow-md transition-all hover:-translate-y-1">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('dashboard.pending_actions')}</p>
              <p className="text-3xl font-black text-gray-900">{stats.pendingActions}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black text-gray-900">{t('dashboard.assigned_classes')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="card p-5 hover:shadow-lg transition-all hover:-translate-y-1 group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${cls.type === 'Quran' ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-600'}`}>
                      {cls.type === 'Quran' ? <BookOpen size={16} /> : <GraduationCap size={16} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {cls.type === 'Quran' ? t('common.quranic') : t('common.theoric')}
                    </span>
                  </div>
                  <h4 className="font-black text-gray-900 text-lg">{cls.name}</h4>
                  <div className="flex items-center gap-2 mt-3 text-gray-400 font-bold">
                    <Users size={16} className="text-primary-500" />
                    <span className="text-xs">{t('dashboard.students_count', { count: cls.studentCount })}</span>
                  </div>
                </div>
                <Link 
                  to={cls.type === 'Quran' ? `/teacher/quran/${cls.id}` : `/teacher/theory/${cls.id}`}
                  className={`p-2 text-gray-400 group-hover:text-primary-600 transition-all ${isRTL ? 'rotate-180' : ''}`}
                >
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold italic">{t('dashboard.no_classes')}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Attendance Trend Chart */}
        <div className="card p-6 border-t-4 border-secondary-500">
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

        {/* Top Attendance Card (Class Best Student) */}
        <div className="card border-t-4 border-green-500 flex flex-col">
          <div className="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-green-800">{t('dashboard.best_attendance')}</h2>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
            {topStudents.attendance.length > 0 ? (
              <>
                <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-2xl font-black mb-4">
                  {topStudents.attendance[0].name.charAt(0)}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">{topStudents.attendance[0].name}</h3>
                <p className="text-gray-500 font-medium mb-4">{topStudents.attendance[0].class}</p>
                <div className="inline-flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 rounded-full font-bold text-sm">
                  {topStudents.attendance[0].present_count} {t('attendance.present')}
                </div>
              </>
            ) : (
              <p className="text-gray-400 font-medium italic">No attendance data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
