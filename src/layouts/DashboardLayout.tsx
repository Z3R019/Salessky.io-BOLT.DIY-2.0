import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Mail, 
  Settings, 
  Menu, 
  X,
  LogOut,
  AtSign,
  CreditCard,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

// Logo path may need adjusting based on your project structure
import logoPath from '/logo.svg';

interface UserData {
  first_name: string | null;
  last_name: string | null;
}

const DashboardLayout: React.FC = () => {
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        console.error('Fehler beim Laden der Benutzerdaten:', error);
      } else if (data) {
        setUserData(data);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Benutzerdaten:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Display name - shows first_name and last_name if available, or email, or a fallback
  const displayName = userData && (userData.first_name || userData.last_name) 
    ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
    : user?.email || 'Benutzer';
    
  // Get initial letter for avatar
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'} z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo & Close button for mobile */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
            <Link to="/" className="flex items-center">
              <img src={logoPath} alt="Logo" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold">SalesSky.io</span>
            </Link>
            <button 
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={closeSidebar}
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav links - Main Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center px-4 py-2 rounded-md ${
                  isActive 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <Home size={18} className="mr-3" />
              Dashboard
            </NavLink>
            <NavLink 
              to="/leads" 
              className={({ isActive }) => 
                `flex items-center px-4 py-2 rounded-md ${
                  isActive 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <Users size={18} className="mr-3" />
              Leads
            </NavLink>
            <NavLink 
              to="/campaigns" 
              className={({ isActive }) => 
                `flex items-center px-4 py-2 rounded-md ${
                  isActive 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <Mail size={18} className="mr-3" />
              Kampagnen
            </NavLink>
            <NavLink 
              to="/accounts" 
              className={({ isActive }) => 
                `flex items-center px-4 py-2 rounded-md ${
                  isActive 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <AtSign size={18} className="mr-3" />
              E-Mail-Accounts
            </NavLink>
          </nav>

          {/* Bottom nav links - Settings & Billing */}
          <div className="px-2 py-4 space-y-1">
            <NavLink 
              to="/settings/billing" 
              className={({ isActive }) => 
                `flex items-center px-4 py-2 rounded-md ${
                  isActive 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <CreditCard size={18} className="mr-3" />
              Abrechnung
            </NavLink>
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `flex items-center px-4 py-2 rounded-md ${
                  isActive 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <Settings size={18} className="mr-3" />
              Einstellungen
            </NavLink>
          </div>

          {/* User section */}
          <div className="p-4 border-t border-gray-700">
            <Link to="/settings" className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center text-white">
                    {avatarInitial}
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`lg:pl-64 min-h-screen flex flex-col`}>
        {/* Header */}
        <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm w-full border-b`}>
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <button 
              className={`lg:hidden ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
            <div className="ml-4 lg:ml-0"></div>
            <div className="flex items-center space-x-4">
              {/* Theme toggle button */}
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}
                aria-label={theme === 'dark' ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className={`flex-1 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
