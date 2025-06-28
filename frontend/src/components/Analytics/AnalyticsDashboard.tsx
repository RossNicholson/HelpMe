import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

interface AnalyticsData {
  tickets: any;
  sla: any;
  timeTracking: any;
  billing: any;
  clients: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [tickets, sla, timeTracking, billing, clients] = await Promise.all([
        api.get('/reports/tickets', { params: filters }),
        api.get('/reports/sla', { params: filters }),
        api.get('/reports/time-tracking', { params: filters }),
        api.get('/reports/billing', { params: filters }),
        api.get('/reports/clients', { params: filters })
      ]);

      setData({
        tickets: tickets.data.data,
        sla: sla.data.data,
        timeTracking: timeTracking.data.data,
        billing: billing.data.data,
        clients: clients.data.data
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex space-x-4">
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
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
              <p className="text-2xl font-bold text-gray-900">{data.tickets.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{data.tickets.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">SLA Breaches</p>
              <p className="text-2xl font-bold text-gray-900">{data.sla.totalBreaches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Billed</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.billing.totalInvoiced)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Status Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.tickets.statusCounts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.tickets.statusCounts.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Priority Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.tickets.priorityCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time Tracking Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Time by Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.timeTracking.byActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="activity_type" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatDuration(value as number)} />
              <Bar dataKey="total" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Billing Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Billing by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.billing.byStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
              <Bar dataKey="total" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Time Tracking Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Time:</span>
              <span className="font-semibold">{formatDuration(data.timeTracking.totalMinutes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Billable:</span>
              <span className="font-semibold text-green-600">{formatDuration(data.timeTracking.billableMinutes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Non-Billable:</span>
              <span className="font-semibold text-gray-600">{formatDuration(data.timeTracking.nonBillableMinutes)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Billing Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Invoiced:</span>
              <span className="font-semibold">{formatCurrency(data.billing.totalInvoiced)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid:</span>
              <span className="font-semibold text-green-600">{formatCurrency(data.billing.totalPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outstanding:</span>
              <span className="font-semibold text-red-600">{formatCurrency(data.billing.totalOutstanding)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">SLA Compliance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Breaches:</span>
              <span className="font-semibold text-red-600">{data.sla.totalBreaches}</span>
            </div>
            {data.sla.byType.map((breach: any) => (
              <div key={breach.violation_type} className="flex justify-between">
                <span className="text-gray-600">{breach.violation_type}:</span>
                <span className="font-semibold">{breach.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 