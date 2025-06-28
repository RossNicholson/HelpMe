import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Tickets', href: '/tickets', icon: '🎫' },
    { name: 'Clients', href: '/clients', icon: '👥' },
    { name: 'Assets', href: '/assets', icon: '💻' },
    { name: 'Knowledge Base', href: '/knowledge-base', icon: '📚' },
    { name: 'Reports', href: '/reports', icon: '📈' },
    { name: 'Analytics', href: '/analytics', icon: '📊' },
    { name: 'SMS', href: '/sms', icon: '📱' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
        <div className="flex h-16 shrink-0 items-center">
          <img src="/helpmelogo.png" alt="HelpMe Logo" className="h-10 w-auto" style={{maxHeight: 40}} />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                          ${isActive
                            ? 'bg-gray-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <span className="text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 