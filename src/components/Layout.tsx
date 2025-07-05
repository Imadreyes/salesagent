import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Target,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Target, label: 'Campaigns', path: '/campaigns' },
  { icon: Users, label: 'Leads Tracker', path: '/leads' },
  { icon: Calendar, label: 'Booked Leads', path: '/booked' },
];

const adminNavItems = [
  { icon: Settings, label: 'Admin Panel', path: '/admin' },
];

export function Layout() {
  const { user, signOut, isAdmin, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-yellow-400 border-r-yellow-500 border-b-yellow-600"></div>
          <Crown className="absolute inset-0 m-auto h-8 w-8 text-yellow-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const allNavItems = [...navItems, ...(isAdmin ? adminNavItems : [])];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 black-card shadow-2xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-yellow-400/20">
          <div className="flex items-center space-x-2">
            <Crown className="h-8 w-8 text-yellow-400" />
            <h1 className="text-xl font-bold gold-text-gradient">Elite Outreach</h1>
          </div>
          <button
            className="lg:hidden text-yellow-400 hover:text-yellow-300"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'gold-gradient text-black shadow-lg'
                    : 'text-gray-300 hover:bg-yellow-400/10 hover:text-yellow-400 hover:border-yellow-400/30 border border-transparent'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-yellow-400/20">
          <div className="flex items-center mb-4 p-3 rounded-lg bg-yellow-400/5 border border-yellow-400/20">
            <div className="w-10 h-10 gold-gradient rounded-full flex items-center justify-center text-black text-sm font-bold shadow-lg">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-200">
                {user.user_metadata?.full_name || user.email}
              </p>
              <div className="flex items-center">
                {isAdmin && <Crown className="h-3 w-3 text-yellow-400 mr-1" />}
                <p className="text-xs text-yellow-400">
                  {isAdmin ? 'Elite Admin' : 'Premium Member'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-400/30"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar */}
        <header className="black-card shadow-lg border-b border-yellow-400/20 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="text-yellow-400 hover:text-yellow-300"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-400" />
              <h1 className="text-lg font-semibold gold-text-gradient">
                Elite Outreach
              </h1>
            </div>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}