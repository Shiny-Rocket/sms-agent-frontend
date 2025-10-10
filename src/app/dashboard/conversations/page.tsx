'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquareIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  StopCircleIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  listConversations,
  startConversation,
  getConversation,
  getConversationTranscript,
  stopConversation,
  type Conversation,
} from '@/lib/api/conversations';
import { listAgents, type Agent } from '@/lib/api/agents';

export default function ConversationsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('');

  // Conversation detail drawer state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [sendFinalMessage, setSendFinalMessage] = useState(false);
  const [finalMessage, setFinalMessage] = useState('');

  const { data: allConversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => listConversations({}),
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => listAgents({}),
  });

  const { data: selectedConversation } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () => getConversation(selectedConversationId!),
    enabled: !!selectedConversationId,
  });

  const { data: transcript } = useQuery({
    queryKey: ['conversation-transcript', selectedConversationId],
    queryFn: () => getConversationTranscript(selectedConversationId!, 'text'),
    enabled: !!selectedConversationId,
  });

  const startConversationMutation = useMutation({
    mutationFn: (data: { agentId: string; userPhone: string; message?: string }) =>
      startConversation(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setIsDialogOpen(false);
      setSelectedAgentId('');
      setUserPhone('');
      setInitialMessage('');
      setSelectedConversationId(data.conversationId);
    },
    onError: (error: any) => {
      alert(`Failed to start conversation: ${error.message || 'Unknown error'}`);
    },
  });

  const stopConversationMutation = useMutation({
    mutationFn: () =>
      stopConversation(selectedConversationId!, {
        sendFinalMessage,
        finalMessage: sendFinalMessage ? finalMessage : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setIsStopDialogOpen(false);
      setSelectedConversationId(null);
    },
  });

  const getFilteredConversations = (status?: string) => {
    if (!allConversations) return [];

    let filtered = allConversations;

    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conversation) =>
          conversation.conversationId.toLowerCase().includes(query) ||
          conversation.agentId?.toString().toLowerCase().includes(query) ||
          conversation.userPhone.includes(query) ||
          conversation.agentPhone.includes(query) ||
          conversation.status.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const allFiltered = useMemo(() => getFilteredConversations(), [allConversations, searchQuery]);
  const activeFiltered = useMemo(() => getFilteredConversations('active'), [allConversations, searchQuery]);
  const completedFiltered = useMemo(() => getFilteredConversations('completed'), [allConversations, searchQuery]);
  const waitingFiltered = useMemo(() => getFilteredConversations('waiting_hitl'), [allConversations, searchQuery]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      waiting_hitl: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const handleStartConversation = () => {
    if (!selectedAgentId || !userPhone) {
      alert('Please select an agent and enter a phone number');
      return;
    }

    startConversationMutation.mutate({
      agentId: selectedAgentId,
      userPhone,
      message: initialMessage || undefined,
    });
  };

  const handleCopyTranscript = async () => {
    if (transcript && typeof transcript === 'string') {
      await navigator.clipboard.writeText(transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const handleDownloadTranscript = () => {
    if (transcript && typeof transcript === 'string' && selectedConversation) {
      const blob = new Blob([transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${selectedConversation.conversationId.slice(0, 8)}-${format(
        new Date(),
        'yyyy-MM-dd'
      )}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const renderConversationsTable = (conversations: Conversation[]) => {
    if (!conversations || conversations.length === 0) {
      return (
        <div className="py-12 text-center">
          <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'No conversations match your search' : 'Start by creating an agent and sending some SMS messages'}
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conversation ID</TableHead>
            <TableHead>Agent ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Messages</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Recent</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conversation) => (
            <TableRow key={conversation._id}>
              <TableCell className="font-mono text-xs">{conversation.conversationId.slice(0, 8)}...</TableCell>
              <TableCell className="font-mono text-xs">{conversation.agentId?.toString().slice(0, 8) || 'N/A'}</TableCell>
              <TableCell>{getStatusBadge(conversation.status)}</TableCell>
              <TableCell>{conversation.metadata.messageCount}</TableCell>
              <TableCell>{format(new Date(conversation.createdAt), 'MMM d, h:mm a')}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
              </TableCell>
              <TableCell>${conversation.metadata.totalCost.toFixed(4)}</TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => setSelectedConversationId(conversation.conversationId)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View →
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Conversations</h1>
            <p className="text-gray-600 mt-2">View and manage SMS conversations with your users</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Start Conversation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
                <DialogDescription>Send an SMS message from an agent to initiate a conversation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="agent">Agent</Label>
                  <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                    <SelectTrigger id="agent">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents?.map((agent) => (
                        <SelectItem key={agent._id} value={agent.agentId || agent._id}>
                          {agent.name} ({agent.phoneNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">User Phone Number</Label>
                  <Input id="phone" placeholder="+1234567890" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
                  <p className="text-xs text-gray-600">Enter phone in E.164 format</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Initial Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Hello! How can I help you today?"
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleStartConversation}
                  disabled={!selectedAgentId || !userPhone || startConversationMutation.isPending}
                >
                  {startConversationMutation.isPending ? 'Starting...' : 'Start Conversation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="waiting_hitl">Waiting HITL</TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Loading conversations...</p>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="mt-0">
                  {renderConversationsTable(allFiltered)}
                </TabsContent>
                <TabsContent value="active" className="mt-0">
                  {renderConversationsTable(activeFiltered)}
                </TabsContent>
                <TabsContent value="completed" className="mt-0">
                  {renderConversationsTable(completedFiltered)}
                </TabsContent>
                <TabsContent value="waiting_hitl" className="mt-0">
                  {renderConversationsTable(waitingFiltered)}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>

      {/* Conversation Detail Drawer */}
      <Sheet open={!!selectedConversationId} onOpenChange={(open) => !open && setSelectedConversationId(null)}>
        <SheetContent side="right" className="w-[800px] sm:max-w-[800px] p-0 flex flex-col">
          {selectedConversation && (
            <>
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold">Conversation with {selectedConversation.agentPhone}</h2>
                    <p className="text-sm text-gray-500 font-mono mt-1">{selectedConversation.conversationId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedConversation.status)}
                    {selectedConversation.status === 'active' && (
                      <Dialog open={isStopDialogOpen} onOpenChange={setIsStopDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <StopCircleIcon className="mr-2 h-4 w-4" />
                            Stop
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Stop Conversation</DialogTitle>
                            <DialogDescription>
                              Mark this conversation as complete. Optionally send a final message.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="sendFinal"
                                checked={sendFinalMessage}
                                onChange={(e) => setSendFinalMessage(e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor="sendFinal">Send final message</Label>
                            </div>
                            {sendFinalMessage && (
                              <div className="space-y-2">
                                <Label htmlFor="finalMsg">Final Message</Label>
                                <Textarea
                                  id="finalMsg"
                                  placeholder="Thank you for contacting us!"
                                  value={finalMessage}
                                  onChange={(e) => setFinalMessage(e.target.value)}
                                  rows={3}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsStopDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={() => stopConversationMutation.mutate()}
                              disabled={stopConversationMutation.isPending}
                            >
                              {stopConversationMutation.isPending ? 'Stopping...' : 'Stop Conversation'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Area with Sidebar */}
              <div className="flex flex-1 overflow-hidden">
                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-auto p-6">
                  <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="transcription">Transcription</TabsTrigger>
                      <TabsTrigger value="client-data">Client data</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Conversation Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">User Phone</p>
                              <p className="font-medium">{selectedConversation.userPhone}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Agent Phone</p>
                              <p className="font-medium">{selectedConversation.agentPhone}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Status</p>
                              <div className="mt-1">{getStatusBadge(selectedConversation.status)}</div>
                            </div>
                            <div>
                              <p className="text-gray-600">Started</p>
                              <p className="font-medium">
                                {format(new Date(selectedConversation.createdAt), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                            {selectedConversation.completedAt && (
                              <div>
                                <p className="text-gray-600">Completed</p>
                                <p className="font-medium">
                                  {format(new Date(selectedConversation.completedAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {selectedConversation.metadata.triggeredActions &&
                        selectedConversation.metadata.triggeredActions.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Triggered Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {selectedConversation.metadata.triggeredActions.map((actionId, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">{actionId}</Badge>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="transcription" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Message History</CardTitle>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
                                {copiedTranscript ? (
                                  <CheckIcon className="mr-2 h-4 w-4 text-green-600" />
                                ) : (
                                  <CopyIcon className="mr-2 h-4 w-4" />
                                )}
                                {copiedTranscript ? 'Copied!' : 'Copy'}
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleDownloadTranscript}>
                                <DownloadIcon className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {selectedConversation.messages.map((message, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-600">
                                    {message.role === 'user' ? selectedConversation.userPhone : selectedConversation.agentPhone}
                                  </span>
                                  <span className="text-xs text-gray-400">{format(new Date(message.timestamp), 'h:mm a')}</span>
                                </div>
                                <div className="pl-4 border-l-2 border-gray-200">
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="client-data" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Dynamic Variables</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedConversation.conversationData &&
                          Object.keys(selectedConversation.conversationData).length > 0 ? (
                            <div className="divide-y">
                              {Object.entries(selectedConversation.conversationData).map(([key, value]) => (
                                <div key={key} className="py-3 flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">{key}</span>
                                  <span className="text-sm text-gray-900">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-8">No data collected during this conversation</p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Right Sidebar - Metadata */}
                <div className="w-64 border-l bg-gray-50 p-6 overflow-auto">
                  <h3 className="text-sm font-semibold mb-4">Metadata</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Date</p>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedConversation.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Messages</p>
                      <p className="text-sm font-medium">{selectedConversation.metadata.messageCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Credits (LLM)</p>
                      <p className="text-sm font-medium">
                        {selectedConversation.metadata.llmTokensInput + selectedConversation.metadata.llmTokensOutput}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">LLM Cost</p>
                      <p className="text-sm font-medium">${selectedConversation.metadata.totalCost.toFixed(4)}</p>
                      <p className="text-xs text-gray-500">Total: ${selectedConversation.metadata.totalCost.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Avg Response Time</p>
                      <p className="text-sm font-medium">
                        {selectedConversation.metadata.avgResponseTime
                          ? `${(selectedConversation.metadata.avgResponseTime / 1000).toFixed(1)}s`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Input Tokens</p>
                      <p className="text-sm font-medium">{selectedConversation.metadata.llmTokensInput}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Output Tokens</p>
                      <p className="text-sm font-medium">{selectedConversation.metadata.llmTokensOutput}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
