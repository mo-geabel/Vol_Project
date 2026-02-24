import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, GraduationCap, Edit2, Users } from 'lucide-react';

const TheoricStudents = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    contact_info: '', 
    parent_info: '', 
    date_of_birth: '',
    class_id: '' // For enrollment/reassignment
  });

  const fetchData = async () => {
    try {
      const [studentRes, classRes] = await Promise.all([
        api.get('/students'),
        api.get('/classes')
      ]);
      setStudents(studentRes.data);
      // Filter only Theory classes
      setClasses(classRes.data.filter(c => c.type === 'Theory'));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditModal = (student) => {
    setEditingStudent(student);
    // Find existing Theory enrollment if any
    const theoryEnrollment = student.enrollments?.find(e => e.class?.type === 'Theory');
    setFormData({
      name: student.name,
      contact_info: student.contact_info || '',
      parent_info: student.parent_info || '',
      date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
      class_id: theoryEnrollment ? theoryEnrollment.class_id.toString() : ''
    });
    setShowModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      const studentData = { ...formData };
      delete studentData.class_id;
      if (!studentData.date_of_birth) delete studentData.date_of_birth;

      let studentId = editingStudent?.id;

      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, studentData);
        toast.success('Student updated successfully');
      } else {
        const res = await api.post('/students', studentData);
        studentId = res.data.id;
        toast.success('Student created successfully');
      }

      // Handle Class Enrollment/Update
      const currentEnrollment = editingStudent?.enrollments?.find(e => e.class?.type === 'Theory');
      const newClassId = formData.class_id ? parseInt(formData.class_id) : null;

      if (newClassId) {
        if (currentEnrollment) {
          if (currentEnrollment.class_id !== newClassId) {
            try {
              await api.post('/enrollments', { student_id: studentId, class_id: newClassId });
            } catch (err) {
              // If already enrolled or constraint error
            }
          }
        } else {
          await api.post('/enrollments', { student_id: studentId, class_id: newClassId });
        }
      }

      setShowModal(false);
      setEditingStudent(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  if (loading) return <div className="p-8">Loading Theoric students...</div>;

  // Grouping logic
  const groupedStudents = classes.map(cls => ({
    ...cls,
    students: students.filter(s => s.enrollments?.some(e => e.class_id === cls.id))
  }));

  const unassignedStudents = students.filter(s => 
    !s.enrollments?.some(e => e.class?.type === 'Theory')
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Theoric Students</h1>
        <button 
          onClick={() => {
            setEditingStudent(null);
            setFormData({ name: '', contact_info: '', parent_info: '', date_of_birth: '', class_id: '' });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      <div className="space-y-8">
        {groupedStudents.map((group) => (
          <section key={group.id} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <Users size={20} className="text-secondary-600" />
              <h2 className="text-lg font-bold text-gray-800">{group.class_name}</h2>
              <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                {group.students.length} Students
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.students.map(student => (
                <StudentCard key={student.id} student={student} onEdit={() => openEditModal(student)} onDelete={() => handleDelete(student.id)} />
              ))}
              {group.students.length === 0 && (
                <p className="text-sm text-gray-400 italic col-span-full">No students enrolled in this class.</p>
              )}
            </div>
          </section>
        ))}

        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-orange-200 pb-2">
            <GraduationCap size={20} className="text-orange-600" />
            <h2 className="text-lg font-bold text-gray-800">Unassigned Students</h2>
            <span className="text-xs font-medium px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
              {unassignedStudents.length} Students
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unassignedStudents.map(student => (
              <StudentCard  key={student.id} student={student} onEdit={() => openEditModal(student)} onDelete={() => handleDelete(student.id)} />
            ))}
            {unassignedStudents.length === 0 && (
              <p className="text-sm text-gray-400 italic col-span-full">All students are assigned to theoric classes.</p>
            )}
          </div>
        </section>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/20 transition-opacity" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h3>
                <form onSubmit={handleSaveStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" required className="mt-1 input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Info</label>
                      <input type="text" className="mt-1 input-field" value={formData.contact_info} onChange={(e) => setFormData({...formData, contact_info: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <input type="date" className="mt-1 input-field" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent/Guardian Info</label>
                    <input type="text" className="mt-1 input-field" value={formData.parent_info} onChange={(e) => setFormData({...formData, parent_info: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assign to Theoric Class</label>
                    <select className="mt-1 input-field" value={formData.class_id} onChange={(e) => setFormData({...formData, class_id: e.target.value})}>
                      <option value="">No Class (Unassigned)</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-8 flex flex-row-reverse gap-3 border-t border-gray-100 pt-5">
                    <button type="submit" className="flex-1 px-4 py-2 bg-secondary-600 text-white rounded-xl hover:bg-secondary-700 font-medium transition-colors">
                      {editingStudent ? 'Save Changes' : 'Create Student'}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
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

const StudentCard = ({ student, onEdit, onDelete }) => (
  <div className="card p-4 flex items-center justify-between group">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center text-secondary-600 font-bold shrink-0">
        {student.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-gray-900 truncate">{student.name}</h4>
        <p className="text-xs text-gray-500 truncate">{student.contact_info || 'No contact'}</p>
      </div>
    </div>
    <div className="flex items-center gap-1 transition-opacity">
      <button onClick={onEdit} className="p-2 text-gray-400 hover:text-secondary-600 transition-colors">
        <Edit2 size={16} />
      </button>
      <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

export default TheoricStudents;
