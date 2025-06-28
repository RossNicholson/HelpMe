import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Tooltip, QuestionMarkIcon } from '../../components/ui/tooltip';
import { ticketsAPI, clientsAPI, clientUsersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ClientUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
}

const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    client_id: '',
    type: 'incident',
    contact_name: '',
    contact_email: '',
    contact_phone: ''
  });
  const [newUserData, setNewUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'user'
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (formData.client_id) {
      fetchClientUsers(formData.client_id);
    } else {
      setClientUsers([]);
    }
  }, [formData.client_id]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      const clientsData = response.data?.data || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const fetchClientUsers = async (clientId: string) => {
    try {
      const response = await clientUsersAPI.getClientUsers(clientId);
      const usersData = response.data?.data || [];
      setClientUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching client users:', error);
      setClientUsers([]);
    }
  };

  const handleAddNewUser = async () => {
    if (!formData.client_id) {
      toast.error('Please select a client first');
      return;
    }

    if (!newUserData.first_name || !newUserData.last_name || !newUserData.email) {
      toast.error('Please fill in all required fields for the new user');
      return;
    }

    try {
      const response = await clientUsersAPI.addUserToClient(formData.client_id, newUserData);
      const newUser = response.data?.data;
      
      if (newUser) {
        setClientUsers([...clientUsers, newUser]);
        setFormData({
          ...formData,
          contact_name: `${newUser.first_name} ${newUser.last_name}`,
          contact_email: newUser.email,
          contact_phone: newUser.phone || ''
        });
        setNewUserData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'user'
        });
        setShowAddUserForm(false);
        toast.success('User added to client successfully!');
      }
    } catch (error) {
      console.error('Error adding user to client:', error);
      toast.error('Failed to add user to client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.description || !formData.client_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await ticketsAPI.create({
        ...formData,
        source: 'portal'
      });
      
      toast.success('Ticket created successfully!');
      navigate('/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Ticket</h1>
        <p className="text-gray-600 mt-1">
          Create a new ITIL service ticket for your customer. This will be tracked through the service lifecycle.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Tooltip content="A brief, descriptive title that summarizes the issue or request. Keep it concise but informative.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Tooltip content="Provide a detailed description of the issue, including steps to reproduce, error messages, and any relevant context. The more information provided, the faster we can resolve your issue.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Detailed description of the issue"
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="client">Customer</Label>
                      <Tooltip content="Select the ITIL Customer organization for this ticket. The customer is the organization that receives your IT services and will be responsible for this ticket.">
                        <QuestionMarkIcon />
                      </Tooltip>
                    </div>
                    <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Tooltip content="Low: Minor issues, non-urgent requests. Medium: Standard issues, normal business impact. High: Significant business impact, urgent issues. Critical: System down, major business disruption.">
                        <QuestionMarkIcon />
                      </Tooltip>
                    </div>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue>
                          {formData.priority ? formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1) : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Tooltip content="Incident: Something is broken or not working as expected. Request: Asking for a new service, feature, or change. Question: Seeking information or clarification. Problem: Root cause of multiple incidents that needs investigation.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue>
                        {formData.type ? formData.type.charAt(0).toUpperCase() + formData.type.slice(1) : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="request">Request</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="problem">Problem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/tickets')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Ticket'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Tooltip content="The name of the person who is reporting this issue or making this request. This helps us know who to contact for additional information.">
                    <QuestionMarkIcon />
                  </Tooltip>
                </div>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  placeholder="Name of the person reporting the issue"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Tooltip content="Email address where we can send updates about this ticket. This is where you'll receive notifications about ticket status changes.">
                    <QuestionMarkIcon />
                  </Tooltip>
                </div>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="Email address"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Tooltip content="Phone number where we can reach you if we need to discuss this ticket. Optional but helpful for urgent issues.">
                    <QuestionMarkIcon />
                  </Tooltip>
                </div>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
            </CardContent>
          </Card>

          {formData.client_id && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Customer Users</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddUserForm(!showAddUserForm)}
                  >
                    {showAddUserForm ? 'Cancel' : 'Add New User'}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  ITIL Users within this customer organization who can be assigned to tickets
                </p>
              </CardHeader>
              <CardContent>
                {showAddUserForm && (
                  <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-3">Add New Customer User</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Add a new ITIL User to this customer organization
                    </p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="First Name"
                          value={newUserData.first_name}
                          onChange={(e) => setNewUserData({...newUserData, first_name: e.target.value})}
                        />
                        <Input
                          placeholder="Last Name"
                          value={newUserData.last_name}
                          onChange={(e) => setNewUserData({...newUserData, last_name: e.target.value})}
                        />
                      </div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                      />
                      <Input
                        placeholder="Phone (optional)"
                        value={newUserData.phone}
                        onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                      />
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddNewUser}
                        >
                          Add User
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddUserForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {clientUsers.length > 0 ? (
                    clientUsers.map(user => (
                      <div
                        key={user.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            contact_name: `${user.first_name} ${user.last_name}`,
                            contact_email: user.email,
                            contact_phone: user.phone || ''
                          });
                        }}
                      >
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        {user.phone && <div className="text-sm text-gray-600">{user.phone}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No customer users found for this customer
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTicketPage; 