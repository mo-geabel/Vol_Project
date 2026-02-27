import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  BookOpen, 
  ChevronLeft, 
  Search, 
  CheckCircle2, 
  History, 
  Star,
  BookMarked,
  AlertCircle,
  GraduationCap,
  Edit2,
  Phone,
  User2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';


const QuranProgress = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [surahs, setSurahs] = useState([]);
  const [dailyProgress, setDailyProgress] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Form State for logging
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [logType, setLogType] = useState('Hifz'); // 'Hifz' or 'Muraja'
  const [formData, setFormData] = useState({
    surah_id: '',
    start_verse: '',
    end_verse: '',
    rating: 5
  });
  const [submitting, setSubmitting] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({ 
    name: '', 
    date_of_birth: '',
    contact_info: '',
    parent_info: ''
  });

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchData = async () => {
    try {
      const [classRes, surahsRes, progressRes, attendanceRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get('/progress/surahs'),
        api.get(`/progress/class/${classId}/date/${selectedDate}`),
        api.get(`/attendance/${classId}/${selectedDate}`)
      ]);
      setClassData(classRes.data);
      setEnrollments(classRes.data.enrollments || []);
      setSurahs(surahsRes.data);
      setDailyProgress(progressRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('progress.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyProgress = async () => {
    try {
      const [progressRes, attendanceRes] = await Promise.all([
        api.get(`/progress/class/${classId}/date/${selectedDate}`),
        api.get(`/attendance/${classId}/${selectedDate}`)
      ]);
      setDailyProgress(progressRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Error fetching daily progress:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId, selectedDate]);

  const handleOpenLogModal = (enrollment, type) => {
    setSelectedEnrollment(enrollment);
    setLogType(type);
    setFormData({
      surah_id: '',
      start_verse: '',
      end_verse: '',
      rating: 5
    });
    setShowLogModal(true);
  };

  const handleLogProgress = async (e) => {
    e.preventDefault();
    if (!formData.surah_id || !formData.start_verse || !formData.end_verse) {
      toast.error(t('progress.fill_fields_error'));
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/progress/quran', {
        enrollment_id: selectedEnrollment.id,
        date: selectedDate,
        type: logType,
        surah_id: Number(formData.surah_id),
        start_verse: Number(formData.start_verse),
        end_verse: Number(formData.end_verse),
        rating: Number(formData.rating)
      });
      const localizedType = logType === 'Hifz' ? t('common.hifz') : t('common.muraja');
      toast.success(t('progress.log_success', { type: localizedType, name: selectedEnrollment.student.name }));
      setShowLogModal(false);
      fetchDailyProgress(); // Refresh indicators
    } catch (error) {
      console.error('Error logging progress:', error);
      toast.error(error.response?.data?.message || t('progress.log_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogNotPrepared = async (enrollment, type) => {
    try {
      setSubmitting(true);
      await api.post('/progress/not-prepared', {
        enrollment_id: enrollment.id,
        date: selectedDate,
        type: type
      });
      const label = type === 'NotPreparedHifz' ? t('common.hifz') : t('common.muraja');
      toast.success(t('progress.not_prepared_success', { name: enrollment.student.name, label }));
      setShowLogModal(false);
      fetchDailyProgress(); // Refresh indicators
    } catch (error) {
      console.error('Error logging not prepared:', error);
      toast.error(error.response?.data?.message || t('progress.log_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/students/${editingStudent.student.id}`, editFormData);
      toast.success(t('progress.update_success'));
      setShowEditStudentModal(false);
      fetchData(); // Refresh list to show updated name/age
    } catch (error) {
      toast.error(t('progress.update_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditStudentModal = (enrollment) => {
    setEditingStudent(enrollment);
    setEditFormData({
      name: enrollment.student.name,
      date_of_birth: enrollment.student.date_of_birth ? format(new Date(enrollment.student.date_of_birth), 'yyyy-MM-dd') : '',
      contact_info: enrollment.student.contact_info || '',
      parent_info: enrollment.student.parent_info || ''
    });
    setShowEditStudentModal(true);
  };

  const filteredStudents = enrollments.filter(e => {
    const isAbsent = attendance.some(a => a.enrollment_id === e.id && a.status === 'Absent');
    const matchesSearch = e.student.name.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAbsent && matchesSearch;
  });

  if (loading) return <div className="p-8">{t('common.loading')}</div>;
  if (!classData) return <div className="p-8 text-center">{t('common.none')}</div>;

  const currentSurah = surahs.find(s => s.surah_id === Number(formData.surah_id));
  const getStudentStatus = (enrollmentId) => {
    const progress = dailyProgress.filter(p => p.enrollment_id === enrollmentId);
    return {
      hasHifz: progress.some(p => p.type === 'Hifz'),
      hasMuraja: progress.some(p => p.type === 'Muraja'),
      isNotPreparedHifz: progress.some(p => p.type === 'NotPreparedHifz'),
      isNotPreparedMuraja: progress.some(p => p.type === 'NotPreparedMuraja')
    };
  };

  return (
    <div className="space-y-6">
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
            <p className="text-sm text-gray-500">{t('progress.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field max-w-[160px]"
          />
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className={`relative w-full md:max-w-md ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
          <input 
            type="text" 
            placeholder={t('progress.search_placeholder')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field padding-inline-start-10"
          />
        </div>
        <div className="text-sm text-gray-500">
          {t('progress.showing_count', { filtered: filteredStudents.length, total: enrollments.length })}
        </div>
      </div>

      {/* Student List Student Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((enrollment) => {
          const status = getStudentStatus(enrollment.id);
          return (
            <div key={enrollment.id} className="card overflow-hidden hover:shadow-lg transition-shadow bg-white flex flex-col group relative">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{enrollment.student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {enrollment.student.date_of_birth && (
                        <span className="text-[10px] bg-indigo-50 text-slate-500 px-1.5 py-0.5 rounded font-black">
                          {t('progress.age', { age: calculateAge(enrollment.student.date_of_birth) })}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded font-bold uppercase">
                        <CheckCircle2 size={10} />
                        <span>{t('progress.active')}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => openEditStudentModal(enrollment)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                    title={t('progress.edit_student')}
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
                
                {/* Status Badges */}
                <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {status.hasHifz && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-green-100 text-green-700 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <BookOpen size={10} />
                      {t('progress.hifz_signed')}
                    </span>
                  )}
                  {status.isNotPreparedHifz && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-amber-100 text-amber-700 rounded-lg border border-amber-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <AlertCircle size={10} />
                      {t('progress.unprepared_badge', { type: 'H' })}
                    </span>
                  )}
                  {status.hasMuraja && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-100 text-blue-700 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <BookOpen size={10} />
                      {t('progress.muraja_signed')}
                    </span>
                  )}
                  {status.isNotPreparedMuraja && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-amber-100 text-amber-700 rounded-lg border border-amber-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <AlertCircle size={10} />
                      {t('progress.unprepared_badge', { type: 'M' })}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex flex-col gap-3">
                <div className={`grid grid-cols-2 gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button 
                    onClick={() => handleOpenLogModal(enrollment, 'Hifz')}
                    className={`btn-primary flex items-center justify-center gap-2 py-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <BookOpen size={16} />
                    {t('progress.sign_hifz')}
                  </button>
                  <button 
                    onClick={() => handleOpenLogModal(enrollment, 'Muraja')}
                    className={`btn-secondary flex items-center justify-center gap-2 py-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <History size={16} />
                    {t('progress.sign_muraja')}
                  </button>
                </div>
                <button 
                  onClick={() => navigate(`/teacher/progress/${enrollment.id}`)}
                  className={`w-full flex items-center justify-center gap-2 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <GraduationCap size={16} />
                  {t('progress.view_history')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-6 bg-linear-to-r from-primary-600 to-primary-500 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex justify-between items-center w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="text-xl font-bold">{t('progress.log_modal_title', { type: logType === 'Hifz' ? t('common.hifz') : t('common.muraja') })}</h3>
                  <p className="text-primary-100">{selectedEnrollment?.student.name}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  {logType === 'Hifz' ? <BookOpen size={24} /> : <History size={24} />}
                </div>
              </div>
            </div>

            <form onSubmit={handleLogProgress} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('progress.surah')}</label>
                  <select 
                    required
                    value={formData.surah_id}
                    onChange={(e) => setFormData({...formData, surah_id: e.target.value, start_verse: '', end_verse: ''})}
                    className={`input-field ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    <option value="">{t('progress.select_surah')}</option>
                    {surahs.map(s => (
                      <option key={s.surah_id} value={s.surah_id}>
                        {t('progress.surah_label', { id: s.surah_id, name: t('reports.surahs.' + s.surah_id), count: s.verse_count })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`grid grid-cols-2 gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('progress.start_verse')}</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      max={currentSurah?.verse_count || 300}
                      value={formData.start_verse}
                      onChange={(e) => setFormData({...formData, start_verse: e.target.value})}
                      className="input-field"
                      placeholder={t('progress.verse_placeholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('progress.end_verse')}</label>
                    <input 
                      type="number" 
                      required
                      min={formData.start_verse || 1}
                      max={currentSurah?.verse_count || 300}
                      value={formData.end_verse}
                      onChange={(e) => setFormData({...formData, end_verse: e.target.value})}
                      className="input-field"
                      placeholder={t('progress.verse_placeholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    {t('progress.rating_label')}
                  </label>
                  <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                          formData.rating >= star 
                            ? 'bg-amber-100 text-amber-600 scale-105' 
                            : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-sm font-bold">{star}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-6">
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button 
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary"
                  >
                    {submitting ? t('progress.signing') : t('progress.confirm_sign')}
                  </button>
                </div>
                
                <button 
                  type="button"
                  onClick={() => handleLogNotPrepared(selectedEnrollment, logType === 'Hifz' ? 'NotPreparedHifz' : 'NotPreparedMuraja')}
                  className={`w-full flex items-center justify-center gap-2 py-3 border border-orange-200 text-orange-600 rounded-2xl hover:bg-orange-50 transition-colors text-sm font-bold uppercase tracking-wider ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <AlertCircle size={18} />
                  {t('progress.not_prepared')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Student Modal */}
      {showEditStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-6 bg-linear-to-r from-indigo-600 to-indigo-500 text-white ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <h3 className="text-xl font-bold">{t('progress.edit_modal_title')}</h3>
                  <p className="text-indigo-100 text-sm">{t('progress.edit_modal_subtitle')}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <GraduationCap size={24} />
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateStudent} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('progress.full_name')}</label>
                <input 
                  type="text" 
                  required 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className={`input-field ${isRTL ? 'text-right' : 'text-left'}`}
                  placeholder={t('progress.student_name_placeholder')}
                />
              </div>

              <div className={`grid grid-cols-2 gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('progress.dob')}</label>
                  <input 
                    type="date"
                    value={editFormData.date_of_birth}
                    onChange={(e) => setEditFormData({...editFormData, date_of_birth: e.target.value})}
                    className={`input-field px-3 ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
                <div>
                  <label className={`text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Phone size={14} className="text-primary-500" /> {t('progress.contact_info')}
                  </label>
                  <input 
                    type="text"
                    value={editFormData.contact_info}
                    onChange={(e) => setEditFormData({...editFormData, contact_info: e.target.value})}
                    className={`input-field ${isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={t('progress.contact_placeholder')}
                  />
                </div>
              </div>

              <div>
                <label className={`text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <User2 size={14} className="text-primary-500" /> {t('progress.parent_details')}
                </label>
                <input 
                  type="text"
                  value={editFormData.parent_info}
                  onChange={(e) => setEditFormData({...editFormData, parent_info: e.target.value})}
                  className={`input-field ${isRTL ? 'text-right' : 'text-left'}`}
                  placeholder={t('progress.parent_placeholder')}
                />
              </div>

              <div className={`flex gap-3 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button 
                  type="button" 
                  onClick={() => setShowEditStudentModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-colors text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-2 btn-primary py-3 text-sm font-bold shadow-lg shadow-primary-200"
                >
                  {submitting ? t('common.save') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuranProgress;
