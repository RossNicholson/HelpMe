import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DashboardData {
  tickets: any[];
  notifications: any[];
  assets: any[];
  summary: {
    totalTickets: number;
    openTickets: number;
    unreadNotifications: number;
    totalAssets: number;
  };
}

interface ClientDashboardProps {
  sessionToken: string;
  client: any;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ sessionToken, client }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/client-portal/dashboard`, {
        headers: {
          'x-session-token': sessionToken,
        },
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Failed to load dashboard');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {client.name}!</h1>
          <p className="text-gray-600">Here's an overview of your support tickets and account</p>
        </div>
        <Link
          to="/portal/tickets/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Ticket
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.openTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">🔔</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unread Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.unreadNotifications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">💻</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalAssets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
            <Link
              to="/portal/tickets"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.tickets.slice(0, 5).map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/portal/tickets/${ticket.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      #{ticket.id} - {ticket.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            <Link
              to="/portal/notifications"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {data.notifications.slice(0, 5).map((notification) => (
            <div key={notification.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    New
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/portal/tickets/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">➕</span>
            <div>
              <h4 className="font-medium text-gray-900">Create Ticket</h4>
              <p className="text-sm text-gray-600">Submit a new support request</p>
            </div>
          </Link>
          
          <Link
            to="/portal/knowledge-base"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">📚</span>
            <div>
              <h4 className="font-medium text-gray-900">Knowledge Base</h4>
              <p className="text-sm text-gray-600">Browse helpful articles</p>
            </div>
          </Link>
          
          <Link
            to="/portal/assets"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">💻</span>
            <div>
              <h4 className="font-medium text-gray-900">My Assets</h4>
              <p className="text-sm text-gray-600">View your devices and software</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard; 