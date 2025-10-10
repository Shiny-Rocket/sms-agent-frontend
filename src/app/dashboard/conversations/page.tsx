'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { MessageSquareIcon, PhoneIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { listConversations, startConversation, type Conversation } from '@/lib/api/conversations';
import { listAgents, type Agent } from '@/lib/api/agents';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ConversationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('');

  const { data: allConversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => listConversations({}),
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => listAgents({}),
  });

  const startConversationMutation = useMutation({
    mutationFn: (data: { agentId: string; userPhone: string; message?: string }) => {
      console.log('🚀 [START CONVERSATION] Mutation triggered with data:', data);
      return startConversation(data);
    },
    onSuccess: (data) => {
      console.log('✅ [START CONVERSATION] Success! Conversation ID:', data.conversationId);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setIsDialogOpen(false);
      setSelectedAgentId('');
      setUserPhone('');
      setInitialMessage('');
      router.push(`/dashboard/conversations/${data.conversationId}`);
    },
    onError: (error: any) => {
      console.error('❌ [START CONVERSATION] Error:', error);
      alert(`Failed to start conversation: ${error.message || 'Unknown error'}`);
    },
  });

  // Filter conversations by status and search query
  const getFilteredConversations = (status?: string) => {
    if (!allConversations) return [];

    let filtered = allConversations;

    // Filter by status if provided
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }

    // Filter by search query
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
    console.log('🔘 [START CONVERSATION] Button clicked');
    console.log('📋 [START CONVERSATION] Selected Agent ID:', selectedAgentId);
    console.log('📋 [START CONVERSATION] User Phone:', userPhone);
    console.log('📋 [START CONVERSATION] Initial Message:', initialMessage);

    if (!selectedAgentId || !userPhone) {
      console.warn('⚠️ [START CONVERSATION] Validation failed - missing required fields');
      console.warn('   - selectedAgentId:', selectedAgentId);
      console.warn('   - userPhone:', userPhone);
      alert('Please select an agent and enter a phone number');
      return;
    }

    console.log('✅ [START CONVERSATION] Validation passed, triggering mutation...');
    startConversationMutation.mutate({
      agentId: selectedAgentId,
      userPhone,
      message: initialMessage || undefined,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-gray-600 mt-2">
            View and manage SMS conversations with your users
          </p>
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
              <DialogDescription>
                Send an SMS message from an agent to initiate a conversation
              </DialogDescription>
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
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                />
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

        {/* Search Bar */}
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
                {allFiltered && allFiltered.length > 0 ? (
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
              {allFiltered.map((conversation) => (
                <TableRow key={conversation._id}>
                  <TableCell className="font-mono text-xs">
                    {conversation.conversationId.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {conversation.agentId?.toString().slice(0, 8) || 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                  <TableCell>{conversation.metadata.messageCount}</TableCell>
                  <TableCell>
                    {format(new Date(conversation.createdAt), 'MMM d, h:mm a')}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>${conversation.metadata.totalCost.toFixed(4)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/conversations/${conversation.conversationId}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
                ) : (
                  <div className="py-12 text-center">
                    <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No conversations found
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery
                        ? 'No conversations match your search'
                        : 'Start by creating an agent and sending some SMS messages'}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-0">
                {activeFiltered && activeFiltered.length > 0 ? (
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
                      {activeFiltered.map((conversation) => (
                        <TableRow key={conversation._id}>
                          <TableCell className="font-mono text-xs">
                            {conversation.conversationId.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {conversation.agentId?.toString().slice(0, 8) || 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                          <TableCell>{conversation.metadata.messageCount}</TableCell>
                          <TableCell>
                            {format(new Date(conversation.createdAt), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>${conversation.metadata.totalCost.toFixed(4)}</TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/dashboard/conversations/${conversation.conversationId}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View →
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No active conversations
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'No active conversations match your search' : 'No active conversations at the moment'}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0">
                {completedFiltered && completedFiltered.length > 0 ? (
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
                      {completedFiltered.map((conversation) => (
                        <TableRow key={conversation._id}>
                          <TableCell className="font-mono text-xs">
                            {conversation.conversationId.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {conversation.agentId?.toString().slice(0, 8) || 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                          <TableCell>{conversation.metadata.messageCount}</TableCell>
                          <TableCell>
                            {format(new Date(conversation.createdAt), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>${conversation.metadata.totalCost.toFixed(4)}</TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/dashboard/conversations/${conversation.conversationId}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View →
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No completed conversations
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'No completed conversations match your search' : 'No completed conversations yet'}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="waiting_hitl" className="mt-0">
                {waitingFiltered && waitingFiltered.length > 0 ? (
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
                      {waitingFiltered.map((conversation) => (
                        <TableRow key={conversation._id}>
                          <TableCell className="font-mono text-xs">
                            {conversation.conversationId.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {conversation.agentId?.toString().slice(0, 8) || 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                          <TableCell>{conversation.metadata.messageCount}</TableCell>
                          <TableCell>
                            {format(new Date(conversation.createdAt), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>${conversation.metadata.totalCost.toFixed(4)}</TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/dashboard/conversations/${conversation.conversationId}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View →
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No conversations waiting for HITL
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'No HITL conversations match your search' : 'No conversations waiting for human intervention'}
                    </p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}