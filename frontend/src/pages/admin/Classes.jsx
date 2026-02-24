import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, BookOpen, Edit2 } from 'lucide-react';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ class_name: '', type: 'Quran', teacher_id: '' });

  const fetchData = async () => {
    try {
      const [classRes, userRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users')
      ]);
      setClasses(classRes.data);
      setTeachers(userRes.data);
    } catch (error) {
      toast.error('Failed to load data');
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
        teacher_id: cls.teacher_id || '' 
      });
    } else {
      setEditingId(null);
      setFormData({ class_name: '', type: 'Quran', teacher_id: '' });
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
        toast.success('Class updated successfully');
      } else {
        await api.post('/classes', payload);
        toast.success('Class created successfully');
      }
      
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class? This will permanently delete all related enrollments, attendance, and progress records.')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class and related data deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  if (loading) return <div className="p-8">Loading classes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
        <button 
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Create Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="card p-6 flex flex-col items-start relative group transition-all hover:shadow-md">
            <div className={`p-3 rounded-xl mb-4 ${cls.type === 'Quran' ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-600'}`}>
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{cls.class_name}</h3>
            <p className="text-sm text-gray-500 mt-1 capitalize">Type: {cls.type}</p>
            <div className="mt-2 text-sm">
              <span className="text-gray-500">Teacher: </span>
              <span className={`font-medium ${cls.teacher ? 'text-gray-900' : 'text-amber-600 italic'}`}>
                {cls.teacher ? cls.teacher.name : 'Unassigned'}
              </span>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
              <button 
                onClick={() => openModal(cls)}
                className="bg-white rounded-full p-2 shadow-sm border border-gray-100 text-gray-400 hover:text-primary-600 hover:border-primary-100"
                title="Edit Class"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(cls.id)}
                className="bg-white rounded-full p-2 shadow-sm border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-100"
                title="Delete Class"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full card p-12 text-center text-gray-500">
            No classes found. Create one to get started.
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
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                  {editingId ? 'Edit Class' : 'Create New Class'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class Name</label>
                    <input type="text" required className="mt-1 input-field" value={formData.class_name} onChange={(e) => setFormData({...formData, class_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class Type</label>
                    <select className="mt-1 input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="Quran">Quran</option>
                      <option value="Theory">Theory</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assign Teacher</label>
                    <select className="mt-1 input-field" value={formData.teacher_id} onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}>
                      <option value="">No Teacher (Unassigned)</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Classes can exist without an assigned teacher.</p>
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-4">
                    <button type="submit" className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                      {editingId ? 'Save Changes' : 'Create Class'}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                      Cancel
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
