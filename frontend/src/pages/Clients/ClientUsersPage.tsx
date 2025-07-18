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
import { Tooltip, QuestionMarkIcon } from '../../components/ui/tooltip';
import { Plus, Search, Filter, X } from 'lucide-react';

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
  const [filteredClientUsers, setFilteredClientUsers] = useState<ClientUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    can_create_tickets: '',
    can_view_all_tickets: '',
    is_active: ''
  });
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

  useEffect(() => {
    applyFilters();
  }, [clientUsers, filters]);

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

  const applyFilters = () => {
    let filtered = [...clientUsers];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.first_name.toLowerCase().includes(searchTerm) ||
        user.last_name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Can create tickets filter
    if (filters.can_create_tickets) {
      const canCreate = filters.can_create_tickets === 'true';
      filtered = filtered.filter(user => user.can_create_tickets === canCreate);
    }

    // Can view all tickets filter
    if (filters.can_view_all_tickets) {
      const canViewAll = filters.can_view_all_tickets === 'true';
      filtered = filtered.filter(user => user.can_view_all_tickets === canViewAll);
    }

    // Active status filter
    if (filters.is_active) {
      const isActive = filters.is_active === 'true';
      filtered = filtered.filter(user => user.is_active === isActive);
    }

    setFilteredClientUsers(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      can_create_tickets: '',
      can_view_all_tickets: '',
      is_active: ''
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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
    if (!window.confirm('Are you sure you want to remove this user from the client?')) return;
    
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
    setFormData({
      ...formData,
      role: value as ClientUser['role']
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {client?.name} - Users
          </h1>
          <p className="text-gray-600 mt-1">
            ITIL Users associated with this Customer organization
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              {(filters.search || filters.role || filters.can_create_tickets || filters.can_view_all_tickets || filters.is_active) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="role-filter">Role</Label>
                <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All roles</SelectItem>
                    <SelectItem value="primary_contact">Primary Contact</SelectItem>
                    <SelectItem value="secondary_contact">Secondary Contact</SelectItem>
                    <SelectItem value="billing_contact">Billing Contact</SelectItem>
                    <SelectItem value="technical_contact">Technical Contact</SelectItem>
                    <SelectItem value="end_user">End User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="create-tickets-filter">Can Create Tickets</Label>
                <Select value={filters.can_create_tickets} onValueChange={(value) => handleFilterChange('can_create_tickets', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All permissions</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="view-all-filter">Can View All Tickets</Label>
                <Select value={filters.can_view_all_tickets} onValueChange={(value) => handleFilterChange('can_view_all_tickets', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All permissions</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="active-filter">Status</Label>
                <Select value={filters.is_active} onValueChange={(value) => handleFilterChange('is_active', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredClientUsers.length} of {clientUsers.length} users
            {(filters.search || filters.role || filters.can_create_tickets || filters.can_view_all_tickets || filters.is_active) && (
              <span className="ml-2 text-blue-600">
                (filtered)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredClientUsers.length})</CardTitle>
          <p className="text-sm text-gray-600">
            ITIL Users associated with this Customer organization
          </p>
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
              {filteredClientUsers.length === 0 ? (
                <TableRow>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {clientUsers.length === 0 
                      ? 'No users found for this customer. Add users to get started.'
                      : 'No users match your current filters. Try adjusting your search criteria.'
                    }
                  </td>
                </TableRow>
              ) : (
                filteredClientUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {user.avatar_url ? (
                            <img
                              className="h-8 w-8 rounded-full"
                              src={user.avatar_url}
                              alt={`${user.first_name} ${user.last_name}`}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.can_create_tickets && (
                          <Badge variant="outline" className="text-xs">
                            Create Tickets
                          </Badge>
                        )}
                        {user.can_view_all_tickets && (
                          <Badge variant="outline" className="text-xs">
                            View All Tickets
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUser(user.user_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Customer User</DialogTitle>
            <p className="text-sm text-gray-600">
              Add a new ITIL User to {client?.name || 'this customer'}. Users are individuals within the customer organization who consume your IT services.
            </p>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="role">Role</Label>
                <Tooltip content="Primary Contact: Main point of contact for all communications. Secondary Contact: Backup contact person. Billing Contact: Handles billing and payments. Technical Contact: Technical decision maker. End User: Regular user with limited access.">
                  <QuestionMarkIcon />
                </Tooltip>
              </div>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="can_create_tickets">Can create tickets</Label>
                <Tooltip content="Allow this user to create new support tickets for this client. This is typically enabled for primary contacts and technical contacts.">
                  <QuestionMarkIcon />
                </Tooltip>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="can_view_all_tickets"
                checked={formData.can_view_all_tickets}
                onChange={(e) => setFormData({...formData, can_view_all_tickets: e.target.checked})}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="can_view_all_tickets">Can view all tickets</Label>
                <Tooltip content="Allow this user to view all tickets for this client, not just the ones they created. Useful for managers and primary contacts.">
                  <QuestionMarkIcon />
                </Tooltip>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Tooltip content="Additional information about this user's role, responsibilities, or special requirements for your team's reference.">
                  <QuestionMarkIcon />
                </Tooltip>
              </div>
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