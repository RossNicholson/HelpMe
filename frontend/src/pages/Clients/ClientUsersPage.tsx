import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { clientsAPI } from '../../services/api';

interface ClientUser {
  id: string;
  user_id: string;
  client_id: string;
  organization_id: string;
  role: 'primary_contact' | 'secondary_contact' | 'billing_contact' | 'technical_contact' | 'end_user';
  can_create_tickets: boolean;
  can_view_all_tickets: boolean;
  is_active: boolean;
  permissions: any;
  notes?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface Client {
  id: string;
  name: string;
  company_name?: string;
}

const ClientUsersPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    role: 'end_user' as ClientUser['role'],
    can_create_tickets: true,
    can_view_all_tickets: false,
    notes: ''
  });

  useEffect(() => {
    if (clientId) {
      fetchClientUsers();
      fetchAvailableUsers();
      fetchClient();
    }
  }, [clientId]);

  const fetchClientUsers = async () => {
    try {
      const response = await fetch(`/api/client-users/clients/${clientId}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setClientUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching client users:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchClient = async () => {
    try {
      const response = await clientsAPI.getById(clientId!);
      if (response.data.success) {
        setClient(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch(`/api/client-users/clients/${clientId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setIsAddDialogOpen(false);
        setFormData({
          userId: '',
          role: 'end_user',
          can_create_tickets: true,
          can_view_all_tickets: false,
          notes: ''
        });
        fetchClientUsers();
      }
    } catch (error) {
      console.error('Error adding user to client:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/client-users/client-users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        setFormData({
          userId: '',
          role: 'end_user',
          can_create_tickets: true,
          can_view_all_tickets: false,
          notes: ''
        });
        fetchClientUsers();
      }
    } catch (error) {
      console.error('Error updating client user:', error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the client?')) return;
    
    try {
      const response = await fetch(`/api/client-users/clients/${clientId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchClientUsers();
      }
    } catch (error) {
      console.error('Error removing user from client:', error);
    }
  };

  const openEditDialog = (user: ClientUser) => {
    setSelectedUser(user);
    setFormData({
      userId: user.user_id,
      role: user.role,
      can_create_tickets: user.can_create_tickets,
      can_view_all_tickets: user.can_view_all_tickets,
      notes: user.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'primary_contact': return 'bg-blue-100 text-blue-800';
      case 'secondary_contact': return 'bg-green-100 text-green-800';
      case 'billing_contact': return 'bg-purple-100 text-purple-800';
      case 'technical_contact': return 'bg-orange-100 text-orange-800';
      case 'end_user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData({...formData, role: value as ClientUser['role']});
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Client Users</h1>
          <p className="text-gray-600">
            Manage users for {client?.name || 'Client'}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add User to Client</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add User to Client</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">User</Label>
                <Select value={formData.userId} onValueChange={(value) => setFormData({...formData, userId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers
                      .filter(user => !clientUsers.find(cu => cu.user_id === user.id))
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value as ClientUser['role']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary_contact">Primary Contact</SelectItem>
                    <SelectItem value="secondary_contact">Secondary Contact</SelectItem>
                    <SelectItem value="billing_contact">Billing Contact</SelectItem>
                    <SelectItem value="technical_contact">Technical Contact</SelectItem>
                    <SelectItem value="end_user">End User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="can_create_tickets"
                  checked={formData.can_create_tickets}
                  onChange={(e) => setFormData({...formData, can_create_tickets: e.target.checked})}
                />
                <Label htmlFor="can_create_tickets">Can create tickets</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="can_view_all_tickets"
                  checked={formData.can_view_all_tickets}
                  onChange={(e) => setFormData({...formData, can_view_all_tickets: e.target.checked})}
                />
                <Label htmlFor="can_view_all_tickets">Can view all tickets</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optional notes about this user's role"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>Add User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users for {client?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                      {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.can_create_tickets && (
                        <Badge variant="secondary" className="text-xs">Create Tickets</Badge>
                      )}
                      {user.can_view_all_tickets && (
                        <Badge variant="secondary" className="text-xs">View All Tickets</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveUser(user.user_id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Client User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value as ClientUser['role']})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary_contact">Primary Contact</SelectItem>
                  <SelectItem value="secondary_contact">Secondary Contact</SelectItem>
                  <SelectItem value="billing_contact">Billing Contact</SelectItem>
                  <SelectItem value="technical_contact">Technical Contact</SelectItem>
                  <SelectItem value="end_user">End User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-can_create_tickets"
                checked={formData.can_create_tickets}
                onChange={(e) => setFormData({...formData, can_create_tickets: e.target.checked})}
              />
              <Label htmlFor="edit-can_create_tickets">Can create tickets</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-can_view_all_tickets"
                checked={formData.can_view_all_tickets}
                onChange={(e) => setFormData({...formData, can_view_all_tickets: e.target.checked})}
              />
              <Label htmlFor="edit-can_view_all_tickets">Can view all tickets</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Optional notes about this user's role"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientUsersPage; 