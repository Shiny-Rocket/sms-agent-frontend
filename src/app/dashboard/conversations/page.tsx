'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { MessageSquareIcon, PhoneIcon, PlusIcon } from 'lucide-react';
import { format } from 'date-fns';
import { listConversations, startConversation, type Conversation } from '@/lib/api/conversations';
import { listAgents, type Agent } from '@/lib/api/agents';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ConversationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState<string>('');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', statusFilter],
    queryFn: () => listConversations(statusFilter === 'all' ? {} : { status: statusFilter }),
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

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    waiting_hitl: 'bg-yellow-100 text-yellow-800',
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

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setStatusFilter('waiting_hitl')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === 'waiting_hitl'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Waiting HITL
        </button>
      </div>

      {/* Conversations List */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading conversations...</p>
          </div>
        ) : conversations && conversations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Phone</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((conversation) => (
                <TableRow key={conversation._id}>
                  <TableCell className="font-mono text-sm">
                    {conversation.userPhone}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {conversation.agentPhone}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[conversation.status]
                      }`}
                    >
                      {conversation.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>{conversation.metadata.messageCount}</TableCell>
                  <TableCell>${conversation.metadata.totalCost.toFixed(4)}</TableCell>
                  <TableCell>
                    {format(new Date(conversation.createdAt), 'MMM d, h:mm a')}
                  </TableCell>
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
            <p className="text-gray-600 mb-4">
              {statusFilter !== 'all'
                ? `No ${statusFilter} conversations at the moment`
                : 'Start by creating an agent and sending some SMS messages'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}