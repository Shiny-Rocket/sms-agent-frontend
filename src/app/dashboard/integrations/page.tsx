'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  PlugIcon,
  CopyIcon,
  TrashIcon,
  ExternalLinkIcon,
  ArrowDownIcon,
} from 'lucide-react';
import {
  Integration,
  listIntegrations,
  createIntegration,
  deleteIntegration,
  CreateIntegrationRequest,
} from '@/lib/api/integrations';
import { getErrorMessage } from '@/lib/api/client';

type SortOption = 'recent' | 'name' | 'oldest';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // New integration dialog
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newIntegration, setNewIntegration] = useState<CreateIntegrationRequest>({
    name: '',
    serverUrl: '',
    protocol: 'sse',
    toolApprovalMode: 'fine_grained',
  });
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await listIntegrations();
      setIntegrations(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newIntegration.name || !newIntegration.serverUrl) return;

    try {
      setCreating(true);
      await createIntegration(newIntegration);
      setShowNewDialog(false);
      setNewIntegration({
        name: '',
        serverUrl: '',
        protocol: 'sse',
        toolApprovalMode: 'fine_grained',
      });
      await loadIntegrations();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await deleteIntegration(deleteId);
      setDeleteId(null);
      await loadIntegrations();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Filter and sort integrations
  const filteredIntegrations = integrations
    .filter((integration) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        integration.name.toLowerCase().includes(query) ||
        integration.serverUrl.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-gray-600 mt-1">Create and manage your integrations</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New integration
        </Button>
      </div>

      {/* Search and Sort */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[140px]">
            <ArrowDownIcon className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredIntegrations.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <PlugIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No integrations found' : 'No integrations yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first MCP integration to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowNewDialog(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New integration
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Name</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIntegrations.map((integration) => (
              <TableRow key={integration._id}>
                <TableCell>
                  <Link
                    href={`/dashboard/integrations/${integration._id}`}
                    className="flex items-start gap-3 hover:opacity-80"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <PlugIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {integration.name}
                        <Badge variant="outline" className="text-xs font-normal">
                          Integration
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-[300px]">
                        {integration.serverUrl}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {integration.protocol?.toUpperCase() || 'SSE'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-gray-500">
                  {integration.createdBy || 'Unknown'}
                </TableCell>
                <TableCell className="text-gray-500">
                  {formatDate(integration.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/integrations/${integration._id}`}>
                          <ExternalLinkIcon className="h-4 w-4 mr-2" />
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => copyToClipboard(integration.serverUrl)}
                      >
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteId(integration._id)}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* New Integration Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlugIcon className="h-5 w-5" />
              New Integration
            </DialogTitle>
            <DialogDescription>
              Add an MCP server integration to enable external tools for your agents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Doctor Search MCP"
                value={newIntegration.name}
                onChange={(e) =>
                  setNewIntegration({ ...newIntegration, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serverUrl">Server URL</Label>
              <Input
                id="serverUrl"
                placeholder="https://your-mcp-server.com/sse"
                value={newIntegration.serverUrl}
                onChange={(e) =>
                  setNewIntegration({ ...newIntegration, serverUrl: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select
                value={newIntegration.protocol}
                onValueChange={(v) =>
                  setNewIntegration({
                    ...newIntegration,
                    protocol: v as 'sse' | 'stdio' | 'http',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="stdio">Stdio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approval">Tool Approval Mode</Label>
              <Select
                value={newIntegration.toolApprovalMode}
                onValueChange={(v) =>
                  setNewIntegration({
                    ...newIntegration,
                    toolApprovalMode: v as 'always_ask' | 'fine_grained' | 'no_approval',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always_ask">Always Ask</SelectItem>
                  <SelectItem value="fine_grained">Fine-Grained Tool Approval</SelectItem>
                  <SelectItem value="no_approval">No Approval</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Control how the agent requests permission to use tools from this server.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newIntegration.name || !newIntegration.serverUrl || creating}
            >
              {creating ? 'Creating...' : 'Add integration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Integration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this integration? This action cannot be
              undone and will remove the integration from all agents using it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
