import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, GraduationCap, FileCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Students = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', contact_info: '', parent_info: '', date_of_birth: '' });
  const [enrollData, setEnrollData] = useState({ student_id: '', class_id: '' });

  const fetchData = async () => {
    try {
      const [studentRes, classRes] = await Promise.all([
        api.get('/students'),
        api.get('/classes')
      ]);
      setStudents(studentRes.data);
      setClasses(classRes.data);
    } catch (error) {
      toast.error(t('students.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.date_of_birth) delete payload.date_of_birth;
      
      await api.post('/students', payload);
      toast.success(t('students.create_success'));
      setShowAddModal(false);
      setFormData({ name: '', contact_info: '', parent_info: '', date_of_birth: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('students.create_error'));
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enrollments', {
        student_id: parseInt(enrollData.student_id),
        class_id: parseInt(enrollData.class_id)
      });
      toast.success(t('students.enroll_success'));
      setShowEnrollModal(false);
      setEnrollData({ student_id: '', class_id: '' });
      fetchData(); // Refresh to see new enrollments
    } catch (error) {
      toast.error(error.response?.data?.message || t('students.enroll_error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('students.delete_confirm'))) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success(t('students.delete_success'));
      fetchData();
    } catch (error) {
      toast.error(t('students.delete_error'));
    }
  };

  if (loading) return <div className="p-8">{t('students.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('students.title')}</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowEnrollModal(true)}
            className="btn-primary bg-secondary-600 hover:bg-secondary-700 focus:ring-secondary-500 flex items-center gap-2"
          >
            <FileCheck size={18} />
            {t('students.enroll_student')}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            {t('students.add_student')}
          </button>
        </div>
      </div>

      <div className="card shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('common.name')}</th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('common.contact')}</th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('common.enrollments_list')}</th>
                <th className={`px-6 py-3 ${isRTL ? 'text-left' : 'text-right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <GraduationCap size={20} />
                      </div>
                      <div className={isRTL ? 'mr-4' : 'ml-4'}>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{t('students.dob_label', { date: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString(i18n.language) : 'N/A' })}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.contact_info || t('common.none')}</div>
                    <div className="text-sm text-gray-500">{student.parent_info || t('common.none')}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2">
                      {student.enrollments?.map(e => (
                        <span key={e.id} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          e.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {e.class?.class_name || `Class ID ${e.class_id}`}
                        </span>
                      ))}
                      {(!student.enrollments || student.enrollments.length === 0) && (
                        <span className="text-gray-400 italic">{t('common.none')}</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'} text-sm font-medium`}>
                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">{t('students.no_students')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/20 transition-opacity" onClick={() => setShowAddModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className={`text-lg leading-6 font-medium text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`} id="modal-title">{t('students.add_new_student')}</h3>
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('students.full_name')}</label>
                    <input type="text" required className="mt-1 input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('students.contact_info')}</label>
                    <input type="text" className="mt-1 input-field" value={formData.contact_info} onChange={(e) => setFormData({...formData, contact_info: e.target.value})} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('students.parent_info')}</label>
                    <input type="text" className="mt-1 input-field" value={formData.parent_info} onChange={(e) => setFormData({...formData, parent_info: e.target.value})} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('students.dob')}</label>
                    <input type="date" className="mt-1 input-field" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} />
                  </div>
                  <div className={`mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-4 ${isRTL ? 'sm:space-x-reverse' : ''}`}>
                    <button type="submit" className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm">
                      {t('students.save_student')}
                    </button>
                    <button type="button" onClick={() => setShowAddModal(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/20 transition-opacity" onClick={() => setShowEnrollModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className={`text-lg leading-6 font-medium text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('students.enroll_in_class')}</h3>
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('students.select_student')}</label>
                    <select required className="mt-1 input-field" value={enrollData.student_id} onChange={(e) => setEnrollData({...enrollData, student_id: e.target.value})}>
                      <option value="" disabled>{t('students.placeholder_student')}</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('students.select_class')}</label>
                    <select required className="mt-1 input-field" value={enrollData.class_id} onChange={(e) => setEnrollData({...enrollData, class_id: e.target.value})}>
                      <option value="" disabled>{t('students.placeholder_class')}</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name} ({c.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className={`mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-4 ${isRTL ? 'sm:space-x-reverse' : ''}`}>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-secondary-600 text-base font-medium text-white hover:bg-secondary-700 sm:ml-3 sm:w-auto sm:text-sm">
                      {t('students.enroll_btn')}
                    </button>
                    <button type="button" onClick={() => setShowEnrollModal(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
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

export default Students;
