'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SearchIcon,
  MoreHorizontalIcon,
  WrenchIcon,
  WebhookIcon,
  KeyIcon,
  TrashIcon,
  ExternalLinkIcon,
  PlusIcon,
  XIcon,
  GripVerticalIcon,
} from 'lucide-react';
import {
  Tool,
  ToolType,
  ToolParameter,
  ToolHeader,
  DynamicVariableAssignment,
  HttpMethod,
  listTools,
  createWebhookTool,
  createClientTool,
  deleteTool,
  CreateWebhookToolRequest,
  CreateClientToolRequest,
} from '@/lib/api/tools';
import { getErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ToolType | 'all'>('all');

  // Dialog state
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Webhook form state
  const [webhookForm, setWebhookForm] = useState<CreateWebhookToolRequest>({
    name: '',
    description: '',
    url: '',
    method: 'GET',
    headers: [],
    responseTimeoutSecs: 20,
    disableInterruptions: false,
    forcePreToolSpeech: 'auto',
  });

  // Client form state
  const [clientForm, setClientForm] = useState<CreateClientToolRequest>({
    name: '',
    description: '',
    waitForResponse: false,
    parameters: [],
    disableInterruptions: false,
    forcePreToolSpeech: 'auto',
  });

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // JSON edit mode for client tool
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonContent, setJsonContent] = useState('');

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const data = await listTools();
      setTools(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookForm.name || !webhookForm.url) return;

    try {
      setCreating(true);
      await createWebhookTool(webhookForm);
      setShowWebhookDialog(false);
      resetWebhookForm();
      await loadTools();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleCreateClient = async () => {
    if (!clientForm.name) return;

    try {
      setCreating(true);

      let formData = clientForm;
      if (jsonMode) {
        try {
          formData = JSON.parse(jsonContent);
        } catch {
          setError('Invalid JSON format');
          setCreating(false);
          return;
        }
      }

      await createClientTool(formData);
      setShowClientDialog(false);
      resetClientForm();
      await loadTools();
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
      await deleteTool(deleteId);
      setDeleteId(null);
      await loadTools();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const resetWebhookForm = () => {
    setWebhookForm({
      name: '',
      description: '',
      url: '',
      method: 'GET',
      headers: [],
      responseTimeoutSecs: 20,
      disableInterruptions: false,
      forcePreToolSpeech: 'auto',
    });
  };

  const resetClientForm = () => {
    setClientForm({
      name: '',
      description: '',
      waitForResponse: false,
      parameters: [],
      disableInterruptions: false,
      forcePreToolSpeech: 'auto',
    });
    setJsonContent('');
    setJsonMode(false);
  };

  const addWebhookHeader = () => {
    setWebhookForm({
      ...webhookForm,
      headers: [...(webhookForm.headers || []), { key: '', value: '' }],
    });
  };

  const updateWebhookHeader = (index: number, field: 'key' | 'value', value: string) => {
    const headers = [...(webhookForm.headers || [])];
    headers[index] = { ...headers[index], [field]: value };
    setWebhookForm({ ...webhookForm, headers });
  };

  const removeWebhookHeader = (index: number) => {
    const headers = [...(webhookForm.headers || [])];
    headers.splice(index, 1);
    setWebhookForm({ ...webhookForm, headers });
  };

  const addClientParameter = () => {
    const newParam: ToolParameter = {
      id: `param_${Date.now()}`,
      identifier: '',
      type: 'string',
      required: true,
      valueType: 'llm_prompt',
      description: '',
    };
    setClientForm({
      ...clientForm,
      parameters: [...(clientForm.parameters || []), newParam],
    });
  };

  const updateClientParameter = (index: number, updates: Partial<ToolParameter>) => {
    const parameters = [...(clientForm.parameters || [])];
    parameters[index] = { ...parameters[index], ...updates };
    setClientForm({ ...clientForm, parameters });
  };

  const removeClientParameter = (index: number) => {
    const parameters = [...(clientForm.parameters || [])];
    parameters.splice(index, 1);
    setClientForm({ ...clientForm, parameters });
  };

  // Filter tools
  const filteredTools = tools.filter((tool) => {
    if (typeFilter !== 'all' && tool.type !== typeFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.description?.toLowerCase().includes(query) ||
      tool.url?.toLowerCase().includes(query)
    );
  });

  const getToolIcon = (type: ToolType) => {
    switch (type) {
      case 'webhook':
        return <WebhookIcon className="h-5 w-5 text-blue-600" />;
      case 'client':
        return <KeyIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <WrenchIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const switchToJsonMode = () => {
    const jsonObj = {
      type: 'client',
      name: clientForm.name,
      description: clientForm.description,
      expects_response: clientForm.waitForResponse,
      response_timeout_secs: 1,
      parameters: (clientForm.parameters || []).map((p) => ({
        id: p.identifier,
        type: p.type,
        description: p.description,
        dynamic_variable: '',
        required: p.required,
        constant_value: '',
        value_type: p.valueType,
      })),
      dynamic_variables: {},
      dynamic_variable_placeholders: {},
      assignments: [],
      disable_interruptions: clientForm.disableInterruptions,
      force_pre_tool_speech: clientForm.forcePreToolSpeech,
    };
    setJsonContent(JSON.stringify(jsonObj, null, 2));
    setJsonMode(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tools</h1>
        <p className="text-gray-600 mt-1">Create and manage webhook and client tools</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => setShowWebhookDialog(true)}>
          <WebhookIcon className="h-4 w-4 mr-2" />
          Add webhook tool
        </Button>
        <Button variant="outline" onClick={() => setShowClientDialog(true)}>
          <KeyIcon className="h-4 w-4 mr-2" />
          Add client tool
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as ToolType | 'all')}
        >
          <SelectTrigger className="w-[140px]">
            <PlusIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="client">Client</SelectItem>
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
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <WrenchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || typeFilter !== 'all' ? 'No tools found' : 'No tools yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first tool to get started'}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTools.map((tool) => (
              <TableRow key={tool._id}>
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      {getToolIcon(tool.type)}
                    </div>
                    <div>
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[300px]">
                        {tool.url || 'Client tool'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-600 truncate max-w-[300px]">
                    {tool.description || 'No description'}
                  </p>
                </TableCell>
                <TableCell className="text-gray-500">{tool.createdBy || 'Unknown'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/tools/${tool._id}`}>
                          <ExternalLinkIcon className="h-4 w-4 mr-2" />
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteId(tool._id)}
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

      {/* Add Webhook Tool Dialog */}
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WebhookIcon className="h-5 w-5" />
              Add webhook tool
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Configuration Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Configuration</CardTitle>
                <CardDescription>
                  Describe to the LLM how and when to use the tool.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Name</Label>
                  <Input
                    id="webhook-name"
                    placeholder="e.g., send_sms"
                    value={webhookForm.name}
                    onChange={(e) =>
                      setWebhookForm({ ...webhookForm, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-description">Description</Label>
                  <Textarea
                    id="webhook-description"
                    placeholder="Describe when the agent should use this tool..."
                    value={webhookForm.description}
                    onChange={(e) =>
                      setWebhookForm({ ...webhookForm, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="w-[100px] space-y-2">
                    <Label>Method</Label>
                    <Select
                      value={webhookForm.method}
                      onValueChange={(v) =>
                        setWebhookForm({ ...webhookForm, method: v as HttpMethod })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="webhook-url">URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://api.example.com/webhook"
                      value={webhookForm.url}
                      onChange={(e) =>
                        setWebhookForm({ ...webhookForm, url: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Response timeout (seconds)</Label>
                  <p className="text-xs text-gray-500">
                    How long to wait for the client tool to respond before timing out. Default
                    is 20 seconds.
                  </p>
                  <Input
                    type="range"
                    min={1}
                    max={60}
                    value={webhookForm.responseTimeoutSecs || 20}
                    onChange={(e) =>
                      setWebhookForm({
                        ...webhookForm,
                        responseTimeoutSecs: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600">
                    {webhookForm.responseTimeoutSecs || 20}s
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Disable interruptions</Label>
                    <p className="text-xs text-gray-500">
                      Select this box to disable interruptions while the tool is running.
                    </p>
                  </div>
                  <Switch
                    checked={webhookForm.disableInterruptions}
                    onCheckedChange={(checked) =>
                      setWebhookForm({ ...webhookForm, disableInterruptions: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pre-tool speech</Label>
                  <p className="text-xs text-gray-500">
                    Force agent speech before tool execution or let it decide automatically
                    based on recent execution times.
                  </p>
                  <Select
                    value={webhookForm.forcePreToolSpeech || 'auto'}
                    onValueChange={(v) =>
                      setWebhookForm({
                        ...webhookForm,
                        forcePreToolSpeech: v as 'auto' | 'always' | 'never',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="always">Always</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Headers Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Headers</CardTitle>
                    <CardDescription>
                      Define headers that will be sent with the request
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addWebhookHeader}>
                    Add header
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {webhookForm.headers && webhookForm.headers.length > 0 ? (
                  <div className="space-y-2">
                    {webhookForm.headers.map((header, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="Header name"
                          value={header.key}
                          onChange={(e) => updateWebhookHeader(index, 'key', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Header value"
                          value={header.value}
                          onChange={(e) =>
                            updateWebhookHeader(index, 'value', e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWebhookHeader(index)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No headers defined</p>
                )}
              </CardContent>
            </Card>

            {/* Query Parameters & Dynamic Variables would go here */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Query parameters</CardTitle>
                <CardDescription>
                  Define parameters that will be collected by the LLM and sent as the query of
                  the request.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  Add param
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dynamic Variables</CardTitle>
                <CardDescription>
                  Variables in tool parameters will be replaced with actual values when the
                  conversation starts. <Link href="#" className="text-blue-600">Learn more</Link>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dynamic Variable Assignments</CardTitle>
                <CardDescription>
                  Configure which dynamic variables can be updated when this tool returns a
                  response. <Link href="#" className="text-blue-600">Learn more</Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  Add assignment
                </Button>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-gray-500">
              {'</>'} Edit as JSON
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowWebhookDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateWebhook}
                disabled={!webhookForm.name || !webhookForm.url || creating}
              >
                {creating ? 'Creating...' : 'Add tool'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Tool Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              Add client tool
              {jsonMode && (
                <Badge variant="secondary" className="ml-2">
                  JSON Mode
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {jsonMode ? (
            <div className="py-4">
              <p className="text-sm text-gray-500 mb-4">
                Edit the tool configuration as JSON. Make sure to maintain the correct structure.
              </p>
              <Textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Configuration Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Configuration</CardTitle>
                  <CardDescription>
                    Describe to the LLM how and when to use the tool.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Name</Label>
                    <Input
                      id="client-name"
                      placeholder="e.g., lookup_user"
                      value={clientForm.name}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-description">Description</Label>
                    <Textarea
                      id="client-description"
                      placeholder="Describe when the agent should use this tool..."
                      value={clientForm.description}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label>Wait for response</Label>
                      <p className="text-xs text-gray-500">
                        Select this box to make the agent wait for the tool to finish executing
                        before resuming the conversation.
                      </p>
                    </div>
                    <Switch
                      checked={clientForm.waitForResponse}
                      onCheckedChange={(checked) =>
                        setClientForm({ ...clientForm, waitForResponse: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label>Disable interruptions</Label>
                      <p className="text-xs text-gray-500">
                        Select this box to disable interruptions while the tool is running.
                      </p>
                    </div>
                    <Switch
                      checked={clientForm.disableInterruptions}
                      onCheckedChange={(checked) =>
                        setClientForm({ ...clientForm, disableInterruptions: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pre-tool speech</Label>
                    <p className="text-xs text-gray-500">
                      Force agent speech before tool execution or let it decide automatically
                      based on recent execution times.
                    </p>
                    <Select
                      value={clientForm.forcePreToolSpeech || 'auto'}
                      onValueChange={(v) =>
                        setClientForm({
                          ...clientForm,
                          forcePreToolSpeech: v as 'auto' | 'always' | 'never',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="always">Always</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Parameters Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Parameters</CardTitle>
                      <CardDescription>
                        Define the parameters that will be sent with the event.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addClientParameter}>
                      Add param
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {clientForm.parameters && clientForm.parameters.length > 0 ? (
                    <div className="space-y-4">
                      {clientForm.parameters.map((param, index) => (
                        <div key={param.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-[100px] space-y-2">
                              <Label>Data type</Label>
                              <Select
                                value={param.type}
                                onValueChange={(v) =>
                                  updateClientParameter(index, {
                                    type: v as ToolParameter['type'],
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="object">Object</SelectItem>
                                  <SelectItem value="array">Array</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>Identifier</Label>
                              <Input
                                placeholder="e.g., user_id"
                                value={param.identifier}
                                onChange={(e) =>
                                  updateClientParameter(index, { identifier: e.target.value })
                                }
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeClientParameter(index)}
                              className="self-end"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={param.required}
                              onCheckedChange={(checked) =>
                                updateClientParameter(index, { required: checked })
                              }
                            />
                            <Label>Required</Label>
                          </div>

                          <div className="space-y-2">
                            <Label>Value Type</Label>
                            <Select
                              value={param.valueType}
                              onValueChange={(v) =>
                                updateClientParameter(index, {
                                  valueType: v as ToolParameter['valueType'],
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="llm_prompt">LLM Prompt</SelectItem>
                                <SelectItem value="constant">Constant</SelectItem>
                                <SelectItem value="dynamic_variable">Dynamic Variable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              placeholder="This field will be passed to the LLM and should describe in detail how to extract the data from the transcript."
                              value={param.description || ''}
                              onChange={(e) =>
                                updateClientParameter(index, { description: e.target.value })
                              }
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Enum Values (optional)</Label>
                            <Input
                              placeholder="Enter an enum value"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const value = (e.target as HTMLInputElement).value.trim();
                                  if (value) {
                                    updateClientParameter(index, {
                                      enumValues: [...(param.enumValues || []), value],
                                    });
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              }}
                            />
                            <p className="text-xs text-gray-500">
                              Add predefined values that the LLM can select from. If no values are
                              provided, the LLM can use any string value.
                            </p>
                            {param.enumValues && param.enumValues.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {param.enumValues.map((value, i) => (
                                  <Badge key={i} variant="secondary" className="gap-1">
                                    {value}
                                    <button
                                      onClick={() =>
                                        updateClientParameter(index, {
                                          enumValues: param.enumValues?.filter((_, j) => j !== i),
                                        })
                                      }
                                    >
                                      <XIcon className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No parameters defined</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500"
              onClick={() => (jsonMode ? setJsonMode(false) : switchToJsonMode())}
            >
              {jsonMode ? 'Switch to Form' : '</> Edit as JSON'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowClientDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateClient}
                disabled={(!jsonMode && !clientForm.name) || creating}
              >
                {creating ? 'Creating...' : 'Add tool'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tool</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tool? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
