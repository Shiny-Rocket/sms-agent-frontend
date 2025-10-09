'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAgent, updateAgent, deleteAgent, type Agent, type UpdateAgentRequest, getAgentWebhookUrl } from '@/lib/api/agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeftIcon, CopyIcon, TrashIcon, CheckIcon } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/api/client';

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const agentId = params.id as string;

  const [formData, setFormData] = useState<UpdateAgentRequest>({});
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedAgentId, setCopiedAgentId] = useState(false);

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => getAgent(agentId),
  });

  const updateMutation = useMutation({
    mutationFn: (updates: UpdateAgentRequest) => updateAgent(agentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAgent(agentId),
    onSuccess: () => {
      router.push('/dashboard/agents');
    },
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        phoneNumber: agent.phoneNumber,
        provider: agent.provider,
        systemPrompt: agent.systemPrompt,
        status: agent.status,
      });
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${agent?.name}"? This action cannot be undone.`)) {
      await deleteMutation.mutateAsync();
    }
  };

  const handleCopyWebhook = async () => {
    if (agent) {
      const webhookUrl = getAgentWebhookUrl(agent.agentId, agent.provider);
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Agent not found</p>
          <Link href="/dashboard/agents">
            <Button className="mt-4">Back to Agents</Button>
          </Link>
        </div>
      </div>
    );
  }

  const webhookUrl = getAgentWebhookUrl(agent.agentId, agent.provider);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1">
              <span className="text-xs font-mono text-gray-600" title={agent.agentId || agent._id}>
                ID: {(agent.agentId || agent._id).slice(0, 8)}...
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(agent.agentId || agent._id);
                  setCopiedAgentId(true);
                  setTimeout(() => setCopiedAgentId(false), 2000);
                }}
                title="Copy full Agent ID"
              >
                {copiedAgentId ? (
                  <CheckIcon className="h-3 w-3 text-green-600" />
                ) : (
                  <CopyIcon className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            {agent.phoneNumber} • {agent.provider}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
            {agent.status}
          </Badge>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="agent" className="space-y-6">
        <TabsList>
          <TabsTrigger value="agent">Agent</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="agent">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Configure your agent's name, phone number, and SMS provider
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Phone number in E.164 format (e.g., +1234567890)
                  </p>
                </div>

                {/* Provider */}
                <div className="space-y-2">
                  <Label htmlFor="provider">SMS Provider *</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value: 'telnyx' | 'vonage') =>
                      setFormData({ ...formData, provider: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="telnyx">Telnyx</SelectItem>
                      <SelectItem value="vonage">Vonage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">System Prompt *</Label>
                  <Textarea
                    id="systemPrompt"
                    value={formData.systemPrompt || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, systemPrompt: e.target.value })
                    }
                    rows={12}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Instructions that define how the agent should behave
                  </p>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Agent['status']) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Error Message */}
                {updateMutation.isError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">
                      {getErrorMessage(updateMutation.error)}
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {updateMutation.isSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">
                      Agent updated successfully
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
                </CardContent>
              </Card>

              {/* Agent Language */}
              <Card>
                <CardHeader>
                  <CardTitle>Agent Language</CardTitle>
                  <CardDescription>
                    Choose the default language the agent will communicate in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                        <SelectItem value="fr">🇫🇷 French</SelectItem>
                        <SelectItem value="de">🇩🇪 German</SelectItem>
                        <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Languages */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Languages</CardTitle>
                  <CardDescription>
                    Specify additional languages which users can choose from
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm">
                    + Add additional languages
                  </Button>
                </CardContent>
              </Card>

              {/* First Message */}
              <Card>
                <CardHeader>
                  <CardTitle>First message</CardTitle>
                  <CardDescription>
                    The first message the agent will say. If empty, the agent will wait for the user to start the conversation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="e.g. Hello, how can I help you today?"
                    rows={3}
                  />
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="disable-interruptions" className="rounded" />
                    <Label htmlFor="disable-interruptions" className="text-sm font-normal">
                      Disable interruptions during first message
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Select this box to prevent users from interrupting while the first message is being delivered.
                  </p>
                  <Button variant="outline" size="sm">
                    + Add Variable
                  </Button>
                </CardContent>
              </Card>

              {/* Dynamic Variables */}
              <Card>
                <CardHeader>
                  <CardTitle>Dynamic Variables</CardTitle>
                  <CardDescription>
                    Variables like {'{user_name}'} in your prompts and first message will be replaced with actual values when the conversation starts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Test Variables</h4>
                    <p className="text-sm text-gray-500">
                      When testing your agent in development, dynamic variables will be replaced with these placeholder values.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600">⚠</span>
                      <p className="text-sm text-amber-800">
                        These values will <strong>not</strong> be used in production. The client is required to send all dynamic variables when starting a conversation otherwise it will fail.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {['call_type', 'offer', 'submission_id', 'first_name', 'last_name', 'phone', 'email', 'campaign_id', 'status', 'inbound_caller_id'].map((variable) => (
                      <div key={variable} className="grid grid-cols-2 gap-4">
                        <Input value={variable} readOnly className="bg-gray-50" />
                        <Input placeholder={
                          variable === 'call_type' ? 'inbound' :
                          variable === 'offer' ? 'Juvenile Detention Abuse' :
                          variable === 'submission_id' ? '1c0e8b8b-b89d-45a3-b8f7-53ee86ad38aa' :
                          variable === 'first_name' ? 'David' :
                          variable === 'last_name' ? 'Frog' :
                          variable === 'phone' ? '3194007476' :
                          variable === 'email' ? 'davidbarwig@gmail.com' :
                          variable === 'campaign_id' ? '3IP' :
                          variable === 'status' ? 'lead' :
                          '3194007476'
                        } />
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="fetch-client-data" className="rounded" />
                      <Label htmlFor="fetch-client-data" className="text-sm font-normal">
                        Fetch initiation client data from webhook
                      </Label>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      If enabled, the conversation initiation client data will be fetched from the webhook defined in the settings when receiving Twilio or SIP trunk calls.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* LLM Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>LLM</CardTitle>
                  <CardDescription>
                    Select which provider and model to use for the LLM.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    If your chosen LLM is not available at the moment or something goes wrong, we will redirect the conversation to another LLM.
                  </p>
                  <Select defaultValue="gemini-2.5-flash">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (8m)</SelectItem>
                      <SelectItem value="o1-preview">o1 Preview</SelectItem>
                      <SelectItem value="o1-mini">o1 Mini</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Backup LLM Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Backup LLM Configuration</CardTitle>
                  <CardDescription>
                    Configure how backup LLMs are used when the primary LLM fails.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 border-b pb-4">
                    <button className="px-4 py-2 text-sm font-medium border-b-2 border-blue-600">
                      Default
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-500">
                      Custom
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-500">
                      Disabled
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Using default backup configuration
                  </p>
                </CardContent>
              </Card>

              {/* Thinking Budget */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Thinking Budget</CardTitle>
                      <CardDescription>
                        Control how many internal reasoning tokens the model can use before responding. More tokens improve answer quality but slow down the response time. Disabling the thinking budget gives the fastest replies.
                      </CardDescription>
                    </div>
                    <input type="checkbox" className="rounded" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input type="range" min="0" max="10000" defaultValue="0" className="w-full" />
                    <Input type="number" defaultValue="0" className="w-24" />
                  </div>
                </CardContent>
              </Card>

              {/* Temperature */}
              <Card>
                <CardHeader>
                  <CardTitle>Temperature</CardTitle>
                  <CardDescription>
                    Temperature is a parameter that controls the creativity or randomness of the responses generated by the LLM.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input type="range" min="0" max="2" step="0.1" defaultValue="1" className="w-full" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Deterministic</Button>
                      <Button variant="outline" size="sm">Creative</Button>
                      <Button variant="outline" size="sm">More Creative</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Limit Token Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Limit token usage</CardTitle>
                  <CardDescription>
                    Configure the maximum number of tokens that the LLM can predict. A limit will be applied if the value is greater than 0.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input type="number" defaultValue="4000" className="w-32" />
                </CardContent>
              </Card>

              {/* Agent Knowledge Base */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Agent knowledge base</CardTitle>
                      <CardDescription>
                        Provide the LLM with domain-specific information to help it answer questions more accurately.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      Add document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <p>No documents added yet</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tools */}
              <Card>
                <CardHeader>
                  <CardTitle>Tools</CardTitle>
                  <CardDescription>
                    Let the agent perform specific actions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'End conversation', description: 'Gives agent the ability to end the conversation with the user.', enabled: true },
                    { name: 'Detect language', description: 'Switch language when the user asks you to or when user starts texting in a different language.', enabled: true },
                    { name: 'Transfer to agent', description: 'Gives agent the ability to transfer the conversation to another AI agent.', enabled: false },
                  ].map((tool) => (
                    <div key={tool.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{tool.name}</h4>
                        <p className="text-sm text-gray-500">{tool.description}</p>
                      </div>
                      <input type="checkbox" defaultChecked={tool.enabled} className="rounded" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Custom Tools */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Custom tools</CardTitle>
                      <CardDescription>
                        Provide the agent with custom tools it can use to help users.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      Add tool
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <p>No custom tools added yet</p>
                  </div>
                </CardContent>
              </Card>

              {/* Custom MCP Servers */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Custom MCP Servers</CardTitle>
                      <CardDescription>
                        Provide the agent with Model Context Protocol servers to extend its capabilities.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      Add Server
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <p>No MCP servers configured yet</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Configuration</CardTitle>
              <CardDescription>
                Configure actions and workflows for this agent (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                The workflow editor is coming soon. Here you'll be able to configure:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                <li>Custom tools and webhooks</li>
                <li>Agent-to-agent transfers</li>
                <li>Data collection fields</li>
                <li>Conditional actions</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure this webhook URL in your {agent.provider} account to receive SMS messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyWebhook}
                  >
                    {copiedWebhook ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Use this URL in your {agent.provider} messaging profile to receive inbound SMS
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Log in to your {agent.provider} account</li>
                  <li>Navigate to Messaging → Messaging Profiles</li>
                  <li>Select or create a messaging profile</li>
                  <li>Add the webhook URL above to the "Inbound Messages" webhook</li>
                  <li>Save your changes</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Agent Statistics</CardTitle>
              <CardDescription>
                Performance metrics for this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Conversations</p>
                  <p className="text-3xl font-bold mt-1">
                    {agent.metadata.totalConversations}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Messages</p>
                  <p className="text-3xl font-bold mt-1">
                    {agent.metadata.totalMessages}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-3xl font-bold mt-1">
                    ${agent.metadata.totalCost.toFixed(2)}
                  </p>
                </div>
              </div>
              {agent.metadata.lastActiveAt && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600">Last Active</p>
                  <p className="text-lg mt-1">
                    {new Date(agent.metadata.lastActiveAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}