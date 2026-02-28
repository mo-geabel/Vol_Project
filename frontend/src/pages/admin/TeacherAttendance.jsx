import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Save, Calendar, Check, X, AlertCircle, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

const TeacherAttendance = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher-attendance/${date}`);
      setTeachers(response.data);
    } catch (error) {
      toast.error(t('teacher_attendance.load_error') || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const handleStatusChange = (teacherId, status) => {
    setTeachers(teachers.map(t => 
      t.id === teacherId ? { ...t, status } : t
    ));
  };

  const handleNoteChange = (teacherId, notes) => {
    setTeachers(teachers.map(t => 
      t.id === teacherId ? { ...t, notes } : t
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/teacher-attendance', {
        date,
        attendanceList: teachers
      });
      toast.success(t('teacher_attendance.save_success'));
      fetchAttendance();
    } catch (error) {
      toast.error(t('teacher_attendance.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const response = await api.get(`/teacher-attendance/history/${teacher.id}`);
      setHistoryRecords(response.data);
    } catch (error) {
      toast.error(t('common.load_error') || 'Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('teacher_attendance.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('dashboard.admin_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
          <Calendar size={18} className="text-primary-500" />
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="border-none focus:ring-0 text-sm font-bold text-gray-700"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" dir={isRTL ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className={`px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('common.name')}
                </th>
                <th className={`px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center`}>
                  {t('common.status')}
                </th>
                <th className={`px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('teacher_attendance.notes')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center text-gray-400 italic">
                    {t('teacher_attendance.loading')}
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center text-gray-400 italic">
                    {t('users.no_users')}
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900">{teacher.name}</div>
                        <button
                          onClick={() => handleViewHistory(teacher)}
                          className={`p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ms-2`}
                          title={t('common.history') || 'View History'}
                        >
                          <History size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStatusChange(teacher.id, 'Present')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            teacher.status === 'Present' 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'
                          }`}
                        >
                          <Check size={14} />
                          {t('teacher_attendance.present')}
                        </button>
                        <button
                          onClick={() => handleStatusChange(teacher.id, 'Absent')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            teacher.status === 'Absent' 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'
                          }`}
                        >
                          <X size={14} />
                          {t('teacher_attendance.absent')}
                        </button>
                        <button
                          onClick={() => handleStatusChange(teacher.id, 'Excused')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            teacher.status === 'Excused' 
                              ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                              : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'
                          }`}
                        >
                          <AlertCircle size={14} />
                          {t('teacher_attendance.excused')}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={teacher.notes || ''}
                        onChange={(e) => handleNoteChange(teacher.id, e.target.value)}
                        placeholder={t('teacher_attendance.notes')}
                        className="w-full bg-transparent border-b border-transparent focus:border-primary-500 transition-colors text-sm py-1 outline-none"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-10`}>
        <button
          onClick={handleSave}
          disabled={saving || loading || teachers.length === 0}
          className="btn-primary flex items-center gap-2 px-8 py-4 rounded-2xl shadow-xl shadow-primary-200 hover:scale-105 active:scale-95 transition-all text-base font-black uppercase tracking-widest"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save size={20} />
          )}
          {t('common.save')}
        </button>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/20 transition-opacity" onClick={() => setShowHistoryModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 text-start">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedTeacher?.name} - {t('common.history') || 'Attendance History'}
                  </h3>
                  <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                     <X size={20} />
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto pr-2">
                  {loadingHistory ? (
                    <div className="text-center py-8 text-gray-400">Loading...</div>
                  ) : historyRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 italic">No attendance records found.</div>
                  ) : (
                    <div className="space-y-3">
                      {historyRecords.map(record => (
                        <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${record.status === 'Present' ? 'bg-green-100/50 text-green-700' : record.status === 'Absent' ? 'bg-red-100/50 text-red-700' : 'bg-amber-100/50 text-amber-700'}`}>
                               {record.status === 'Present' ? <Check size={16} /> : record.status === 'Absent' ? <X size={16} /> : <AlertCircle size={16} />}
                             </div>
                             <div>
                                <p className="font-bold text-sm text-gray-900">{format(new Date(record.date), 'dd MMM yyyy')}</p>
                                <p className={`text-xs font-semibold ${record.status === 'Present' ? 'text-green-600' : record.status === 'Absent' ? 'text-red-500' : 'text-amber-500'}`}>
                                  {t(`teacher_attendance.${record.status.toLowerCase()}`)}
                                </p>
                             </div>
                          </div>
                          {record.notes && (
                            <p className="text-xs text-gray-500 mt-2 sm:mt-0 sm:max-w-[50%] truncate bg-white px-2 py-1 rounded-md border border-gray-100">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;
