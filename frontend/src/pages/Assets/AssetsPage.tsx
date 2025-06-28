import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

interface Asset {
  id: string;
  name: string;
  type: 'computer' | 'server' | 'network' | 'software' | 'other';
  serial_number: string;
  client_name: string;
  status: 'active' | 'maintenance' | 'retired';
  purchase_date: string;
  warranty_expiry: string;
}

const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch assets from API
    setLoading(false);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'computer': return 'bg-blue-100 text-blue-800';
      case 'server': return 'bg-purple-100 text-purple-800';
      case 'network': return 'bg-green-100 text-green-800';
      case 'software': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
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
              {assets.length === 0 ? (
                <TableRow>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No assets found. Add your first asset to get started.
                  </td>
                </TableRow>
              ) : (
                assets.map((asset) => (
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
                    <TableCell>{new Date(asset.warranty_expiry).toLocaleDateString()}</TableCell>
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