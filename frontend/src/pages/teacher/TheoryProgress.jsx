import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  ChevronLeft, 
  Search, 
  CheckCircle2, 
  Save,
  Book,
  FileText,
  StickyNote,
  UserCheck,
  XCircle,
  Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

const TheoryProgress = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [lessonLog, setLessonLog] = useState({
    topic_name: '',
    pages_read: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, progressRes, attendanceRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get(`/progress/class/${classId}/date/${selectedDate}`),
        api.get(`/attendance/${classId}/${selectedDate}`)
      ]);
      
      setClassData(classRes.data);
      setEnrollments(classRes.data.enrollments || []);
      
      // Handle Lesson Log
      if (progressRes.data && !Array.isArray(progressRes.data)) {
        setLessonLog({
          topic_name: progressRes.data.topic_name || '',
          pages_read: progressRes.data.pages_read || '',
          notes: progressRes.data.notes || ''
        });
      } else {
        setLessonLog({ topic_name: '', pages_read: '', notes: '' });
      }

      // Handle Attendance
      const existingAtt = attendanceRes.data;
      const initialAttendance = (classRes.data.enrollments || []).map(e => {
        const record = existingAtt.find(a => a.enrollment_id === e.id);
        return {
          enrollment_id: e.id,
          student_name: e.student.name,
          status: record ? record.status : 'Absent',
          enrollmentStatus: e.status
        };
      });
      setAttendance(initialAttendance);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('progress.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId, selectedDate]);

  const toggleAttendance = (index) => {
    const newAtt = [...attendance];
    const statusCycle = ['Present', 'Absent', 'Excused'];
    const currentIndex = statusCycle.indexOf(newAtt[index].status);
    newAtt[index].status = statusCycle[(currentIndex + 1) % statusCycle.length];
    setAttendance(newAtt);
  };

  const handleSaveAll = async () => {
    if (!lessonLog.topic_name) {
      toast.error(t('progress.fill_fields_error'));
      return;
    }

    setSaving(true);
    try {
      // 1. Save Lesson Log
      await api.post('/progress/theory', {
        class_id: Number(classId),
        date: selectedDate,
        ...lessonLog
      });

      // 2. Save Attendance
      await api.post('/attendance', {
        date: selectedDate,
        attendanceList: attendance.map(a => ({
          enrollment_id: a.enrollment_id,
          status: a.status
        }))
      });

      toast.success(t('progress.theory.save_success'));
      fetchData(); // Refresh
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(t('progress.log_error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>;
  if (!classData) return <div className="p-8 text-center text-gray-500">{t('common.none')}</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/teacher')}
            className={`p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600 ${isRTL ? 'rotate-180' : ''}`}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classData.class_name}</h1>
            <p className="text-sm text-gray-500">{t('progress.theory.title')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field max-w-[160px]"
          />
          <button 
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? t('attendance.saving') : t('attendance.save_all')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lesson Log Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Book className="text-primary-500" size={20} />
              {t('progress.theory.title')}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">{t('progress.theory.book')}</label>
                <div className="text-sm font-bold text-indigo-700">{classData.book_title || t('common.unassigned')}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('progress.theory.topic')}</label>
                <input 
                  type="text"
                  value={lessonLog.topic_name}
                  onChange={(e) => setLessonLog({...lessonLog, topic_name: e.target.value})}
                  className="input-field"
                  placeholder={t('progress.theory.placeholder_topic')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('progress.theory.pages')}</label>
                <input 
                  type="number"
                  value={lessonLog.pages_read}
                  onChange={(e) => setLessonLog({...lessonLog, pages_read: e.target.value})}
                  className="input-field"
                  placeholder={t('progress.theory.placeholder_pages')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('progress.theory.notes')}</label>
                <textarea 
                  value={lessonLog.notes}
                  onChange={(e) => setLessonLog({...lessonLog, notes: e.target.value})}
                  className="input-field min-h-[120px] py-3 text-sm"
                  placeholder={t('progress.theory.notes')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="text-secondary-500" size={20} />
                {t('attendance.register_title')}
              </h3>
              <div className="text-xs font-bold text-gray-400">
                {attendance.filter(a => a.status === 'Present').length} / {attendance.length} {t('attendance.present')}
              </div>
            </div>
            
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {attendance.map((student, index) => {
                const isDisabled = student.enrollmentStatus === 'Disabled';
                return (
                  <div key={student.enrollment_id} className={`p-4 flex items-center justify-between transition-colors ${isDisabled ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDisabled ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {student.student_name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>{student.student_name}</span>
                        {isDisabled && (
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">
                            {t('common.disabled')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      disabled={isDisabled}
                      onClick={() => toggleAttendance(index)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border-none' :
                        student.status === 'Present' ? 'bg-green-100 text-green-700 shadow-sm shadow-green-100' :
                        student.status === 'Absent' ? 'bg-red-100 text-red-700 shadow-sm shadow-red-100' :
                        'bg-amber-100 text-amber-700 shadow-sm shadow-amber-100'
                      }`}
                    >
                      {student.status === 'Present' ? <CheckCircle2 size={14} /> : 
                       student.status === 'Absent' ? <XCircle size={14} /> : 
                       <Clock size={14} />}
                      {t(`attendance.${student.status.toLowerCase()}`)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheoryProgress;
