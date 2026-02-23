import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { BookOpen, Users } from 'lucide-react';

const TeacherClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        const res = await api.get('/classes'); // The backend endpoint handles filtering based on token roles
        setClasses(res.data);
      } catch (error) {
        toast.error('Failed to load your classes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyClasses();
  }, []);

  if (loading) return <div className="p-8">Loading your classes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="card p-6 flex flex-col items-start border-l-4 border-l-secondary-500">
            <div className={`p-3 rounded-xl mb-4 ${cls.type === 'Quran' ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-600'}`}>
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{cls.class_name}</h3>
            <p className="text-sm text-gray-500 mt-1 capitalize">Type: {cls.type}</p>
            
            <div className="mt-6 flex items-center text-sm font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-lg w-full">
              <Users size={18} className="mr-2 text-gray-400" />
              {/* In a complete app, we would include an enrollments count in the class fetch */}
              Students Enrolled
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full card p-12 text-center text-gray-500">
            You are not assigned to any classes yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherClasses;
