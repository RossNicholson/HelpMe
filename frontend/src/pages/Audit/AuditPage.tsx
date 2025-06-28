import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  CalendarIcon, 
  Download, 
  Filter, 
  Search, 
  Shield, 
  User, 
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { api } from '@/services/api';

interface AuditLog {
  id: number;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: number;
  entity_name: string;
  old_values: string;
  new_values: string;
  metadata: string;
  ip_address: string;
  user_agent: string;
  session_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  created_at: string;
}

interface AuditSummary {
  total_events: number;
  critical_events: number;
  high_events: number;
  medium_events: number;
  login_events: number;
  delete_events: number;
  active_users: number;
}

const AuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    entity_type: '',
    entity_id: '',
    severity: '',
    start_date: '',
    end_date: '',
    search: '',
    limit: 100,
    offset: 0
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchAuditLogs();
    fetchSummary();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await api.get(`/audit/logs?${queryParams}`);
      setAuditLogs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/audit/summary');
      setSummary(response.data.data);
    } catch (error) {
      console.error('Error fetching audit summary:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset pagination when filters change
    }));
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const queryParams = new URLSearchParams({
        start_date: filters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: filters.end_date || new Date().toISOString(),
        format
      });

      if (format === 'csv') {
        const response = await api.get(`/audit/export?${queryParams}`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const response = await api.get(`/audit/export?${queryParams}`);
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const parseJsonSafely = (jsonString: string) => {
    try {
      return jsonString ? JSON.parse(jsonString) : null;
    } catch {
      return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600">Monitor system activity and security events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('json')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={() => handleExport('csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_events}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.critical_events + summary.high_events}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login Events</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.login_events}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.active_users}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entity_type">Entity Type</Label>
              <Select value={filters.entity_type} onValueChange={(value) => handleFilterChange('entity_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  <SelectItem value="tickets">Tickets</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                  <SelectItem value="contracts">Contracts</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user_name || 'System'}</div>
                          <div className="text-sm text-gray-500">{log.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.entity_type}</div>
                          {log.entity_name && (
                            <div className="text-sm text-gray-500">{log.entity_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(log.severity)}
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.description}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.ip_address}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">User</Label>
                                  <p className="text-sm">{log.user_name || 'System'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Action</Label>
                                  <p className="text-sm">{log.action}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Entity Type</Label>
                                  <p className="text-sm">{log.entity_type}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Entity ID</Label>
                                  <p className="text-sm">{log.entity_id || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Severity</Label>
                                  <div className="flex items-center gap-2">
                                    {getSeverityIcon(log.severity)}
                                    <span className="text-sm">{log.severity}</span>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">IP Address</Label>
                                  <p className="text-sm">{log.ip_address}</p>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium">Description</Label>
                                <p className="text-sm">{log.description}</p>
                              </div>

                              {log.old_values && (
                                <div>
                                  <Label className="text-sm font-medium">Previous Values</Label>
                                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(parseJsonSafely(log.old_values), null, 2)}
                                  </pre>
                                </div>
                              )}

                              {log.new_values && (
                                <div>
                                  <Label className="text-sm font-medium">New Values</Label>
                                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(parseJsonSafely(log.new_values), null, 2)}
                                  </pre>
                                </div>
                              )}

                              {log.metadata && (
                                <div>
                                  <Label className="text-sm font-medium">Metadata</Label>
                                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(parseJsonSafely(log.metadata), null, 2)}
                                  </pre>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">User Agent</Label>
                                  <p className="text-xs text-gray-500 truncate">{log.user_agent}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Session ID</Label>
                                  <p className="text-xs text-gray-500">{log.session_id || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {auditLogs.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No audit logs found matching your criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditPage; 