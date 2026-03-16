import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Menu, X, LogOut, Home, Users, BookOpen, 
  CalendarDays, Settings, GraduationCap, ClipboardList,
  ChevronDown, ChevronRight, FileText, Languages, TrendingUp, ShieldCheck, Database
} from 'lucide-react';
import { useTranslation } from 'react-i18next';


const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState(['Students']); // Default Students menu to open
  const [dbStatus, setDbStatus] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    
    if (user?.role === 'admin') {
      fetchDbStatus();
    }
  }, [i18n.language, isRTL, user]);

  const fetchDbStatus = async () => {
    try {
      const res = await api.get('/admin/db-status');
      setDbStatus(res.data);
    } catch (error) {
      console.warn('Failed to fetch DB status');
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNavigation = [
    { name: t('common.dashboard'), href: '/admin', icon: Home },
    { name: t('common.users'), href: '/admin/users', icon: Users },
    { 
      name: t('common.students'), 
      icon: GraduationCap,
      children: [
        { name: t('common.quranic'), href: '/admin/students/quranic', icon: BookOpen },
        { name: t('common.theoric'), href: '/admin/students/theoric', icon: GraduationCap },
        { name: t('compliance.compliance'), href: '/admin/students/compliance', icon: ShieldCheck },
      ]
    },
    { name: t('common.classes'), href: '/admin/classes', icon: BookOpen },
    { name: t('common.schedules'), href: '/admin/schedules', icon: CalendarDays },
    { name: t('common.teacher_attendance'), href: '/admin/teacher-attendance', icon: ClipboardList },
    { name: t('common.reports'), href: '/admin/reports', icon: FileText },
    { name: t('common.statistics'), href: '/admin/statistics', icon: TrendingUp },
    { name: t('common.settings'), href: '/admin/settings', icon: Settings },
  ];

  const teacherNavigation = [
    { name: t('common.dashboard'), href: '/teacher', icon: Home },
    { name: t('common.my_classes'), href: '/teacher/classes', icon: BookOpen },
    { name: t('common.attendance'), href: '/teacher/attendance', icon: CalendarDays },
    { name: t('common.reports'), href: '/teacher/reports', icon: FileText },
    { name: t('common.statistics'), href: '/teacher/statistics', icon: TrendingUp },
  ];

  const navigation = user?.role === 'admin' ? adminNavigation : teacherNavigation;

  return (
    <div className={`min-h-screen bg-gray-50 flex overflow-hidden ${isRTL ? 'font-arabic' : ''}`}>
      {/* Sidebar overlay (Mobile only) - Lowered z-index and removed blur to prevent modal interference */}
      <div 
        className={`fixed inset-0 z-10 bg-gray-900/10 lg:hidden transition-all duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 start-0 z-20 w-64 bg-white border-inline-end border-gray-200 transform transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:-me-64' : '-translate-x-full lg:-ms-64')
        }`}
      >
        <div className="flex items-center h-16 border-b border-gray-100 px-6 shrink-0 overflow-hidden">
          <BookOpen className={`text-primary-600 shrink-0 ${isRTL ? 'ml-2' : 'mr-2'}`} size={24} />
          <span className={`text-xl font-bold bg-linear-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent truncate transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            {t('common.portal_name')}
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openMenus.includes(item.name);

            if (hasChildren) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => {
                      if (!sidebarOpen) setSidebarOpen(true);
                      setOpenMenus(prev => 
                        prev.includes(item.name) 
                          ? prev.filter(m => m !== item.name) 
                          : [...prev, item.name]
                      );
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
                  >
                    <div className="flex items-center min-w-0">
                      <item.icon className="shrink-0 h-5 w-5 margin-inline-end-2" />
                      <span className={`truncate transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                        {item.name}
                      </span>
                    </div>
                    {sidebarOpen && (
                      <div className={isRTL ? 'rotate-180' : ''}>
                        {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                      </div>
                    )}
                  </button>
                  
                  {/* Sub-menu items */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen && sidebarOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="padding-inline-start-10 space-y-1 mt-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.href}
                          className={({ isActive }) =>
                            `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isActive
                                ? 'text-primary-600 bg-primary-50/50'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`
                          }
                          onClick={() => {
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                        >
                          {child.icon && <child.icon className="shrink-0 h-4 w-4 margin-inline-end-2" />}
                          {child.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/admin' || item.href === '/teacher'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={() => {
                  if (hasChildren) return; // Handled by button
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
              >
                <item.icon className="shrink-0 h-5 w-5 margin-inline-end-2" />
                <span className={`truncate transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {user?.role === 'admin' && dbStatus && sidebarOpen && (
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database size={14} className={dbStatus.usagePercent > 85 ? 'text-red-500' : 'text-gray-400'} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Database</span>
              </div>
              <span className={`text-[10px] font-black uppercase ${
                dbStatus.usagePercent > 90 ? 'text-red-600' : 
                dbStatus.usagePercent > 70 ? 'text-amber-600' : 'text-primary-600'
              }`}>
                {dbStatus.usagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  dbStatus.usagePercent > 90 ? 'bg-red-500' : 
                  dbStatus.usagePercent > 70 ? 'bg-amber-500' : 'bg-primary-500'
                }`}
                style={{ width: `${dbStatus.usagePercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center px-4 py-3 mb-2 rounded-xl bg-gray-50/50 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0 mr-3">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={`flex-1 min-w-0 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className={`shrink-0 h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            <span className={`truncate transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              {t('common.sign_out')}
            </span>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Global Toolbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-30 shadow-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary-500/20"
              title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              {sidebarOpen ? (
                <>
                  <X size={20} className="lg:hidden" />
                  <Menu size={20} className="hidden lg:block" />
                </>
              ) : (
                <Menu size={20} />
              )}
            </button>
            <div className="lg:hidden flex items-center">
              <BookOpen className="text-primary-600 mr-2" size={24} />
              <span className="text-lg font-bold text-gray-900">MEMS</span>
            </div>
            <div className="hidden lg:block h-6 w-px bg-gray-200" />
            <h2 className="hidden lg:block text-sm font-medium text-gray-500 truncate max-w-[200px]">
              {navigation.find(n => window.location.pathname.startsWith(n.href))?.name || t('common.overview')}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              title={t(`common.languages.switch_to_${i18n.language === 'en' ? 'ar' : 'en'}`)}
            >
              <Languages size={18} />
              <span>{t(`common.languages.${i18n.language === 'en' ? 'ar' : 'en'}`)}</span>
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
