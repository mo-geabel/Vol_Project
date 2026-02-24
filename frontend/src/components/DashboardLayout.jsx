import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, LogOut, Home, Users, BookOpen, 
  CalendarDays, Settings, GraduationCap,
  ChevronDown, ChevronRight
} from 'lucide-react';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState(['Students']); // Default Students menu to open
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { 
      name: 'Students', 
      icon: GraduationCap,
      children: [
        { name: 'Quranic', href: '/admin/students/quranic', icon: BookOpen },
        { name: 'Theoric', href: '/admin/students/theoric', icon: GraduationCap },
      ]
    },
    { name: 'Classes', href: '/admin/classes', icon: BookOpen },
    { name: 'Schedules', href: '/admin/schedules', icon: CalendarDays },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const teacherNavigation = [
    { name: 'Dashboard', href: '/teacher', icon: Home },
    { name: 'My Classes', href: '/teacher/classes', icon: BookOpen },
    { name: 'Attendance', href: '/teacher/attendance', icon: CalendarDays },
  ];

  const navigation = user?.role === 'admin' ? adminNavigation : teacherNavigation;

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar overlay (Mobile only) - Lowered z-index and removed blur to prevent modal interference */}
      <div 
        className={`fixed inset-0 z-10 bg-gray-900/10 lg:hidden transition-all duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-64'
        }`}
      >
        <div className="flex items-center h-16 border-b border-gray-100 px-6 shrink-0 overflow-hidden">
          <BookOpen className="text-primary-600 mr-2 shrink-0" size={24} />
          <span className={`text-xl font-bold bg-linear-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent truncate transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            MEMS Portal
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
                      <item.icon className="shrink-0 h-5 w-5 mr-3" />
                      <span className={`truncate transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                        {item.name}
                      </span>
                    </div>
                    {sidebarOpen && (
                      isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />
                    )}
                  </button>
                  
                  {/* Sub-menu items */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen && sidebarOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="pl-10 space-y-1 mt-1">
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
                          {child.icon && <child.icon className="shrink-0 h-4 w-4 mr-3" />}
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
                <item.icon className="shrink-0 h-5 w-5 mr-3" />
                <span className={`truncate transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

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
            <LogOut className="shrink-0 h-5 w-5 mr-3" />
            <span className={`truncate transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              Sign Out
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
              {navigation.find(n => window.location.pathname.startsWith(n.href))?.name || 'Overview'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Additional header items could go here */}
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
