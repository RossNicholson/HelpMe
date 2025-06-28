import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  AlertTriangle, 
  Shield, 
  User, 
  Clock,
  XCircle,
  Info
} from 'lucide-react';
import { api } from '../../services/api';

interface SecurityEvent {
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

const SecurityEvents: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/security-events?limit=10');
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching security events:', error);
    } finally {
      setLoading(false);
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
        return <Info className="h-4 w-4 text-green-600" />;
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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Events
          <Badge variant="outline" className="ml-auto">
            {events.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No security events detected</p>
              <p className="text-sm">All systems are secure</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(event.severity)}
                    <div>
                      <div className="font-medium">{event.action}</div>
                      <div className="text-sm text-gray-500">{event.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {getTimeAgo(event.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">User:</span>
                    <span className="ml-2 font-medium">
                      {event.user_name || 'System'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">IP:</span>
                    <span className="ml-2 font-mono text-xs">
                      {event.ip_address}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Entity:</span>
                    <span className="ml-2">
                      {event.entity_type}
                      {event.entity_name && ` - ${event.entity_name}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <span className="ml-2">
                      {formatDate(event.created_at)}
                    </span>
                  </div>
                </div>

                {event.metadata && (
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">Additional Info:</div>
                    <div className="text-xs font-mono">
                      {JSON.stringify(JSON.parse(event.metadata), null, 2)}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {events.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = '/audit'}
            >
              View All Audit Logs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityEvents; 