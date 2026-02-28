import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  ShieldCheck, 
  RefreshCcw, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus,
  ArrowRightLeft,
  Search,
  UserMinus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Compliance = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [threshold, setThreshold] = useState(60);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Disabled'
  
  // Default to January 2026 to show seeded data
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2026);

  const fetchOversight = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/enrollments/oversight?year=${selectedYear}&month=${selectedMonth}`);
      setData(res.data.data);
      setThreshold(res.data.threshold);
    } catch (error) {
      console.error('Error fetching oversight:', error);
      toast.error(t('common.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOversight();
  }, [selectedMonth, selectedYear]);

  const handleReactivate = async (id) => {
    try {
      await api.put(`/enrollments/${id}`, { status: 'Active' });
      toast.success(t('compliance.reactivate_success'));
      fetchOversight();
    } catch (error) {
      toast.error(t('compliance.reactivate_error'));
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm(t('compliance.deactivate_confirm') || 'Are you sure you want to deactivate this student?')) return;
    try {
      await api.put(`/enrollments/${id}`, { status: 'Disabled' });
      toast.success(t('compliance.deactivate_success') || 'Student deactivated successfully');
      fetchOversight();
    } catch (error) {
      toast.error(t('compliance.deactivate_error') || 'Failed to deactivate student');
    }
  };

  const filteredData = data
    .filter(item => {
      const matchesSearch = item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.className.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Priority 1: Disabled students first
      if (a.status === 'Disabled' && b.status !== 'Disabled') return -1;
      if (a.status !== 'Disabled' && b.status === 'Disabled') return 1;
      
      // Priority 2: Within same status, group by class
      if (a.className !== b.className) return a.className.localeCompare(b.className);
      
      // Priority 3: Within same class, sort by student name
      return a.studentName.localeCompare(b.studentName);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-secondary-600" />
            {t('compliance.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('compliance.subtitle')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Month/Year Selectors */}
          <div className="flex items-center gap-2">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="select-field py-2"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>
                  {t(`common.months.${['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][m-1]}`)}
                </option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="select-field py-2"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={t('common.search')}
              className="input padding-inline-start-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute inset-inline-start-3 top-2.5 text-gray-400" size={18} />
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            {['All', 'Active', 'Disabled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${statusFilter === status ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {status === 'All' ? t('common.all') : status === 'Active' ? t('common.active') : t('common.disabled')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-s-4 border-primary-500 bg-white shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('settings.threshold_label')}</p>
            <ShieldCheck className="text-primary-500" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-900">{threshold}%</p>
          <p className="text-xs text-gray-400 mt-2">{t('settings.auto_enforcement_desc')}</p>
        </div>

        <div className="card p-6 border-s-4 border-amber-500 bg-white shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('compliance.grace_period')}</p>
            <UserPlus className="text-amber-500" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-900">
            {data.filter(i => i.isGracePeriod).length}
          </p>
          <p className="text-xs text-gray-400 mt-2">{t('compliance.rule_applied_nextMonth') || 'Active from next month'}</p>
        </div>

        <div className="card p-6 border-s-4 border-red-500 bg-white shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('compliance.threshold_warning')}</p>
            <AlertCircle className="text-red-500" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-900">
            {data.filter(i => i.isOverThreshold).length}
          </p>
          <p className="text-xs text-gray-400 mt-2">{t('compliance.action_required') || 'Disciplinary action pending'}</p>
        </div>
      </div>

      <div className="card shadow-sm border border-gray-100 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t('compliance.student')}</th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t('compliance.class')}</th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t('compliance.active_days')}</th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t('compliance.absences')}</th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t('compliance.percentage')}</th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t('compliance.status')}</th>
                <th className={`px-6 py-3 ${isRTL ? 'text-left' : 'text-right'} text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t('compliance.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{item.studentName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{item.className}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.activeDays}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.absentCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${Number(item.percentage) > threshold ? 'bg-red-500' : 'bg-primary-500'}`}
                            style={{ width: `${Math.min(Number(item.percentage), 100)}%` }}
                          />
                       </div>
                       <span className={`text-xs font-black ${Number(item.percentage) > threshold ? 'text-red-600' : 'text-primary-600'}`}>
                        {item.percentage}%
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {item.isGracePeriod ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 italic">
                          {t('compliance.grace_period')}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                          {item.status === 'Active' ? t('common.active') : t('common.disabled')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isRTL ? 'text-left' : 'text-right'}`}>
                    {item.status === 'Disabled' && (
                      <button
                        onClick={() => handleReactivate(item.id)}
                        className="btn-primary py-1 px-3 text-xs bg-green-600 hover:bg-green-700 flex items-center gap-1 shadow-sm w-full justify-center"
                        title={t('compliance.reactivate')}
                      >
                        <RefreshCcw size={14} />
                        {t('compliance.reactivate')}
                      </button>
                    )}
                    {item.status === 'Active' && !item.isGracePeriod && (
                      <button
                        onClick={() => handleDeactivate(item.id)}
                        className="btn-primary py-1 px-3 text-xs bg-red-600 hover:bg-red-700 flex items-center gap-1 shadow-sm w-full justify-center"
                        title={t('compliance.deactivate') || 'Deactivate'}
                      >
                        <UserMinus size={14} />
                        {t('compliance.deactivate') || 'Deactivate'}
                      </button>
                    )}
                    {item.isGracePeriod && (
                      <div className="flex items-center justify-center text-amber-500 w-full py-1 gap-1 font-bold text-xs bg-amber-50 rounded-lg">
                         <UserPlus size={14} />
                         {t('compliance.grace_period_active') || 'Protected'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                       <ArrowRightLeft className="text-gray-300" size={48} />
                       <p>{t('common.no_results')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Compliance;
