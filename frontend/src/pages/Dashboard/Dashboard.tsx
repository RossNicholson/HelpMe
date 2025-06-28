import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Filter, X } from 'lucide-react';

interface DashboardStats {
  tickets: {
    total: number;
    open: number;
    resolved: number;
    closed: number;
    highPriority: number;
    urgent: number;
    overdue: number;
    createdToday: number;
    resolvedToday: number;
  };
  clients: {
    total: number;
    active: number;
  };
  users: {
    total: number;
    admins: number;
    technicians: number;
  };
  recentActivity: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    updated_at: string;
    client_name: string;
    creator_first_name: string;
    creator_last_name: string;
    assignee_first_name?: string;
    assignee_last_name?: string;
  }>;
  trends: Array<{
    date: string;
    count: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [filteredActivity, setFilteredActivity] = useState<DashboardStats['recentActivity']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivityFilters, setShowActivityFilters] = useState(false);
  const [activityFilters, setActivityFilters] = useState({
    search: '',
    status: '',
    priority: '',
    client_name: ''
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (stats?.recentActivity) {
      applyActivityFilters();
    }
  }, [stats?.recentActivity, activityFilters]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyActivityFilters = () => {
    if (!stats?.recentActivity) return;

    let filtered = [...stats.recentActivity];

    // Search filter
    if (activityFilters.search) {
      const searchTerm = activityFilters.search.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.subject.toLowerCase().includes(searchTerm) ||
        activity.client_name.toLowerCase().includes(searchTerm) ||
        activity.creator_first_name.toLowerCase().includes(searchTerm) ||
        activity.creator_last_name.toLowerCase().includes(searchTerm) ||
        (activity.assignee_first_name && activity.assignee_first_name.toLowerCase().includes(searchTerm)) ||
        (activity.assignee_last_name && activity.assignee_last_name.toLowerCase().includes(searchTerm))
      );
    }

    // Status filter
    if (activityFilters.status) {
      filtered = filtered.filter(activity => activity.status === activityFilters.status);
    }

    // Priority filter
    if (activityFilters.priority) {
      filtered = filtered.filter(activity => activity.priority === activityFilters.priority);
    }

    // Client filter
    if (activityFilters.client_name) {
      filtered = filtered.filter(activity => activity.client_name === activityFilters.client_name);
    }

    setFilteredActivity(filtered);
  };

  const clearActivityFilters = () => {
    setActivityFilters({
      search: '',
      status: '',
      priority: '',
      client_name: ''
    });
  };

  const handleActivityFilterChange = (key: string, value: string) => {
    setActivityFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <Button 
            onClick={fetchDashboardStats}
            className="mt-3"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Button onClick={() => navigate('/tickets/new')} className="bg-blue-600 hover:bg-blue-700">
            Create New Ticket
          </Button>
          <Button onClick={() => navigate('/clients/new')} variant="outline">
            Add New Client
          </Button>
        </div>
      </div>

      {stats && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.tickets.open}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {stats.tickets.createdToday} created today
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.tickets.highPriority}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {stats.tickets.overdue} overdue
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.tickets.resolvedToday}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {stats.tickets.resolved} total resolved
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.clients.active}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {stats.clients.total} total clients
                </span>
              </div>
            </Card>
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity with Search */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowActivityFilters(!showActivityFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {showActivityFilters ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                  {(activityFilters.search || activityFilters.status || activityFilters.priority || activityFilters.client_name) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearActivityFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Activity Search and Filters */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search recent activity..."
                    value={activityFilters.search}
                    onChange={(e) => handleActivityFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {showActivityFilters && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={activityFilters.status}
                      onChange={(e) => handleActivityFilterChange('status', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All statuses</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={activityFilters.priority}
                      onChange={(e) => handleActivityFilterChange('priority', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredActivity.length} of {stats.recentActivity.length} activities
                {(activityFilters.search || activityFilters.status || activityFilters.priority || activityFilters.client_name) && (
                  <span className="ml-2 text-blue-600">
                    (filtered)
                  </span>
                )}
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {stats.recentActivity.length === 0 
                      ? 'No recent activity found.'
                      : 'No activities match your current filters. Try adjusting your search criteria.'
                    }
                  </div>
                ) : (
                  filteredActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.subject}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge className={`text-xs ${getPriorityColor(activity.priority)}`}>
                              {activity.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(activity.updated_at)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {activity.client_name} • Created by {activity.creator_first_name} {activity.creator_last_name}
                          {activity.assignee_first_name && (
                            <span> • Assigned to {activity.assignee_first_name} {activity.assignee_last_name}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => navigate('/tickets')}
                  className="h-20 flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium">View Tickets</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/clients')}
                  className="h-20 flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium">Manage Clients</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/reports')}
                  className="h-20 flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium">View Reports</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/settings')}
                  className="h-20 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-gray-200"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium">Settings</span>
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 