import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { 
  ChevronLeft, 
  TrendingUp, 
  Calendar, 
  Star, 
  BookOpen, 
  History, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Phone,
  User2
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const StudentProgress = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filtering state (Top Analytics)
  const [filterMode, setFilterMode] = useState('Overall'); // 'Overall' or 'Monthly'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filtering state (Activity Log)
  const [logTypeFilter, setLogTypeFilter] = useState('All'); // 'All', 'Hifz', 'Muraja', 'Unprepared'
  const [logMonthFilter, setLogMonthFilter] = useState(new Date().getMonth());
  const [logYearFilter, setLogYearFilter] = useState(new Date().getFullYear());
  const [logTimeMode, setLogTimeMode] = useState('Current'); // 'Current', 'AllTime', 'Custom'

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await api.get(`/progress/enrollment/${enrollmentId}`);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching student progress:', error);
        toast.error('Failed to load student history');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [enrollmentId]);

  if (loading) return <div className="p-8 text-center text-primary-600 font-medium">Loading student history...</div>;
  if (!data) return <div className="p-8 text-center">Student history not found</div>;

  const { enrollment, quran, attendance } = data;

  // Helper for filtering
  const isMonthMatch = (dateStr, m, y) => {
    const date = new Date(dateStr);
    return date.getMonth() === Number(m) && date.getFullYear() === Number(y);
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // --- STATS CALCULATIONS ---
  const calculateStats = (records, attRecords, m, y) => {
    const isFiltered = m !== null && y !== null;
    const filter = (d) => isFiltered ? isMonthMatch(d, m, y) : true;

    const filteredRecords = records.filter(p => filter(p.date));
    const filteredAtt = attRecords.filter(a => filter(a.date));

    const hifz = filteredRecords.filter(p => p.type === 'Hifz' && p.rating !== null).map(p => p.rating);
    const muraja = filteredRecords.filter(p => p.type === 'Muraja' && p.rating !== null).map(p => p.rating);
    const present = filteredAtt.filter(a => a.status === 'Present').length;

    return {
      hifzAvg: hifz.length > 0 ? (hifz.reduce((a, b) => a + b, 0) / hifz.length).toFixed(1) : '–',
      murajaAvg: muraja.length > 0 ? (muraja.reduce((a, b) => a + b, 0) / muraja.length).toFixed(1) : '–',
      attendanceRate: filteredAtt.length > 0 ? ((present / filteredAtt.length) * 100).toFixed(0) : 0,
      total: filteredRecords.length
    };
  };

  const overallStats = calculateStats(quran, attendance, null, null);
  const monthlyStats = calculateStats(quran, attendance, selectedMonth, selectedYear);

  // --- LOG FILTERING ---
  const filteredLog = quran.filter(record => {
    // Type Filter
    if (logTypeFilter !== 'All') {
      if (logTypeFilter === 'Unprepared') {
        if (!record.type.includes('NotPrepared')) return false;
      } else if (record.type !== logTypeFilter) return false;
    }

    // Time Filter
    if (logTimeMode === 'AllTime') return true;
    if (logTimeMode === 'Current') {
      const now = new Date();
      return isMonthMatch(record.date, now.getMonth(), now.getFullYear());
    }
    if (logTimeMode === 'Custom') {
      return isMonthMatch(record.date, logMonthFilter, logYearFilter);
    }
    return true;
  });

  // --- CHART DATA ---
  const filteredForCharts = filterMode === 'Monthly' ? quran.filter(p => isMonthMatch(p.date, selectedMonth, selectedYear)) : quran;
  
  const hifzChart = [...filteredForCharts].filter(p => p.type === 'Hifz' && p.rating !== null).reverse().map(p => ({
    date: format(new Date(p.date), 'MM/dd'),
    fullDate: format(new Date(p.date), 'MMM dd, yyyy'),
    rating: p.rating
  }));

  const murajaChart = [...filteredForCharts].filter(p => p.type === 'Muraja' && p.rating !== null).reverse().map(p => ({
    date: format(new Date(p.date), 'MM/dd'),
    fullDate: format(new Date(p.date), 'MMM dd, yyyy'),
    rating: p.rating
  }));

  const attChart = [...filteredForCharts].slice(0, 15).reverse().map(a => {
    const att = attendance.find(att => format(new Date(att.date), 'yyyy-MM-dd') === format(new Date(a.date), 'yyyy-MM-dd'));
    return {
      date: format(new Date(a.date), 'MM/dd'),
      fullDate: format(new Date(a.date), 'MMM dd, yyyy'),
      status: att?.status === 'Present' ? 1 : 0
    };
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-30 flex flex-col gap-4 bg-white/90 backdrop-blur-xl p-4 sm:p-6 -mx-4 sm:-mx-6 lg:-mx-8 border-b border-gray-100 shadow-sm transition-all rounded-b-2xl sm:rounded-b-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 sm:p-2.5 hover:bg-gray-50 rounded-xl sm:rounded-2xl transition-all text-gray-400 hover:text-primary-600 border border-transparent hover:border-primary-100 shadow-xs active:scale-95"
            >
              <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate max-w-[200px] sm:max-w-none">
                  {enrollment.student.name}
                </h1>
                {enrollment.student.date_of_birth && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {calculateAge(enrollment.student.date_of_birth)} Years Old
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                  {enrollment.class.class_name}
                </p>
                {enrollment.student.contact_info && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                    <Phone size={12} className="text-primary-400" />
                    <span>{enrollment.student.contact_info}</span>
                  </div>
                )}
                {enrollment.student.parent_info && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                    <User2 size={12} className="text-primary-400" />
                    <span>Parent: {enrollment.student.parent_info}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100/50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-100 self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => setFilterMode('Overall')}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${filterMode === 'Overall' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All Time
            </button>
            <button 
              onClick={() => setFilterMode('Monthly')}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${filterMode === 'Monthly' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monthly
            </button>
            
            {filterMode === 'Monthly' && (
              <div className="flex items-center gap-1 border-l border-gray-200 ml-1.5 sm:ml-2 pl-1.5 sm:pl-2">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent border-none text-[10px] sm:text-xs font-black text-gray-700 focus:ring-0 cursor-pointer appearance-none py-1"
                >
                  {months.map((m, i) => <option key={m} value={i}>{m.slice(0, 3)}</option>)}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent border-none text-[10px] sm:text-xs font-black text-gray-700 focus:ring-0 cursor-pointer appearance-none py-1"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Hifz card */}
        <div className="card p-5 sm:p-6 border-t-4 border-amber-500">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3 sm:mb-4">
            <Star size={14} className="text-amber-500" /> Hifz Avg
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Overall</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">{overallStats.hifzAvg}</span>
              </div>
            </div>
            {filterMode === 'Monthly' && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{months[selectedMonth].slice(0, 3)}</p>
                <span className={`text-lg sm:text-xl font-black ${Number(monthlyStats.hifzAvg) >= Number(overallStats.hifzAvg) ? 'text-green-600' : 'text-amber-600'}`}>
                  {monthlyStats.hifzAvg}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Muraja card */}
        <div className="card p-5 sm:p-6 border-t-4 border-blue-500">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3 sm:mb-4">
            <BookOpen size={14} className="text-blue-500" /> Muraja Avg
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Overall</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">{overallStats.murajaAvg}</span>
              </div>
            </div>
            {filterMode === 'Monthly' && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{months[selectedMonth].slice(0, 3)}</p>
                <span className={`text-lg sm:text-xl font-black ${Number(monthlyStats.murajaAvg) >= Number(overallStats.murajaAvg) ? 'text-green-600' : 'text-blue-600'}`}>
                  {monthlyStats.murajaAvg}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Attendance card */}
        <div className="card p-5 sm:p-6 border-t-4 border-primary-500">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3 sm:mb-4">
            <CheckCircle2 size={14} className="text-primary-500" /> Attendance
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">All-Time</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">{overallStats.attendanceRate}%</span>
              </div>
            </div>
            {filterMode === 'Monthly' && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{months[selectedMonth].slice(0, 3)}</p>
                <span className={`text-lg sm:text-xl font-black ${monthlyStats.attendanceRate >= overallStats.attendanceRate ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlyStats.attendanceRate}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Total logs */}
        <div className="card p-5 sm:p-6 border-t-4 border-gray-300">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3 sm:mb-4">
            <History size={14} className="text-gray-400" /> Logs
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {filterMode === 'Monthly' ? monthlyStats.total : overallStats.total}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">
                {filterMode === 'Monthly' ? 'This Month' : 'Lifetime'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 sm:p-8">
          <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-widest mb-6 sm:mb-8 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-600" /> Performance History
          </h3>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart>
                <defs>
                  <linearGradient id="colorHifz" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMuraja" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}}
                />
                <YAxis 
                  domain={[0, 10]} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area data={hifzChart} type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={3} fill="url(#colorHifz)" name="Hifz" />
                <Area data={murajaChart} type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={3} fill="url(#colorMuraja)" name="Muraja" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 sm:p-8">
          <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-widest mb-6 sm:mb-8 flex items-center gap-2">
            <Calendar size={18} className="text-primary-600" /> Attendance Presence
          </h3>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}}
                />
                <YAxis hide domain={[0, 1]} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-50">
                          <p className="text-[10px] font-black text-gray-400 mb-1">{payload[0].payload.fullDate}</p>
                          <span className={`text-xs font-black ${payload[0].value === 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {payload[0].value === 1 ? 'PRESENT' : 'ABSENT'}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="status" radius={[4, 4, 4, 4]} barSize={15}>
                  {attChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 1 ? '#10b981' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Log Section */}
      <div className="card overflow-hidden">
        <div className="p-5 sm:p-8 border-b border-gray-100 bg-white">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-3">
              <History size={24} className="text-primary-600" />
              Activity Log
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
              {/* Type Switches */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl sm:rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar max-w-full">
                {['All', 'Hifz', 'Muraja', 'Unprepared'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setLogTypeFilter(t)}
                    className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${logTypeFilter === t ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Time Level Filter */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl sm:rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar max-w-full">
                {['AllTime', 'Current', 'Custom'].map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setLogTimeMode(mode)}
                    className={`whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${logTimeMode === mode ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {mode === 'AllTime' ? 'All Time' : mode}
                  </button>
                ))}

                {logTimeMode === 'Custom' && (
                  <div className="flex items-center gap-1 border-l border-gray-200 ml-2 pl-2">
                    <select 
                      value={logMonthFilter} 
                      onChange={(e) => setLogMonthFilter(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-black text-gray-700 focus:ring-0 cursor-pointer p-0 px-1"
                    >
                      {months.map((m, i) => <option key={m} value={i}>{m.slice(0, 3)}</option>)}
                    </select>
                    <select 
                      value={logYearFilter} 
                      onChange={(e) => setLogYearFilter(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-black text-gray-700 focus:ring-0 cursor-pointer p-0 px-1"
                    >
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Friendly List (Visible on mobile only) */}
        <div className="block lg:hidden">
          <div className="divide-y divide-gray-50 px-4">
            {filteredLog.map((record) => {
              const att = attendance.find(a => format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(record.date), 'yyyy-MM-dd'));
              const isNotPrep = record.type.includes('NotPrepared');
              
              return (
                <div key={record.id} className="py-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-black text-gray-900">{format(new Date(record.date), 'MMM dd, yyyy')}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(record.date), 'EEEE')}</div>
                    </div>
                    {att && (
                      <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        att.status === 'Present' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {att.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      isNotPrep ? 'bg-red-50 text-red-600' :
                      record.type === 'Hifz' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {record.type.replace('NotPrepared', 'Unprepared')}
                    </span>
                    
                    {!isNotPrep && (
                      <div className="text-xs font-bold text-gray-700 flex-1">
                        Surah {record.surah_id} <span className="text-gray-400 font-medium ml-1">({record.start_verse}-{record.end_verse})</span>
                      </div>
                    )}
                    
                    {record.rating && (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border ${
                        record.rating >= 8 ? 'bg-green-50 text-green-600 border-green-100' : 
                        record.rating >= 5 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {record.rating}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredLog.length === 0 && (
              <div className="py-12 text-center text-sm font-bold text-gray-400 italic">No records found.</div>
            )}
          </div>
        </div>

        {/* Desktop Table (Hidden on mobile) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Activity</th>
                <th className="px-8 py-5">Recitation</th>
                <th className="px-8 py-5 text-center">Rating</th>
                <th className="px-8 py-5 text-right">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredLog.map((record) => {
                const att = attendance.find(a => format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(record.date), 'yyyy-MM-dd'));
                const isNotPrep = record.type.includes('NotPrepared');
                
                return (
                  <tr key={record.id} className="hover:bg-gray-50/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-gray-900">{format(new Date(record.date), 'MMM dd, yyyy')}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(record.date), 'EEEE')}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        isNotPrep ? 'bg-red-50 text-red-600 font-black' :
                        record.type === 'Hifz' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {record.type.replace('NotPrepared', 'Unprepared')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {isNotPrep ? (
                        <span className="text-xs text-gray-400 italic">No progress</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">Surah {record.surah_id}</span>
                          <span className="text-[10px] text-gray-400 font-medium">Verses {record.start_verse}–{record.end_verse}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      {record.rating ? (
                        <div className={`inline-flex w-10 h-10 rounded-2xl items-center justify-center font-black text-sm border-2 ${
                          record.rating >= 8 ? 'bg-green-50 text-green-600 border-green-100' : 
                          record.rating >= 5 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {record.rating}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {att ? (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
                          att.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${att.status === 'Present' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                          {att.status}
                        </div>
                      ) : <span className="text-[10px] text-gray-300 font-bold uppercase italic tracking-tighter">No Record</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;
