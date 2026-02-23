import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Search, Save } from 'lucide-react';
import { format } from 'date-fns';

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [studentsConfig, setStudentsConfig] = useState([]); // List of students for selected class alongside their attendance state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load teacher's classes initially
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data);
      } catch (error) {
        toast.error('Failed to load classes');
      }
    };
    fetchClasses();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!selectedClass || !date) return toast.error('Please select a class and date');
    
    setLoading(true);
    try {
      // 1. Get enrollments for this class
      const enrollmentsRes = await api.get('/enrollments');
      const classEnrollments = enrollmentsRes.data.filter(e => e.class_id === parseInt(selectedClass) && e.status === 'Active');
      
      // 2. Get existing attendance for this class/date
      const attendanceRes = await api.get(`/attendance/class/${selectedClass}/date/${date}`);
      const existingAttendance = attendanceRes.data;

      // 3. Map to a unified state format
      const mapped = classEnrollments.map(enrollment => {
        const existingRec = existingAttendance.find(a => a.enrollment_id === enrollment.id);
        return {
          enrollment_id: enrollment.id,
          student_name: enrollment.student.name,
          status: existingRec ? existingRec.status : 'Present' // Default to present for quick marking
        };
      });
      
      setStudentsConfig(mapped);
    } catch (error) {
      toast.error('Failed to load attendance info');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendanceStatus = (index) => {
    const nextStatusMap = {
      'Present': 'Absent',
      'Absent': 'Excused',
      'Excused': 'Present'
    };
    
    const newConfig = [...studentsConfig];
    newConfig[index].status = nextStatusMap[newConfig[index].status];
    setStudentsConfig(newConfig);
  };

  const handleSave = async () => {
    if (studentsConfig.length === 0) return;
    setSaving(true);
    try {
      // The backend expects: { date, attendanceList: [{enrollment_id, status}] }
      const payload = {
        date,
        attendanceList: studentsConfig.map(s => ({
          enrollment_id: s.enrollment_id,
          status: s.status
        }))
      };

      await api.post('/attendance', payload);
      toast.success('Attendance successfully saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
      </div>

      <div className="card p-6 border border-gray-100">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select required className="input-field" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="" disabled>Choose a class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" required className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto h-10 mt-auto">
            <Search size={18} className="mr-2" />
            {loading ? 'Loading...' : 'Load Register'}
          </button>
        </form>
      </div>

      {studentsConfig.length > 0 && (
        <div className="card shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Student Register
            </h3>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="btn-primary bg-secondary-600 hover:bg-secondary-700 focus:ring-secondary-500 py-1.5 px-3"
            >
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
          <ul className="divide-y divide-gray-200">
            {studentsConfig.map((student, index) => (
              <li key={student.enrollment_id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                <button 
                  onClick={() => toggleAttendanceStatus(index)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white focus:outline-none transition-colors w-32 justify-center
                    ${student.status === 'Present' ? 'bg-green-600 hover:bg-green-700' : 
                      student.status === 'Absent' ? 'bg-red-600 hover:bg-red-700' : 
                      'bg-orange-500 hover:bg-orange-600'}`}
                >
                  {student.status === 'Present' && <CheckCircle size={16} className="mr-2" />}
                  {student.status === 'Absent' && <XCircle size={16} className="mr-2" />}
                  {student.status === 'Excused' && <XCircle size={16} className="mr-2" />}
                  {student.status}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedClass && !loading && studentsConfig.length === 0 && (
        <div className="p-8 text-center text-gray-500 card">
          Click "Load Register" to see students for this date.
        </div>
      )}
    </div>
  );
};

export default Attendance;
