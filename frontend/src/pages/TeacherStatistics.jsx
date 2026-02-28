import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const TeacherStatistics = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [graphs, setGraphs] = useState({ attendanceTrend: [], quranTrend: [], theoryTrend: [] });
  const [topStudents, setTopStudents] = useState({ attendance: [], performance: [], rated: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [graphsRes, topRes] = await Promise.all([
          api.get('/teacher/graphs'),
          api.get('/teacher/top-students')
        ]);
        setGraphs(graphsRes.data);
        setTopStudents(topRes.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-primary-600 font-medium">{t('common.loading')}...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('common.statistics')}</h1>
      
      {/* Attendance Trend Chart - Quranic */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">{t('dashboard.attendance_trend')} - {t('common.quranic')}</h2>
        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graphs.quranTrend?.length > 0 ? graphs.quranTrend : graphs.attendanceTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              <Bar dataKey="present" name={t('attendance.present')} fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="absent" name={t('attendance.absent')} fill="#EF4444" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="excused" name={t('attendance.excused')} fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance Trend Chart - Theory */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">{t('dashboard.attendance_trend')} - {t('common.theoric')}</h2>
        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graphs.theoryTrend || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              <Bar dataKey="present" name={t('attendance.present')} fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="absent" name={t('attendance.absent')} fill="#EF4444" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="excused" name={t('attendance.excused')} fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Attendance List - Quranic */}
        <div className="card border-t-4 border-green-500 overflow-hidden">
          <div className="p-4 bg-green-50 border-b border-green-100">
            <h2 className="text-lg font-bold text-green-800">{t('dashboard.best_attendance')} - {t('common.quranic')}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topStudents.attendance.filter(s => s.type !== 'Theory').length === 0 ? (
              <p className="p-6 text-center text-gray-500">No data available</p>
            ) : (
              topStudents.attendance.filter(s => s.type !== 'Theory').map((student, idx) => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.class}</p>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm">
                    {student.present_count} {t('attendance.present')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performance List - Quranic */}
        <div className="card border-t-4 border-primary-500 overflow-hidden">
          <div className="p-4 bg-primary-50 border-b border-primary-100">
            <h2 className="text-lg font-bold text-primary-800">{t('dashboard.best_performance')} - {t('common.quranic')}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topStudents.performance.filter(s => s.type !== 'Theory').length === 0 ? (
              <p className="p-6 text-center text-gray-500">No data available</p>
            ) : (
              topStudents.performance.filter(s => s.type !== 'Theory').map((student, idx) => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.class}</p>
                    </div>
                  </div>
                  <div className="text-primary-600 font-bold bg-primary-50 px-3 py-1 rounded-full text-sm">
                    {student.progress_count} {t('common.logs')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Top Attendance List - Theory */}
        <div className="card border-t-4 border-indigo-500 overflow-hidden">
          <div className="p-4 bg-indigo-50 border-b border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-800">{t('dashboard.best_attendance')} - {t('common.theoric')}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topStudents.attendance.filter(s => s.type === 'Theory').length === 0 ? (
              <p className="p-6 text-center text-gray-500">No data available</p>
            ) : (
              topStudents.attendance.filter(s => s.type === 'Theory').map((student, idx) => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.class}</p>
                    </div>
                  </div>
                  <div className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-sm">
                    {student.present_count} {t('attendance.present')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performance List - Theory */}
        <div className="card border-t-4 border-purple-500 overflow-hidden">
          <div className="p-4 bg-purple-50 border-b border-purple-100">
            <h2 className="text-lg font-bold text-purple-800">{t('dashboard.best_performance')} - {t('common.theoric')}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topStudents.performance.filter(s => s.type === 'Theory').length === 0 ? (
              <p className="p-6 text-center text-gray-500">No data available</p>
            ) : (
              topStudents.performance.filter(s => s.type === 'Theory').map((student, idx) => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.class}</p>
                    </div>
                  </div>
                  <div className="text-purple-600 font-bold bg-purple-50 px-3 py-1 rounded-full text-sm">
                    {student.progress_count} {t('common.logs')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Rated List - Quranic */}
        <div className="card border-t-4 border-yellow-500 overflow-hidden">
          <div className="p-4 bg-yellow-50 border-b border-yellow-100">
            <h2 className="text-lg font-bold text-yellow-800">{t('dashboard.best_rated') || 'Best Rated'} - {t('common.quranic')}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topStudents.rated?.length === 0 ? (
              <p className="p-6 text-center text-gray-500">{t('common.no_results')}</p>
            ) : (
              topStudents.rated?.map((student, idx) => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.class}</p>
                    </div>
                  </div>
                  <div className="text-yellow-600 font-bold bg-yellow-50 px-3 py-1 rounded-full text-sm">
                    {student.avg_rating} ⭐
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherStatistics;
