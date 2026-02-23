import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Plus, Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Format: "YYYY-MM" for input type="month"
  const currentMonthYear = format(new Date(), 'yyyy-MM');
  const [formData, setFormData] = useState({ 
    month_year: currentMonthYear, 
    weekend_config: [5, 6] // Default Fri, Sat
  });

  const fetchSchedules = async () => {
    try {
      // Just fetching the month of the current selected generic form for now
      // Or we can list all available schedules. Given the backend API we created:
      // GET /schedules/:month_year
      // We don't have a "get all schedules endpoint" so we will just display the selected one
      const res = await api.get(`/schedules/${formData.month_year}`);
      setSchedules([res.data]); // Wrapping in array for table mapping
    } catch (error) {
      if(error.response?.status === 404) {
        setSchedules([]); // None found
      } else {
        toast.error('Failed to load schedule');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [formData.month_year]); // Refetch when month changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/schedules', formData);
      toast.success('Schedule configured successfully');
      setShowModal(false);
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to configure schedule');
    }
  };

  const mapWeekends = (days) => {
    const map = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
    return days.map(d => map[d]).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Calendar & Schedules</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Settings size={18} />
          Configure Month
        </button>
      </div>

      <div className="card p-6 border border-gray-100 flex items-center gap-4">
        <label className="text-gray-700 font-medium">Select Month to View:</label>
        <input 
          type="month" 
          className="input-field max-w-xs" 
          value={formData.month_year}
          onChange={(e) => setFormData({...formData, month_year: e.target.value})}
        />
      </div>

      <div className="card shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading schedule...</div>
        ) : schedules.length > 0 ? (
          <div>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <Calendar className="text-primary-600" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Global Quran Schedule for {schedules[0].schedule.month_year}</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm font-medium text-blue-800">Total Active Days</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{schedules[0].metrics.totalActiveDays}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-sm font-medium text-green-800">Days Passed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{schedules[0].metrics.activeDaysPassed}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-sm font-medium text-orange-800">Days Remaining</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{schedules[0].metrics.activeDaysLeft}</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Weekend Configuration: <strong>{mapWeekends(schedules[0].schedule.weekend_config)}</strong>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Calendar className="text-gray-300 mb-3" size={48} />
            <p className="text-lg font-medium">No schedule configured for {formData.month_year}</p>
            <p className="text-sm mt-1">Configure this month's schedule to start tracking attendance properly.</p>
          </div>
        )}
      </div>

      {/* Configure Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">Configure Month Schedule</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Month / Year</label>
                    <input type="month" required className="mt-1 input-field" value={formData.month_year} onChange={(e) => setFormData({...formData, month_year: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weekend Days</label>
                    {/* Basic multiselect emulation */}
                    <div className="flex flex-wrap gap-2">
                      {[{v:0,l:'Sun'}, {v:1,l:'Mon'}, {v:2,l:'Tue'}, {v:3,l:'Wed'}, {v:4,l:'Thu'}, {v:5,l:'Fri'}, {v:6,l:'Sat'}].map(day => (
                        <label key={day.v} className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                            checked={formData.weekend_config.includes(day.v)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                weekend_config: checked 
                                  ? [...prev.weekend_config, day.v] 
                                  : prev.weekend_config.filter(x => x !== day.v)
                              }));
                            }}
                          />
                          <span className="ml-2 text-sm text-gray-700">{day.l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-4">
                    <button type="submit" className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm">
                      Save Settings
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
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

export default Schedules;
