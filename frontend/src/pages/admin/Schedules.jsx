import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  Calendar as CalendarIcon, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Save,
  Coffee,
  Sun
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  isSameMonth,
  isToday,
  parseISO
} from 'date-fns';

const Schedules = () => {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // New state for multi-schedule support
  const [scheduleType, setScheduleType] = useState('Quranic'); // 'Quranic' or 'Theory'
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  // Local state for edits
  const [weekendConfig, setWeekendConfig] = useState([5, 6]);
  const [manualOverrides, setManualOverrides] = useState({});

  const monthYearStr = format(currentDate, 'yyyy-MM');

  // Load classes for theory selection
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        // Only theory classes for specific schedules
        setClasses(res.data.filter(c => c.type === 'Theory'));
      } catch (error) {
        toast.error('Failed to load classes');
      }
    };
    fetchClasses();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const classQuery = scheduleType === 'Theory' && selectedClassId ? `?class_id=${selectedClassId}` : '';
      const res = await api.get(`/schedules/${monthYearStr}${classQuery}`);
      setScheduleData(res.data);
      setWeekendConfig(res.data.schedule.weekend_config || [5, 6]);
      setManualOverrides(res.data.schedule.manual_overrides || {});
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If theory is selected but no class chosen, don't fetch yet
    if (scheduleType === 'Theory' && !selectedClassId) {
      setLoading(false);
      setScheduleData(null);
      return;
    }
    fetchSchedule();
  }, [monthYearStr, scheduleType, selectedClassId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/schedules', {
        month_year: monthYearStr,
        weekend_config: weekendConfig,
        manual_overrides: manualOverrides,
        class_id: scheduleType === 'Theory' ? Number(selectedClassId) : null
      });
      toast.success('Schedule saved successfully');
      fetchSchedule();
    } catch (error) {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dateStr, defaultActive) => {
    setManualOverrides(prev => {
      const next = { ...prev };
      const currentOverride = next[dateStr];
      
      if (!currentOverride) {
        // Create override opposite of default
        next[dateStr] = defaultActive ? 'Passive' : 'Active';
      } else {
        // Delete override (revert to default)
        delete next[dateStr];
      }
      return next;
    });
  };

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    // Fill leading empty days
    const leadingDays = getDay(start);
    const grid = [];
    for (let i = 0; i < leadingDays; i++) grid.push(null);
    return [...grid, ...days];
  }, [currentDate]);

  const getDayInfo = (date) => {
    if (!date) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);
    const isWeekendDefault = weekendConfig.includes(dayOfWeek);
    const override = manualOverrides[dateStr];
    
    const isActive = override ? override === 'Active' : !isWeekendDefault;
    const type = override 
      ? (override === 'Active' ? 'manual-active' : 'manual-passive')
      : (isWeekendDefault ? 'default-passive' : 'default-active');

    return { isActive, type, dateStr };
  };

  const dynamicMetrics = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    let totalActive = 0;
    let remaining = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    days.forEach(date => {
      const info = getDayInfo(date);
      if (info.isActive) {
        totalActive++;
        if (date >= today) {
          remaining++;
        }
      }
    });

    return { totalActive, remaining };
  }, [calendarDays, weekendConfig, manualOverrides]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar & Schedules</h1>
          <p className="text-sm text-gray-500 mt-1">Configure active and passive days for attendance tracking.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setScheduleType('Quranic');
                setSelectedClassId('');
              }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                scheduleType === 'Quranic' ? 'bg-white text-secondary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Quranic
            </button>
            <button
              onClick={() => setScheduleType('Theory')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                scheduleType === 'Theory' ? 'bg-white text-secondary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Theory
            </button>
          </div>

          {scheduleType === 'Theory' && (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-secondary-500/20"
            >
              <option value="">Select a Class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
          )}

          <button 
            onClick={handleSave}
            disabled={saving || loading || (scheduleType === 'Theory' && !selectedClassId)}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Schedule
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Calendar Control & Weekend Settings */}
        <div className="space-y-6">
          <div className="card p-6 border border-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings size={20} className="text-secondary-600" />
              Weekend Settings
            </h2>
            <p className="text-sm text-gray-500 mb-4">Select days that are globally off (Passive) by default.</p>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => {
                    setWeekendConfig(prev => 
                      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                    );
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                    weekendConfig.includes(idx)
                      ? 'bg-secondary-100 text-secondary-700 border-secondary-200 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 border border-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              Legend
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-white border-2 border-gray-100 shadow-sm"></div>
                <span className="text-gray-600">Active (Work Day)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-secondary-100 border-2 border-secondary-200"></div>
                <span className="text-gray-600">Passive (Weekend)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-orange-100 border-2 border-orange-300"></div>
                <span className="text-gray-600">Manual Passive (Day Off)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-primary-100 border-2 border-primary-300"></div>
                <span className="text-gray-600">Manual Active (Extra Day)</span>
              </div>
            </div>
          </div>

          {scheduleData && (
            <div className="card p-6 bg-linear-to-br from-secondary-600 to-secondary-700 text-black shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <Sun size={20} />
                  Month Metrics
                </h2>
                <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full font-medium">
                  {monthYearStr}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-xs text-secondary-100">Total Active</p>
                  <p className="text-2xl font-bold">{dynamicMetrics.totalActive}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-xs text-secondary-100">Remaining</p>
                  <p className="text-2xl font-bold">{dynamicMetrics.remaining}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Calendar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card bg-white border border-gray-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-secondary-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <div className="h-4 w-px bg-gray-200 mx-1"></div>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="p-2 sm:p-4">
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {loading ? (
                  <div className="col-span-7 h-96 flex items-center justify-center text-gray-400 italic">
                    Loading month view...
                  </div>
                ) : calendarDays.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} className="h-16 sm:h-24 bg-gray-50/50 rounded-xl" />;
                  
                  const info = getDayInfo(date);
                  const isCurrentDay = isToday(date);
                  
                  let bgColor = 'bg-white';
                  let borderColor = 'border-gray-100';
                  let iconColor = 'text-gray-300';
                  
                  if (info.type === 'default-passive') {
                    bgColor = 'bg-secondary-50 hover:bg-secondary-100';
                    borderColor = 'border-secondary-100';
                    iconColor = 'text-secondary-300';
                  } else if (info.type === 'manual-passive') {
                    bgColor = 'bg-orange-50 hover:bg-orange-100';
                    borderColor = 'border-orange-300';
                    iconColor = 'text-orange-400';
                  } else if (info.type === 'manual-active') {
                    bgColor = 'bg-primary-50 hover:bg-primary-100';
                    borderColor = 'border-primary-300';
                    iconColor = 'text-primary-400';
                  } else {
                    bgColor = 'bg-white hover:bg-gray-50';
                    borderColor = 'border-gray-100';
                    iconColor = 'text-gray-200';
                  }

                  return (
                    <button
                      key={info.dateStr}
                      onClick={() => toggleDay(info.dateStr, !weekendConfig.includes(getDay(date)))}
                      className={`h-16 sm:h-24 p-2 sm:p-3 text-left relative flex flex-col justify-between transition-all border-2 rounded-2xl group ${bgColor} ${borderColor} ${isCurrentDay ? 'ring-2 ring-secondary-500 ring-offset-2' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm sm:text-lg font-bold ${info.isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                          {format(date, 'd')}
                        </span>
                        {!info.isActive && (
                          <Coffee size={14} className={iconColor} />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-tighter ${info.isActive ? 'text-gray-400' : 'text-gray-300'}`}>
                          {info.isActive ? 'Active' : 'Off'}
                        </span>
                        {isCurrentDay && (
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary-500"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                <Info size={14} />
                Click individual days to toggle between active and passive status. Don't forget to save.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedules;
