import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tooltip, QuestionMarkIcon } from '../../components/ui/tooltip';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Plus, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string | { text: string };
  notes?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  primary_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    company_name: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    timezone: 'UTC'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const result = await response.json();
      setClients(result.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      const result = await response.json();
      setClients([...clients, result.data]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        company_name: '',
        contact_first_name: '',
        contact_last_name: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        timezone: 'UTC'
      });
      toast.success('Client created successfully');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: typeof client.address === 'string' ? client.address : (client.address as { text: string })?.text || '',
      notes: client.notes || '',
      company_name: '',
      contact_first_name: client.primary_contact?.first_name || '',
      contact_last_name: client.primary_contact?.last_name || '',
      contact_email: client.primary_contact?.email || '',
      contact_phone: client.primary_contact?.phone || '',
      website: '',
      timezone: 'UTC'
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      const result = await response.json();
      setClients(clients.map(client => 
        client.id === editingClient.id ? result.data : client
      ));
      setIsEditModalOpen(false);
      setEditingClient(null);
      toast.success('Client updated successfully');
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage your ITIL Customers - organizations that receive your IT services
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <p className="text-sm text-gray-600">
                Add a new ITIL Customer organization to your service management system
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name">Customer Name</Label>
                    <Tooltip content="The name of the ITIL Customer organization that receives your IT services. This is the primary identifier for the customer in your service management system.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., ACD Bank"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="company_name">Legal Company Name</Label>
                    <Tooltip content="The official legal name of the customer organization for contracts and billing purposes.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="e.g., ACD Banking Corporation Ltd."
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Primary Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="contact_first_name">First Name</Label>
                      <Tooltip content="First name of the primary contact person for this customer.">
                        <QuestionMarkIcon />
                      </Tooltip>
                    </div>
                    <Input
                      id="contact_first_name"
                      name="contact_first_name"
                      value={formData.contact_first_name}
                      onChange={handleChange}
                      placeholder="e.g., Tom"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="contact_last_name">Last Name</Label>
                      <Tooltip content="Last name of the primary contact person for this customer.">
                        <QuestionMarkIcon />
                      </Tooltip>
                    </div>
                    <Input
                      id="contact_last_name"
                      name="contact_last_name"
                      value={formData.contact_last_name}
                      onChange={handleChange}
                      placeholder="e.g., Clark"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="contact_email">Email Address</Label>
                      <Tooltip content="Email address of the primary contact. This will be used for login and communications.">
                        <QuestionMarkIcon />
                      </Tooltip>
                    </div>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      placeholder="e.g., tom.clark@acdbank.com"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="contact_phone">Phone Number</Label>
                      <Tooltip content="Phone number of the primary contact for urgent communications.">
                        <QuestionMarkIcon />
                      </Tooltip>
                    </div>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleChange}
                      placeholder="e.g., +1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Tooltip content="The customer's website URL for reference and documentation.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.acdbank.com"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Tooltip content="The customer's primary timezone for scheduling and communications.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Tooltip content="The customer's business address for billing and service delivery.">
                    <QuestionMarkIcon />
                  </Tooltip>
                </div>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full business address"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Tooltip content="Additional notes about the customer, their requirements, or special considerations.">
                    <QuestionMarkIcon />
                  </Tooltip>
                </div>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes about this customer"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Customer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <p className="text-sm text-gray-600">
              Update the ITIL Customer organization information
            </p>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-name">Customer Name</Label>
                  <Tooltip content="The name of the ITIL Customer organization that receives your IT services. This is the primary identifier for the customer in your service management system.">
                    <QuestionMarkIcon />
                  </Tooltip>
                </div>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., ACD Bank"
                  required
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-company_name">Legal Company Name</Label>
                  <Tooltip content="The official legal name of the customer organization for contracts and billing purposes.">
                    <QuestionMarkIcon />
                  </Tooltip>
                </div>
                <Input
                  id="edit-company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g., ACD Banking Corporation Ltd."
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Primary Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-contact_first_name">First Name</Label>
                    <Tooltip content="First name of the primary contact person for this customer.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Input
                    id="edit-contact_first_name"
                    name="contact_first_name"
                    value={formData.contact_first_name}
                    onChange={handleChange}
                    placeholder="e.g., Tom"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-contact_last_name">Last Name</Label>
                    <Tooltip content="Last name of the primary contact person for this customer.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Input
                    id="edit-contact_last_name"
                    name="contact_last_name"
                    value={formData.contact_last_name}
                    onChange={handleChange}
                    placeholder="e.g., Clark"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-contact_email">Email Address</Label>
                    <Tooltip content="Email address of the primary contact. This will be used for login and communications.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Input
                    id="edit-contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="e.g., tom.clark@acdbank.com"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-contact_phone">Phone Number</Label>
                    <Tooltip content="Phone number of the primary contact for urgent communications.">
                      <QuestionMarkIcon />
                    </Tooltip>
                  </div>
                  <Input
                    id="edit-contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="e.g., +1 (555) 123-4567"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Tooltip content="The customer's website URL for reference and documentation.">
                    <QuestionMarkIcon />
                  </Tooltip>
                </div>
                <Input
                  id="edit-website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://www.acdbank.com"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-timezone">Timezone</Label>
                  <Tooltip content="The customer's primary timezone for scheduling and communications.">
                    <QuestionMarkIcon />
                  </Tooltip>
                </div>
                <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Tooltip content="The customer's business address for billing and service delivery.">
                  <QuestionMarkIcon />
                </Tooltip>
              </div>
              <Textarea
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full business address"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Tooltip content="Additional notes about the customer, their requirements, or special considerations.">
                  <QuestionMarkIcon />
                </Tooltip>
              </div>
              <Textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes about this customer"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Customer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({clients.length})</CardTitle>
          <p className="text-sm text-gray-600">
            ITIL Customers and their associated Users who consume your IT services
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Primary Contact</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No customers found. Add your first ITIL Customer to get started.
                  </td>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      {client.primary_contact ? (
                        <div>
                          <div className="font-medium">
                            {client.primary_contact.first_name} {client.primary_contact.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.primary_contact.email}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <div>No primary contact</div>
                          <div className="text-sm">Set up primary contact</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.primary_contact?.phone || client.phone || '-'}
                    </TableCell>
                    <TableCell>
                      {client.address ? (
                        typeof client.address === 'string' 
                          ? client.address 
                          : (client.address as { text: string }).text || JSON.stringify(client.address)
                      ) : '-'}
                    </TableCell>
                    <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Link to={`/clients/${client.id}/users`}>
                          <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                            👥 Customer Users
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsPage; 