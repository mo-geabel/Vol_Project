import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const AdminStatistics = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [graphs, setGraphs] = useState({ attendanceTrend: [] });
  const [topStudents, setTopStudents] = useState({ attendance: [], performance: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [graphsRes, topRes] = await Promise.all([
          api.get('/admin/graphs'),
          api.get('/admin/top-students')
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

  if (loading) return <div className="p-8 text-center text-primary-600 font-medium">Loading Statistics...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('common.statistics')}</h1>
      
      {/* Attendance Trend Chart */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">{t('dashboard.attendance_trend')}</h2>
        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graphs.attendanceTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attendance List */}
        <div className="card border-t-4 border-green-500 overflow-hidden">
          <div className="p-4 bg-green-50 border-b border-green-100">
            <h2 className="text-lg font-bold text-green-800">{t('dashboard.best_attendance')}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topStudents.attendance.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No data available</p>
            ) : (
              topStudents.attendance.map((student, idx) => (
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

        {/* Top Performance List */}
        <div className="card border-t-4 border-primary-500 overflow-hidden">
          <div className="p-4 bg-primary-50 border-b border-primary-100">
            <h2 className="text-lg font-bold text-primary-800">{t('dashboard.best_performance')}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topStudents.performance.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No data available</p>
            ) : (
              topStudents.performance.map((student, idx) => (
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
                    {student.progress_count} Logs
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

export default AdminStatistics;
