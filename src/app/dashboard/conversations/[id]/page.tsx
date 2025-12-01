'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getConversation, getConversationTranscript, stopConversation, type Message, type PhaseId, type ToolCallRecord } from '@/lib/api/conversations';
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
  WorkflowIcon,
  WrenchIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  AlertCircleIcon,
  FileTextIcon,
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

  // Phase display helpers
  const phaseLabels: Record<PhaseId, { label: string; description: string; icon: string }> = {
    lookup: { label: 'Lookup', description: 'Loading context and user data', icon: '🔍' },
    intro: { label: 'Introduction', description: 'Initial greeting and context setting', icon: '👋' },
    gather: { label: 'Gather Details', description: 'Collecting required information', icon: '📝' },
    qualification: { label: 'Qualification', description: 'Determining eligibility', icon: '✅' },
    documents: { label: 'Documents', description: 'Sending e-sign documents', icon: '📄' },
    closing: { label: 'Closing', description: 'Completing the conversation', icon: '🏁' },
  };

  const getPhaseBadge = (phase: PhaseId | undefined) => {
    if (!phase) return null;
    const phaseInfo = phaseLabels[phase];
    return (
      <Badge variant="outline" className="font-normal">
        <span className="mr-1">{phaseInfo.icon}</span>
        {phaseInfo.label}
      </Badge>
    );
  };

  const getQualificationBadge = (status: string | undefined | null) => {
    if (!status) return null;
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      qualified_ready: { color: 'bg-green-100 text-green-800', label: 'Qualified' },
      disqualified_legal: { color: 'bg-red-100 text-red-800', label: 'Disqualified (Legal)' },
      disqualified_fraud: { color: 'bg-red-100 text-red-800', label: 'Disqualified (Fraud)' },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getDocusealBadge = (status: string | undefined) => {
    if (!status || status === 'not_started') return null;
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Doc Pending' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Doc Sent' },
      signed: { color: 'bg-green-100 text-green-800', label: 'Doc Signed' },
      error: { color: 'bg-red-100 text-red-800', label: 'Doc Error' },
    };
    const variant = variants[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  // Count total tool calls across all messages
  const totalToolCalls = conversation?.messages.reduce((count, msg) => {
    return count + (msg.toolCalls?.length || 0);
  }, 0) || 0;

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
              <TabsTrigger value="phase">
                <WorkflowIcon className="h-4 w-4 mr-1" />
                Phase
                {conversation.currentPhase && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {phaseLabels[conversation.currentPhase]?.label || conversation.currentPhase}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tools">
                <WrenchIcon className="h-4 w-4 mr-1" />
                Tools
                {totalToolCalls > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{totalToolCalls}</Badge>
                )}
              </TabsTrigger>
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

            {/* Phase Tab */}
            <TabsContent value="phase" className="space-y-4">
              {/* Current Phase Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <WorkflowIcon className="h-5 w-5" />
                    Current Phase
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conversation.currentPhase ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {phaseLabels[conversation.currentPhase]?.icon || '🔄'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {phaseLabels[conversation.currentPhase]?.label || conversation.currentPhase}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {phaseLabels[conversation.currentPhase]?.description || ''}
                          </p>
                        </div>
                      </div>

                      {/* Qualification and DocuSeal Status */}
                      <div className="flex gap-2 flex-wrap">
                        {getQualificationBadge(conversation.qualificationStatus)}
                        {getDocusealBadge(conversation.docusealStatus)}
                      </div>

                      {conversation.qualificationReason && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Reason:</strong> {conversation.qualificationReason}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <WorkflowIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Phase information not available</p>
                      <p className="text-xs mt-1">This conversation may not use the phase-based architecture</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Phase Timeline */}
              {conversation.phaseHistory && conversation.phaseHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Phase History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {conversation.phaseHistory.map((transition, index) => {
                        const isLast = index === conversation.phaseHistory!.length - 1;
                        const toPhase = phaseLabels[transition.to];
                        return (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                isLast ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {toPhase?.icon || '🔄'}
                              </div>
                              {!isLast && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2">
                                {transition.from && (
                                  <>
                                    <Badge variant="outline" className="text-xs">
                                      {phaseLabels[transition.from]?.label || transition.from}
                                    </Badge>
                                    <ChevronRightIcon className="h-3 w-3 text-gray-400" />
                                  </>
                                )}
                                <Badge variant={isLast ? 'default' : 'secondary'} className="text-xs">
                                  {toPhase?.label || transition.to}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(transition.timestamp), 'MMM d, h:mm:ss a')}
                              </p>
                              {transition.reason && (
                                <p className="text-xs text-gray-600 mt-1">{transition.reason}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Phase Flow Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Phase Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
                    {(['lookup', 'intro', 'gather', 'qualification', 'documents', 'closing'] as PhaseId[]).map((phaseId, index) => {
                      const phaseInfo = phaseLabels[phaseId];
                      const isCurrentPhase = conversation.currentPhase === phaseId;
                      const isPastPhase = conversation.phaseHistory?.some(t => t.to === phaseId);

                      return (
                        <div key={phaseId} className="flex items-center">
                          <div className={`flex flex-col items-center p-2 rounded-lg min-w-[80px] ${
                            isCurrentPhase
                              ? 'bg-blue-100 border-2 border-blue-500'
                              : isPastPhase
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50 border border-gray-200'
                          }`}>
                            <div className="text-xl mb-1">{phaseInfo.icon}</div>
                            <span className={`text-xs font-medium ${
                              isCurrentPhase ? 'text-blue-700' : isPastPhase ? 'text-green-700' : 'text-gray-500'
                            }`}>
                              {phaseInfo.label}
                            </span>
                            {isCurrentPhase && (
                              <CircleDotIcon className="h-3 w-3 text-blue-500 mt-1" />
                            )}
                            {isPastPhase && !isCurrentPhase && (
                              <CheckCircle2Icon className="h-3 w-3 text-green-500 mt-1" />
                            )}
                          </div>
                          {index < 5 && (
                            <ChevronRightIcon className="h-4 w-4 text-gray-300 mx-1 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <WrenchIcon className="h-5 w-5" />
                    Tool Call History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalToolCalls > 0 ? (
                    <div className="space-y-4">
                      {conversation.messages.map((message, msgIndex) => {
                        if (!message.toolCalls || message.toolCalls.length === 0) return null;

                        return (
                          <div key={msgIndex} className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Message #{msgIndex + 1}</span>
                              <span>•</span>
                              <span>{format(new Date(message.timestamp), 'h:mm:ss a')}</span>
                              {message.phase && (
                                <>
                                  <span>•</span>
                                  {getPhaseBadge(message.phase)}
                                </>
                              )}
                            </div>
                            {message.toolCalls.map((toolCall, toolIndex) => (
                              <div
                                key={toolIndex}
                                className="border rounded-lg p-3 bg-gray-50"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <WrenchIcon className="h-4 w-4 text-purple-500" />
                                    <span className="font-mono text-sm font-medium">
                                      {toolCall.tool}
                                    </span>
                                  </div>
                                  {toolCall.duration && (
                                    <Badge variant="outline" className="text-xs">
                                      {toolCall.duration}ms
                                    </Badge>
                                  )}
                                </div>

                                {/* Arguments */}
                                {Object.keys(toolCall.arguments || {}).length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-500 mb-1">Arguments:</p>
                                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                      {JSON.stringify(toolCall.arguments, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {/* Result */}
                                {toolCall.result !== undefined && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Result:</p>
                                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32">
                                      {typeof toolCall.result === 'string'
                                        ? toolCall.result
                                        : JSON.stringify(toolCall.result, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <WrenchIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No tool calls in this conversation</p>
                      <p className="text-xs mt-1">Tool calls appear when the agent uses external tools like Doctor Search, DocuSeal, etc.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tool Summary */}
              {totalToolCalls > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tool Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Tool Calls</p>
                        <p className="text-2xl font-bold">{totalToolCalls}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Unique Tools</p>
                        <p className="text-2xl font-bold">
                          {new Set(
                            conversation.messages
                              .flatMap(m => m.toolCalls || [])
                              .map(tc => tc.tool)
                          ).size}
                        </p>
                      </div>
                    </div>

                    {/* Tool breakdown */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Tools Used:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          new Set(
                            conversation.messages
                              .flatMap(m => m.toolCalls || [])
                              .map(tc => tc.tool)
                          )
                        ).map(tool => {
                          const count = conversation.messages
                            .flatMap(m => m.toolCalls || [])
                            .filter(tc => tc.tool === tool).length;
                          return (
                            <Badge key={tool} variant="secondary" className="font-mono">
                              {tool} ({count})
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
