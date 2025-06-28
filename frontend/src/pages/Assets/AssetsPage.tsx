import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: string;
  serial_number: string;
  client_name: string;
  status: string;
  purchase_date: string;
  warranty_expiry: string;
}

const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    client_name: '',
    warranty_expired: ''
  });

  useEffect(() => {
    // TODO: Fetch assets from API
    // For now, using mock data
    const mockAssets: Asset[] = [
      {
        id: '1',
        name: 'Dell Latitude 5520',
        type: 'laptop',
        serial_number: 'DL123456789',
        client_name: 'ACD Bank',
        status: 'active',
        purchase_date: '2023-01-15',
        warranty_expiry: '2026-01-15'
      },
      {
        id: '2',
        name: 'HP ProBook 450',
        type: 'laptop',
        serial_number: 'HP987654321',
        client_name: 'TechCorp',
        status: 'maintenance',
        purchase_date: '2022-08-20',
        warranty_expiry: '2025-08-20'
      },
      {
        id: '3',
        name: 'Cisco Catalyst 2960',
        type: 'network',
        serial_number: 'CS456789123',
        client_name: 'ACD Bank',
        status: 'active',
        purchase_date: '2023-03-10',
        warranty_expiry: '2028-03-10'
      }
    ];
    setAssets(mockAssets);
    setLoading(false);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assets, filters]);

  const applyFilters = () => {
    let filtered = [...assets];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.serial_number.toLowerCase().includes(searchTerm) ||
        asset.client_name.toLowerCase().includes(searchTerm)
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(asset => asset.type === filters.type);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(asset => asset.status === filters.status);
    }

    // Client filter
    if (filters.client_name) {
      filtered = filtered.filter(asset => asset.client_name === filters.client_name);
    }

    // Warranty filter
    if (filters.warranty_expired) {
      const today = new Date();
      if (filters.warranty_expired === 'expired') {
        filtered = filtered.filter(asset => new Date(asset.warranty_expiry) < today);
      } else if (filters.warranty_expired === 'active') {
        filtered = filtered.filter(asset => new Date(asset.warranty_expiry) >= today);
      }
    }

    setFilteredAssets(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      client_name: '',
      warranty_expired: ''
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'laptop': return 'bg-blue-100 text-blue-800';
      case 'desktop': return 'bg-green-100 text-green-800';
      case 'server': return 'bg-purple-100 text-purple-800';
      case 'network': return 'bg-orange-100 text-orange-800';
      case 'printer': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
        <Button>Add New Asset</Button>
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
              {(filters.search || filters.type || filters.status || filters.client_name || filters.warranty_expired) && (
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
                placeholder="Search assets by name, serial number, or client..."
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
                <Label htmlFor="type-filter">Type</Label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="printer">Printer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client-filter">Client</Label>
                <Select value={filters.client_name} onValueChange={(value) => handleFilterChange('client_name', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All clients</SelectItem>
                    {Array.from(new Set(assets.map(asset => asset.client_name))).map(client => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="warranty-filter">Warranty Status</Label>
                <Select value={filters.warranty_expired} onValueChange={(value) => handleFilterChange('warranty_expired', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All warranties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All warranties</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredAssets.length} of {assets.length} assets
            {(filters.search || filters.type || filters.status || filters.client_name || filters.warranty_expired) && (
              <span className="ml-2 text-blue-600">
                (filtered)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Warranty Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    {assets.length === 0 
                      ? 'No assets found. Add your first asset to get started.'
                      : 'No assets match your current filters. Try adjusting your search criteria.'
                    }
                  </td>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(asset.type)}>
                        {asset.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{asset.serial_number}</TableCell>
                    <TableCell>{asset.client_name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(asset.purchase_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{new Date(asset.warranty_expiry).toLocaleDateString()}</span>
                        {new Date(asset.warranty_expiry) < new Date() && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View</Button>
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

export default AssetsPage; 