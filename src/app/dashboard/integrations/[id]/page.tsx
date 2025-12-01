'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeftIcon,
  PlugIcon,
  CopyIcon,
  ShieldIcon,
  WrenchIcon,
  UsersIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  CircleIcon,
  CheckCircleIcon,
  BanIcon,
} from 'lucide-react';
import {
  Integration,
  IntegrationTool,
  ToolApprovalMode,
  getIntegration,
  updateIntegration,
  refreshIntegrationTools,
} from '@/lib/api/integrations';
import { getErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';

type ToolApprovalSetting = 'disabled' | 'ask' | 'auto';

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [toolApprovalMode, setToolApprovalMode] = useState<ToolApprovalMode>('fine_grained');
  const [forcePreToolSpeech, setForcePreToolSpeech] = useState(false);
  const [disableInterruptions, setDisableInterruptions] = useState(false);
  const [toolSettings, setToolSettings] = useState<Record<string, ToolApprovalSetting>>({});

  // Expanded tool state
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadIntegration();
  }, [id]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      const data = await getIntegration(id);
      setIntegration(data);
      setToolApprovalMode(data.toolApprovalMode || 'fine_grained');
      setForcePreToolSpeech(data.forcePreToolSpeech || false);
      setDisableInterruptions(data.disableInterruptions || false);

      // Initialize tool settings
      const settings: Record<string, ToolApprovalSetting> = {};
      data.tools?.forEach((tool) => {
        settings[tool.id] = tool.approvalMode || 'auto';
      });
      setToolSettings(settings);

      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!integration) return;

    try {
      setSaving(true);
      const updatedTools = integration.tools?.map((tool) => ({
        ...tool,
        approvalMode: toolSettings[tool.id] || 'auto',
      }));

      await updateIntegration(id, {
        toolApprovalMode,
        forcePreToolSpeech,
        disableInterruptions,
        tools: updatedTools,
      });

      await loadIntegration();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshTools = async () => {
    try {
      setRefreshing(true);
      await refreshIntegrationTools(id);
      await loadIntegration();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleToolExpanded = (toolId: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const getApprovalIcon = (mode: ToolApprovalSetting) => {
    switch (mode) {
      case 'disabled':
        return <BanIcon className="h-4 w-4 text-gray-400" />;
      case 'ask':
        return <CircleIcon className="h-4 w-4 text-yellow-500" />;
      case 'auto':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Integration not found</h2>
          <p className="text-gray-600 mb-4">
            The integration you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/dashboard/integrations">
            <Button>Back to Integrations</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/integrations">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
            <PlugIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{integration.name}</h1>
              <Badge variant="outline">Integration</Badge>
            </div>
            <p className="text-sm text-gray-500">{integration.integrationId}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Overview Tab */}
      <div className="space-y-6">
        {/* Server URL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PlugIcon className="h-4 w-4" />
              Server URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm truncate">
                {integration.serverUrl}
              </code>
              <Badge variant="secondary">{integration.protocol?.toUpperCase() || 'SSE'}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(integration.serverUrl)}
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldIcon className="h-4 w-4" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tool Approval Mode */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Tool Approval Mode</Label>
              <p className="text-sm text-gray-500">
                Control how the agent requests permission to use tools from this MCP server.
              </p>

              <div className="space-y-3">
                {/* Always Ask */}
                <div
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-colors',
                    toolApprovalMode === 'always_ask'
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  )}
                  onClick={() => setToolApprovalMode('always_ask')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        toolApprovalMode === 'always_ask' ? 'bg-blue-100' : 'bg-gray-100'
                      )}
                    >
                      <ShieldIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Always Ask</span>
                        <Badge variant="outline" className="text-xs">
                          Recommended
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Maximum security. The agent will request your permission before each tool
                        use.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fine-Grained */}
                <div
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-colors',
                    toolApprovalMode === 'fine_grained'
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  )}
                  onClick={() => setToolApprovalMode('fine_grained')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        toolApprovalMode === 'fine_grained' ? 'bg-blue-100' : 'bg-gray-100'
                      )}
                    >
                      <WrenchIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">Fine-Grained Tool Approval</span>
                      <p className="text-sm text-gray-500">
                        Disable &amp; pre-select tools which can run automatically &amp; those
                        requiring approval.
                      </p>
                    </div>
                  </div>
                </div>

                {/* No Approval */}
                <div
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-colors',
                    toolApprovalMode === 'no_approval'
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  )}
                  onClick={() => setToolApprovalMode('no_approval')}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        toolApprovalMode === 'no_approval' ? 'bg-blue-100' : 'bg-gray-100'
                      )}
                    >
                      <XIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">No Approval</span>
                      <p className="text-sm text-gray-500">
                        The assistant can use any tool without approval.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tool Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <WrenchIcon className="h-4 w-4" />
              Tool Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Force pre-tool Speech</Label>
                <p className="text-sm text-gray-500">
                  By default the agent will speak if recent execution times are long but you can
                  force it to speak before every tool execution.
                </p>
              </div>
              <Switch
                checked={forcePreToolSpeech}
                onCheckedChange={setForcePreToolSpeech}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium">Disable Interruptions</Label>
                <p className="text-sm text-gray-500">
                  Disable user interruptions while tools from this server are running.
                </p>
              </div>
              <Switch
                checked={disableInterruptions}
                onCheckedChange={setDisableInterruptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dependent Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Dependent agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {integration.dependentAgentIds && integration.dependentAgentIds.length > 0 ? (
              <ul className="space-y-2">
                {integration.dependentAgentIds.map((agentId) => (
                  <li key={agentId}>
                    <Link
                      href={`/dashboard/agents/${agentId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {agentId}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No agents are currently using this integration.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Available Tools */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <WrenchIcon className="h-4 w-4" />
                Available tools
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshTools}
                disabled={refreshing}
              >
                <RefreshCwIcon
                  className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')}
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {integration.tools && integration.tools.length > 0 ? (
              <div className="space-y-2">
                {integration.tools.map((tool) => (
                  <div key={tool.id} className="border rounded-lg">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleToolExpanded(tool.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <WrenchIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <span className="font-medium">{tool.name}</span>
                          <p className="text-sm text-gray-500">
                            {tool.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {toolApprovalMode === 'fine_grained' && (
                          <div className="flex items-center gap-1 border rounded-lg p-1">
                            <button
                              className={cn(
                                'p-1 rounded',
                                toolSettings[tool.id] === 'disabled' && 'bg-gray-200'
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setToolSettings((prev) => ({
                                  ...prev,
                                  [tool.id]: 'disabled',
                                }));
                              }}
                              title="Disabled"
                            >
                              <BanIcon className="h-4 w-4 text-gray-400" />
                            </button>
                            <button
                              className={cn(
                                'p-1 rounded',
                                toolSettings[tool.id] === 'ask' && 'bg-yellow-100'
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setToolSettings((prev) => ({
                                  ...prev,
                                  [tool.id]: 'ask',
                                }));
                              }}
                              title="Ask for approval"
                            >
                              <CircleIcon className="h-4 w-4 text-yellow-500" />
                            </button>
                            <button
                              className={cn(
                                'p-1 rounded',
                                toolSettings[tool.id] === 'auto' && 'bg-green-100'
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setToolSettings((prev) => ({
                                  ...prev,
                                  [tool.id]: 'auto',
                                }));
                              }}
                              title="Auto-approve"
                            >
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            </button>
                          </div>
                        )}
                        <ChevronDownIcon
                          className={cn(
                            'h-4 w-4 text-gray-400 transition-transform',
                            expandedTools[tool.id] && 'rotate-180'
                          )}
                        />
                      </div>
                    </div>

                    {/* Expanded tool parameters */}
                    {expandedTools[tool.id] && tool.parameters && tool.parameters.length > 0 && (
                      <div className="border-t px-4 py-3 bg-gray-50">
                        <h4 className="text-sm font-medium mb-3">Parameters</h4>
                        <div className="space-y-3">
                          {tool.parameters.map((param) => (
                            <div
                              key={param.id}
                              className="flex items-start justify-between p-3 bg-white rounded-lg border"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm">{param.name}</span>
                                  {param.required && (
                                    <Badge variant="outline" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{param.description}</p>
                              </div>
                              <Badge variant="secondary">{param.type}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <WrenchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tools available from this integration.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleRefreshTools}
                  disabled={refreshing}
                >
                  <RefreshCwIcon
                    className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')}
                  />
                  Refresh tools
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
