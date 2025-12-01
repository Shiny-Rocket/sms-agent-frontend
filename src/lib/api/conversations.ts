import { apiClient } from './client';

export type PhaseId = 'lookup' | 'intro' | 'gather' | 'qualification' | 'documents' | 'closing';

export interface ToolCallRecord {
  tool: string;
  arguments: Record<string, any>;
  result: any;
  duration?: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  phase?: PhaseId;
  toolCalls?: ToolCallRecord[];
}

export interface ConversationData {
  submission_id: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  client?: string;
  offer?: string;
  campaign_id?: string;
  [key: string]: any;
}

export interface PhaseTransition {
  from: PhaseId | null;
  to: PhaseId;
  timestamp: Date;
  reason?: string;
}

export interface Conversation {
  _id: string;
  conversationId: string;
  agentId: string;
  agentPhone: string;
  userPhone: string;
  status: 'active' | 'completed' | 'waiting_hitl';
  messages: Message[];
  conversationData?: ConversationData;
  // Phase-based conversation state
  currentPhase?: PhaseId;
  phaseHistory?: PhaseTransition[];
  qualificationStatus?: 'pending' | 'qualified_ready' | 'disqualified_legal' | 'disqualified_fraud' | null;
  qualificationReason?: string;
  docusealStatus?: 'not_started' | 'pending' | 'sent' | 'signed' | 'error';
  metadata: {
    messageCount: number;
    llmTokensInput: number;
    llmTokensOutput: number;
    totalCost: number;
    avgResponseTime: number;
    triggeredActions: string[];
    totalToolCalls?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ListConversationsParams {
  status?: string;
  agentId?: string;
  agentPhone?: string;
  userPhone?: string;
  limit?: number;
  offset?: number;
}

export async function listConversations(params?: ListConversationsParams): Promise<Conversation[]> {
  const { data } = await apiClient.get<any>('/conversations', {
    params,
  });

  // Backend returns { success: true, conversations: [...] }
  if (data.success && data.conversations) {
    return data.conversations;
  }

  return [];
}

export async function getConversation(conversationId: string): Promise<Conversation> {
  const { data } = await apiClient.get<any>(`/conversations/${conversationId}`);

  // Backend returns { success: true, conversation: {...} }
  if (data.success && data.conversation) {
    return data.conversation;
  }

  throw new Error('Failed to get conversation');
}

export async function getConversationTranscript(
  conversationId: string,
  format: 'text' | 'json' = 'text'
): Promise<string | Message[]> {
  const { data } = await apiClient.get<any>(`/conversations/${conversationId}/transcript`, {
    params: { format },
  });

  if (format === 'json') {
    return data.messages || [];
  }

  return data.transcript || '';
}

export async function getConversationData(conversationId: string): Promise<ConversationData> {
  const { data } = await apiClient.get<any>(`/conversations/${conversationId}/data`);

  if (data.success && data.data) {
    return data.data;
  }

  return {} as ConversationData;
}

export async function setConversationDataField(
  conversationId: string,
  fieldName: string,
  value: any
): Promise<void> {
  await apiClient.put(`/conversations/${conversationId}/data`, {
    fieldName,
    value,
  });
}

export async function setConversationData(
  conversationId: string,
  updates: Record<string, any>
): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}/data`, updates);
}

/**
 * Start a new conversation
 * POST /api/v1/conversations/start
 */
export async function startConversation(data: {
  agentId: string;
  userPhone: string;
  message?: string;
}): Promise<{ conversationId: string }> {
  console.log('📡 [API] Calling POST /conversations/start with:', data);

  try {
    const { data: response } = await apiClient.post<any>('/conversations/start', data);

    console.log('📡 [API] Response from /conversations/start:', response);

    if (response.success && response.conversationId) {
      return { conversationId: response.conversationId };
    }

    throw new Error(response.error || 'Failed to start conversation');
  } catch (error: any) {
    console.error('📡 [API] Error response:', error.response?.data);
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    throw new Error(errorMessage);
  }
}

/**
 * Stop a conversation
 * POST /api/v1/conversations/:id/stop
 */
export async function stopConversation(
  conversationId: string,
  options?: {
    sendFinalMessage?: boolean;
    finalMessage?: string;
  }
): Promise<void> {
  await apiClient.post(`/conversations/${conversationId}/stop`, options);
}