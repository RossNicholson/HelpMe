import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ticketsAPI, clientsAPI } from '../../services/api';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'unassigned' | 'assigned' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  client_id: string;
  client_name: string;
  type: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

const EditTicketPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    status: 'unassigned',
    client_id: '',
    type: 'incident'
  });

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchClients();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      setError(null);
      const response = await ticketsAPI.getById(id!);
      const ticketData = response.data?.data;
      if (ticketData) {
        setTicket(ticketData);
        setFormData({
          subject: ticketData.subject || '',
          description: ticketData.description || '',
          priority: ticketData.priority || 'medium',
          status: ticketData.status || 'unassigned',
          client_id: ticketData.client_id || '',
          type: ticketData.type || 'incident'
        });
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      const clientsData = response.data?.data || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const handleSave = async () => {
    if (!formData.subject || !formData.description || !formData.client_id) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await ticketsAPI.update(id!, formData);
      navigate('/tickets');
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Edit Ticket</h1>
          <Button variant="outline" onClick={() => navigate('/tickets')}>
            Back to Tickets
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-red-600 mb-2">{error || 'Ticket not found'}</p>
              <Button onClick={() => navigate('/tickets')} variant="outline">Back to Tickets</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Edit Ticket #{ticket.id}</h1>
        <Button variant="outline" onClick={() => navigate('/tickets')}>
          Back to Tickets
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter ticket subject"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter ticket description"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unassigned">Unassigned</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">Client *</Label>
                <select
                  id="client"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="incident">Incident</option>
                  <option value="request">Request</option>
                  <option value="problem">Problem</option>
                  <option value="change">Change</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => navigate('/tickets')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditTicketPage; 