import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ClientPortalLayoutProps {
  children: React.ReactNode;
  sessionToken: string;
  client: any;
  onLogout: () => void;
}

const ClientPortalLayout: React.FC<ClientPortalLayoutProps> = ({ 
  children, 
  sessionToken, 
  client, 
  onLogout 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/portal/dashboard', icon: '📊' },
    { name: 'Tickets', href: '/portal/tickets', icon: '🎫' },
    { name: 'Knowledge Base', href: '/portal/knowledge-base', icon: '📚' },
    { name: 'Assets', href: '/portal/assets', icon: '💻' },
    { name: 'Notifications', href: '/portal/notifications', icon: '🔔' },
    { name: 'Profile', href: '/portal/profile', icon: '👤' },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/client-portal/logout`, {
        method: 'POST',
        headers: {
          'x-session-token': sessionToken,
        },
      });

      if (response.ok) {
        onLogout();
        toast.success('Logged out successfully');
        navigate('/portal/login');
      } else {
        toast.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                className="h-8 w-auto"
                src="/helpmelogo.png"
                alt="HelpMe Logo"
              />
              <span className="ml-3 text-lg font-semibold text-gray-900">
                Client Portal
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{client.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 ml-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortalLayout; 