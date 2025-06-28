import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  views: number;
}

const KnowledgeBasePage: React.FC = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch knowledge base articles from API
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
        <Button>Create New Article</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.length === 0 ? (
                <TableRow>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No articles found. Create your first knowledge base article to get started.
                  </td>
                </TableRow>
              ) : (
                articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {article.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{article.author}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(article.status)}>
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{article.views}</TableCell>
                    <TableCell>{new Date(article.updated_at).toLocaleDateString()}</TableCell>
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

export default KnowledgeBasePage; 