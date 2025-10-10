'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getConversation, getConversationTranscript, stopConversation, type Message } from '@/lib/api/conversations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeftIcon,
  MessageSquareIcon,
  PhoneIcon,
  UserIcon,
  ClockIcon,
  DollarSignIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  StopCircleIcon,
  XIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const conversationId = params.id as string;
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [sendFinalMessage, setSendFinalMessage] = useState(false);
  const [finalMessage, setFinalMessage] = useState('');

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
  });

  const { data: transcript } = useQuery({
    queryKey: ['conversation-transcript', conversationId],
    queryFn: () => getConversationTranscript(conversationId, 'text'),
  });

  const stopConversationMutation = useMutation({
    mutationFn: () =>
      stopConversation(conversationId, {
        sendFinalMessage,
        finalMessage: sendFinalMessage ? finalMessage : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setIsStopDialogOpen(false);
      router.push('/dashboard/conversations');
    },
  });

  const handleCopyTranscript = async () => {
    if (transcript && typeof transcript === 'string') {
      await navigator.clipboard.writeText(transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const handleDownloadTranscript = () => {
    if (transcript && typeof transcript === 'string') {
      const blob = new Blob([transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversationId.slice(0, 8)}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      waiting_hitl: { color: 'bg-yellow-100 text-yellow-800', label: 'Waiting HITL' },
    };

    const variant = variants[status] || variants.active;

    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto text-center">
          <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Conversation not found</h2>
          <p className="text-gray-600 mb-6">The conversation you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/dashboard/conversations">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Conversations
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/dashboard/conversations">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Conversations
              </Link>
            </Button>

            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold">
                Conversation with {conversation.agentPhone}
              </h1>
              <div className="flex items-center gap-2">
                {getStatusBadge(conversation.status)}
                {conversation.status === 'active' && (
                  <Dialog open={isStopDialogOpen} onOpenChange={setIsStopDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <StopCircleIcon className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
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
            <p className="text-sm text-gray-500 font-mono">
              {conversationId}
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger value="client-data">Client data</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">User Phone</p>
                      <p className="font-medium">{conversation.userPhone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Agent Phone</p>
                      <p className="font-medium">{conversation.agentPhone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <div className="mt-1">{getStatusBadge(conversation.status)}</div>
                    </div>
                    <div>
                      <p className="text-gray-600">Started</p>
                      <p className="font-medium">
                        {format(new Date(conversation.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {conversation.completedAt && (
                      <div>
                        <p className="text-gray-600">Completed</p>
                        <p className="font-medium">
                          {format(new Date(conversation.completedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Triggered Actions */}
              {conversation.metadata.triggeredActions && conversation.metadata.triggeredActions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Triggered Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {conversation.metadata.triggeredActions.map((actionId, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{actionId}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Transcription Tab */}
            <TabsContent value="transcription" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Message History</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyTranscript}
                      >
                        {copiedTranscript ? (
                          <CheckIcon className="mr-2 h-4 w-4 text-green-600" />
                        ) : (
                          <CopyIcon className="mr-2 h-4 w-4" />
                        )}
                        {copiedTranscript ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTranscript}
                      >
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conversation.messages.map((message, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">
                            {message.role === 'user' ? conversation.userPhone : conversation.agentPhone}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(message.timestamp), 'h:mm a')}
                          </span>
                          {message.role === 'assistant' && message.tokens && (
                            <span className="text-xs text-gray-400">
                              TTS {message.tokens.input}ms
                            </span>
                          )}
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

            {/* Client Data Tab */}
            <TabsContent value="client-data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dynamic Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  {conversation.conversationData && Object.keys(conversation.conversationData).length > 0 ? (
                    <div className="divide-y">
                      {Object.entries(conversation.conversationData).map(([key, value]) => (
                        <div key={key} className="py-3 flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{key}</span>
                          <span className="text-sm text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No data collected during this conversation
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Sidebar - Metadata */}
      <div className="w-80 border-l bg-white p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Metadata</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/conversations')}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Date</p>
            <p className="text-sm font-medium">
              {format(new Date(conversation.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Messages</p>
            <p className="text-sm font-medium">{conversation.metadata.messageCount}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Credits (LLM)</p>
            <p className="text-sm font-medium">
              {conversation.metadata.llmTokensInput + conversation.metadata.llmTokensOutput}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">LLM Cost</p>
            <p className="text-sm font-medium">
              ${conversation.metadata.totalCost.toFixed(4)}
            </p>
            <p className="text-xs text-gray-500">
              Total: ${conversation.metadata.totalCost.toFixed(4)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
            <p className="text-sm font-medium">
              {conversation.metadata.avgResponseTime
                ? `${(conversation.metadata.avgResponseTime / 1000).toFixed(1)}s`
                : 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Input Tokens</p>
            <p className="text-sm font-medium">{conversation.metadata.llmTokensInput}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Output Tokens</p>
            <p className="text-sm font-medium">{conversation.metadata.llmTokensOutput}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
