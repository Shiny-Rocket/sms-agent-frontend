import { apiClient } from './client';

/**
 * Tools API - Webhook and Client tools
 */

export type ToolType = 'webhook' | 'client';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type ValueType = 'llm_prompt' | 'constant' | 'dynamic_variable';

export interface ToolParameter {
  id: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  identifier: string;
  description?: string;
  required?: boolean;
  valueType: ValueType;
  constantValue?: string;
  dynamicVariable?: string;
  enumValues?: string[];
}

export interface ToolHeader {
  key: string;
  value: string;
}

export interface DynamicVariableAssignment {
  variableName: string;
  jsonPath: string; // JSONPath to extract from response
}

export interface Tool {
  _id: string;
  toolId: string;
  type: ToolType;
  name: string;
  description: string;
  // Webhook tool specific
  url?: string;
  method?: HttpMethod;
  headers?: ToolHeader[];
  pathParameters?: ToolParameter[];
  queryParameters?: ToolParameter[];
  responseTimeoutSecs?: number;
  // Client tool specific
  waitForResponse?: boolean;
  parameters?: ToolParameter[];
  // Common settings
  disableInterruptions?: boolean;
  forcePreToolSpeech?: 'auto' | 'always' | 'never';
  // Dynamic variables
  dynamicVariables?: Record<string, string>;
  dynamicVariablePlaceholders?: Record<string, string>;
  assignments?: DynamicVariableAssignment[];
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookToolRequest {
  name: string;
  description: string;
  url: string;
  method?: HttpMethod;
  headers?: ToolHeader[];
  pathParameters?: ToolParameter[];
  queryParameters?: ToolParameter[];
  responseTimeoutSecs?: number;
  disableInterruptions?: boolean;
  forcePreToolSpeech?: 'auto' | 'always' | 'never';
  dynamicVariables?: Record<string, string>;
  assignments?: DynamicVariableAssignment[];
}

export interface CreateClientToolRequest {
  name: string;
  description: string;
  waitForResponse?: boolean;
  parameters?: ToolParameter[];
  disableInterruptions?: boolean;
  forcePreToolSpeech?: 'auto' | 'always' | 'never';
  dynamicVariables?: Record<string, string>;
  assignments?: DynamicVariableAssignment[];
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  url?: string;
  method?: HttpMethod;
  headers?: ToolHeader[];
  pathParameters?: ToolParameter[];
  queryParameters?: ToolParameter[];
  responseTimeoutSecs?: number;
  waitForResponse?: boolean;
  parameters?: ToolParameter[];
  disableInterruptions?: boolean;
  forcePreToolSpeech?: 'auto' | 'always' | 'never';
  dynamicVariables?: Record<string, string>;
  assignments?: DynamicVariableAssignment[];
}

/**
 * List all tools
 */
export async function listTools(params?: {
  type?: ToolType;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Tool[]> {
  const { data } = await apiClient.get<any>('/tools', { params });

  if (data.success && data.tools) {
    return data.tools;
  }

  return [];
}

/**
 * Get tool by ID
 */
export async function getTool(id: string): Promise<Tool> {
  const { data } = await apiClient.get<any>(`/tools/${id}`);

  if (data.success && data.tool) {
    return data.tool;
  }

  throw new Error('Tool not found');
}

/**
 * Create webhook tool
 */
export async function createWebhookTool(
  toolData: CreateWebhookToolRequest
): Promise<Tool> {
  const { data } = await apiClient.post<any>('/tools/webhook', toolData);

  if (data.success && data.tool) {
    return data.tool;
  }

  throw new Error('Failed to create webhook tool');
}

/**
 * Create client tool
 */
export async function createClientTool(
  toolData: CreateClientToolRequest
): Promise<Tool> {
  const { data } = await apiClient.post<any>('/tools/client', toolData);

  if (data.success && data.tool) {
    return data.tool;
  }

  throw new Error('Failed to create client tool');
}

/**
 * Update tool
 */
export async function updateTool(
  id: string,
  updates: UpdateToolRequest
): Promise<Tool> {
  const { data } = await apiClient.put<any>(`/tools/${id}`, updates);

  if (data.success && data.tool) {
    return data.tool;
  }

  throw new Error('Failed to update tool');
}

/**
 * Delete tool
 */
export async function deleteTool(id: string): Promise<void> {
  await apiClient.delete(`/tools/${id}`);
}
