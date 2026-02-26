import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { BookOpen, Users, ChevronRight, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TeacherClasses = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        const res = await api.get('/classes'); // The backend endpoint handles filtering based on token roles
        setClasses(res.data);
      } catch (error) {
        toast.error(t('teacher_classes.load_error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyClasses();
  }, []);

  if (loading) return <div className="p-8 text-center text-primary-600 font-medium">{t('teacher_classes.loading')}</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('teacher_classes.title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="card p-6 flex flex-col items-start hover:shadow-lg transition-transform hover:-translate-y-1 border-inline-start-4 border-secondary-500">
            <div className={`p-3 rounded-xl mb-4 ${cls.type === 'Quran' ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-600'}`}>
              {cls.type === 'Quran' ? <BookOpen size={24} /> : <GraduationCap size={24} />}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{cls.class_name}</h3>
            <p className="text-sm text-gray-500 mt-1 capitalize">{t('teacher_classes.type_label', { type: cls.type === 'Quran' ? t('common.quranic') : t('common.theoric') })}</p>
            
            <Link 
              to={cls.type === 'Quran' ? `/teacher/quran/${cls.id}` : `/teacher/theory/${cls.id}`}
              className="mt-6 flex items-center justify-between text-sm font-bold text-gray-600 bg-gray-50 hover:bg-primary-50 hover:text-primary-600 px-4 py-3 rounded-xl w-full transition-all group"
            >
              <div className="flex items-center">
                <Users size={18} className="margin-inline-end-2" />
                {t('teacher_classes.track_progress')}
              </div>
              <ChevronRight size={16} className={`transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </Link>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full card p-12 text-center text-gray-400 font-bold italic bg-gray-50 border-2 border-dashed border-gray-200">
            {t('teacher_classes.no_classes')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherClasses;
