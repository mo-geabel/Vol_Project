import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, BookOpen, Edit2, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Classes = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ class_name: '', type: 'Quran', teacher_id: '', book_title: '' });

  const fetchData = async () => {
    try {
      const [classRes, userRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users')
      ]);
      setClasses(classRes.data);
      setTeachers(userRes.data);
    } catch (error) {
      toast.error(t('classes.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (cls = null) => {
    if (cls) {
      setEditingId(cls.id);
      setFormData({ 
        class_name: cls.class_name, 
        type: cls.type, 
        teacher_id: cls.teacher_id || '',
        book_title: cls.book_title || '' 
      });
    } else {
      setEditingId(null);
      setFormData({ class_name: '', type: 'Quran', teacher_id: '', book_title: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : null
      };

      if (editingId) {
        await api.put(`/classes/${editingId}`, payload);
        toast.success(t('classes.update_success'));
      } else {
        await api.post('/classes', payload);
        toast.success(t('classes.create_success'));
      }
      
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('classes.action_failed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('classes.delete_confirm'))) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success(t('classes.delete_success'));
      fetchData();
    } catch (error) {
      toast.error(t('classes.delete_error'));
    }
  };

  if (loading) return <div className="p-8">{t('classes.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('classes.title')}</h1>
        <button 
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          {t('classes.create_class')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="card p-6 flex flex-col items-start relative group transition-all hover:shadow-md">
            <div className={`p-3 rounded-xl mb-4 ${cls.type === 'Quran' ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-600'}`}>
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{cls.class_name}</h3>
            <p className="text-sm text-gray-500 mt-1 capitalize">{t('common.type')}: {cls.type === 'Quran' ? t('classes.quran') : t('classes.theory')}</p>
            <div className="mt-2 text-sm">
              <span className="text-gray-500">{t('common.teacher')}: </span>
              <span className={`font-medium ${cls.teacher ? 'text-gray-900' : 'text-amber-600 italic'}`}>
                {cls.teacher ? cls.teacher.name : t('common.unassigned')}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2 w-full">
              <button 
                onClick={() => navigate(`/teacher/attendance?classId=${cls.id}&autoSearch=true`)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors"
                title={t('classes.mark_attendance')}
              >
                <CheckCircle2 size={14} />
                {t('classes.mark_attendance')}
              </button>
              <button 
                onClick={() => navigate(cls.type === 'Quran' ? `/teacher/quran/${cls.id}` : `/teacher/theory/${cls.id}`)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-primary-50 text-primary-700 rounded-xl text-xs font-bold hover:bg-primary-100 transition-colors"
                title={t('classes.record_progress')}
              >
                <TrendingUp size={14} />
                {t('classes.record_progress')}
              </button>
            </div>
            
            <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all`}>
              <button 
                onClick={() => openModal(cls)}
                className="bg-white rounded-full p-2 shadow-sm border border-gray-100 text-gray-400 hover:text-primary-600 hover:border-primary-100"
                title={t('common.edit')}
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(cls.id)}
                className="bg-white rounded-full p-2 shadow-sm border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-100"
                title={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full card p-12 text-center text-gray-500">
            {t('classes.no_classes')}
          </div>
        )}
      </div>

      {/* Class Modal (Create/Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/20 transition-opacity" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className={`text-lg leading-6 font-medium text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`} id="modal-title">
                  {editingId ? t('classes.edit_class') : t('classes.add_new_class')}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('classes.class_name')}</label>
                    <input type="text" required className="mt-1 input-field" value={formData.class_name} onChange={(e) => setFormData({...formData, class_name: e.target.value})} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('classes.class_type')}</label>
                    <select className="mt-1 input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="Quran">{t('classes.quran')}</option>
                      <option value="Theory">{t('classes.theory')}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('classes.assign_teacher')}</label>
                    <select className="mt-1 input-field" value={formData.teacher_id} onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}>
                      <option value="">{t('classes.no_teacher')}</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                      ))}
                    </select>
                  </div>

                  {formData.type === 'Theory' && (
                    <div>
                      <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('progress.theory.book')}</label>
                      <input 
                        type="text" 
                        className="mt-1 input-field" 
                        value={formData.book_title} 
                        onChange={(e) => setFormData({...formData, book_title: e.target.value})} 
                        placeholder={t('progress.theory.placeholder_book')}
                      />
                    </div>
                  )}
                  
                  <div className={`mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-4 ${isRTL ? 'sm:space-x-reverse' : ''}`}>
                    <button type="submit" className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                      {editingId ? t('common.save') : t('classes.create_class')}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
