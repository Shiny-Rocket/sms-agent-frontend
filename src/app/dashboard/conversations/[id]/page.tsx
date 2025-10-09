'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getConversation, getConversationTranscript, stopConversation, type Message } from '@/lib/api/conversations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
        <div className="max-w-5xl mx-auto">
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
        <div className="max-w-5xl mx-auto text-center">
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
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/conversations">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Conversations
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Conversation {conversation.conversationId.slice(0, 8)}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4" />
                  User: {conversation.userPhone}
                </span>
                <span className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  Agent: {conversation.agentPhone}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {format(new Date(conversation.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
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
        </div>

        <div className="grid gap-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{conversation.metadata.messageCount}</div>
                <p className="text-xs text-gray-600 mt-1">Total Messages</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold flex items-center gap-1">
                  <DollarSignIcon className="h-5 w-5" />
                  {conversation.metadata.totalCost.toFixed(4)}
                </div>
                <p className="text-xs text-gray-600 mt-1">Total Cost</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {(conversation.metadata.avgResponseTime / 1000).toFixed(1)}s
                </div>
                <p className="text-xs text-gray-600 mt-1">Avg Response Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {conversation.metadata.llmTokensInput + conversation.metadata.llmTokensOutput}
                </div>
                <p className="text-xs text-gray-600 mt-1">Total Tokens</p>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Data */}
          {conversation.conversationData && Object.keys(conversation.conversationData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Collected Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(conversation.conversationData).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-600 uppercase">{key.replace(/_/g, ' ')}</p>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Transcript */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transcript</CardTitle>
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
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.role === 'user' ? 'User' : 'Agent'}
                        </span>
                        <span className="text-xs opacity-70">
                          {format(new Date(message.timestamp), 'h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
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
        </div>
      </div>
    </div>
  );
}
