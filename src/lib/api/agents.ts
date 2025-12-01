import { apiClient, ApiSuccess } from './client';

/**
 * Agents API
 */

export interface AgentToolConfig {
  enableToolCalling?: boolean; // Enable LLM tool calling (uses AgentExecutor instead of ChatBot)
  enableMCPTools?: boolean; // Enable MCP tools (Doctor Search, DocuSeal, Google Maps) - default: true
  enableSubworkflowTools?: boolean; // Enable subworkflow tools (questionnaire, address, user record) - default: true
  mcpServers?: string[]; // Specific MCP servers to enable (default: all) - e.g., ['doctor-search', 'docuseal']
  maxIterations?: number; // Max tool calling iterations before giving up - default: 10
}

export interface Agent {
  _id: string;
  agentId: string;
  name: string;
  phoneNumber: string;
  provider: 'telnyx' | 'vonage';
  systemPrompt: string;
  model?: string;
  actions: AgentAction[];
  dataFields?: DataFieldDefinition[];
  promptVariables?: Record<string, string>;
  toolConfig?: AgentToolConfig; // Tool calling configuration
  status: 'draft' | 'active' | 'paused' | 'archived';
  metadata: {
    totalConversations: number;
    totalMessages: number;
    totalCost: number;
    lastActiveAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AgentAction {
  id: string;
  type: 'URL_CALL' | 'STOP' | 'FORM_SUBMIT' | 'TRANSFER' | 'AGENT_CALL';
  name: string;
  description?: string; // AI-facing instructions for when/how to use this tool
  payloadTemplate?: string; // JSON template with [VARIABLES] for dynamic payloads
  condition?: string;
  runOneTime?: boolean; // If true (default), action runs only once per conversation
  enabled?: boolean | string; // Static boolean or dynamic template expression
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, any>;
  transferNumber?: string;
  targetAgentId?: string;
  payload?: Record<string, any>;
}

export interface DataFieldDefinition {
  key: string;
  label?: string;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required?: boolean;
  defaultValue?: any;
  description?: string;
}

export interface CreateAgentRequest {
  name: string;
  phoneNumber: string;
  provider: 'telnyx' | 'vonage';
  systemPrompt: string;
  model?: string;
  actions?: AgentAction[];
  dataFields?: DataFieldDefinition[];
  promptVariables?: Record<string, string>;
  toolConfig?: AgentToolConfig;
  status?: 'draft' | 'active';
}

export interface UpdateAgentRequest {
  name?: string;
  phoneNumber?: string;
  provider?: 'telnyx' | 'vonage';
  systemPrompt?: string;
  model?: string;
  actions?: AgentAction[];
  dataFields?: DataFieldDefinition[];
  promptVariables?: Record<string, string>;
  toolConfig?: AgentToolConfig;
  status?: 'draft' | 'active' | 'paused' | 'archived';
}

/**
 * List all agents
 * GET /api/v1/agents
 */
export async function listAgents(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Agent[]> {
  const { data } = await apiClient.get<any>('/agents', {
    params,
  });

  // Backend returns { success: true, agents: [...], count: N }
  if (data.success && data.agents) {
    return data.agents;
  }

  return [];
}

/**
 * Get agent by ID
 * GET /api/v1/agents/:id
 */
export async function getAgent(id: string): Promise<Agent> {
  const { data } = await apiClient.get<any>(`/agents/${id}`);

  // Backend returns { success: true, agent: {...} }
  if (data.success && data.agent) {
    return data.agent;
  }

  // Fallback to nested data format
  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('Agent not found');
}

/**
 * Create new agent
 * POST /api/v1/agents
 */
export async function createAgent(
  agentData: CreateAgentRequest
): Promise<Agent> {
  const { data } = await apiClient.post<any>(
    '/agents',
    agentData
  );

  // Backend returns { success: true, agent: {...} }
  if (data.success && data.agent) {
    return data.agent;
  }

  // Fallback to nested data format
  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('Failed to create agent');
}

/**
 * Update agent
 * PUT /api/v1/agents/:id
 */
export async function updateAgent(
  id: string,
  updates: UpdateAgentRequest
): Promise<Agent> {
  const { data } = await apiClient.put<any>(
    `/agents/${id}`,
    updates
  );

  // Backend returns { success: true, agent: {...} }
  if (data.success && data.agent) {
    return data.agent;
  }

  // Fallback to nested data format
  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('Failed to update agent');
}

/**
 * Delete agent
 * DELETE /api/v1/agents/:id
 */
export async function deleteAgent(id: string): Promise<void> {
  await apiClient.delete(`/agents/${id}`);
}

/**
 * Update agent status
 * PUT /api/v1/agents/:id/status
 */
export async function updateAgentStatus(
  id: string,
  status: 'draft' | 'active' | 'paused' | 'archived'
): Promise<Agent> {
  const { data } = await apiClient.put<any>(
    `/agents/${id}/status`,
    { status }
  );

  // Backend returns { success: true, agent: {...} }
  if (data.success && data.agent) {
    return data.agent;
  }

  // Fallback to nested data format
  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('Failed to update agent status');
}

/**
 * Get agent webhook URL
 */
export function getAgentWebhookUrl(
  agentId: string,
  provider: 'telnyx' | 'vonage'
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'https://sms-agent-api.up.railway.app';
  return `${baseUrl}/webhooks/sms/agent/${agentId}/${provider}`;
}