import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, GraduationCap, FileCheck } from 'lucide-react';

const Students = () => {
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
      toast.error('Failed to load data');
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
      toast.success('Student created successfully');
      setShowAddModal(false);
      setFormData({ name: '', contact_info: '', parent_info: '', date_of_birth: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create student');
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enrollments', {
        student_id: parseInt(enrollData.student_id),
        class_id: parseInt(enrollData.class_id)
      });
      toast.success('Student enrolled successfully');
      setShowEnrollModal(false);
      setEnrollData({ student_id: '', class_id: '' });
      fetchData(); // Refresh to see new enrollments
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enroll student');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student and all related records?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  if (loading) return <div className="p-8">Loading students...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowEnrollModal(true)}
            className="btn-primary bg-secondary-600 hover:bg-secondary-700 focus:ring-secondary-500 flex items-center gap-2"
          >
            <FileCheck size={18} />
            Enroll Student
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      <div className="card shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">DOB: {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.contact_info || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{student.parent_info || 'N/A'}</div>
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
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No students found.</td>
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
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">Add New Student</h3>
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" required className="mt-1 input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Info</label>
                    <input type="text" className="mt-1 input-field" value={formData.contact_info} onChange={(e) => setFormData({...formData, contact_info: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent/Guardian Info</label>
                    <input type="text" className="mt-1 input-field" value={formData.parent_info} onChange={(e) => setFormData({...formData, parent_info: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input type="date" className="mt-1 input-field" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-4">
                    <button type="submit" className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm">
                      Save Student
                    </button>
                    <button type="button" onClick={() => setShowAddModal(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                      Cancel
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
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Enroll in Class</h3>
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Select Student</label>
                    <select required className="mt-1 input-field" value={enrollData.student_id} onChange={(e) => setEnrollData({...enrollData, student_id: e.target.value})}>
                      <option value="" disabled>Select a student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Select Class</label>
                    <select required className="mt-1 input-field" value={enrollData.class_id} onChange={(e) => setEnrollData({...enrollData, class_id: e.target.value})}>
                      <option value="" disabled>Select a class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name} ({c.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-4">
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-secondary-600 text-base font-medium text-white hover:bg-secondary-700 sm:ml-3 sm:w-auto sm:text-sm">
                      Enroll
                    </button>
                    <button type="button" onClick={() => setShowEnrollModal(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
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

export default Students;
