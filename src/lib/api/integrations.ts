import { apiClient } from './client';

/**
 * Integrations API - MCP Server integrations
 */

export type ToolApprovalMode = 'always_ask' | 'fine_grained' | 'no_approval';

export interface IntegrationTool {
  id: string;
  name: string;
  description?: string;
  parameters?: ToolParameter[];
  // Fine-grained approval settings
  approvalMode?: 'disabled' | 'ask' | 'auto';
}

export interface ToolParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
}

export interface Integration {
  _id: string;
  integrationId: string;
  name: string;
  type: 'mcp'; // Currently only MCP integrations supported
  serverUrl: string;
  protocol: 'sse' | 'stdio' | 'http';
  // Security settings
  toolApprovalMode: ToolApprovalMode;
  // Tool settings
  forcePreToolSpeech?: boolean;
  disableInterruptions?: boolean;
  // Available tools from this integration
  tools?: IntegrationTool[];
  // Agents using this integration
  dependentAgentIds?: string[];
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationRequest {
  name: string;
  serverUrl: string;
  protocol?: 'sse' | 'stdio' | 'http';
  toolApprovalMode?: ToolApprovalMode;
  forcePreToolSpeech?: boolean;
  disableInterruptions?: boolean;
}

export interface UpdateIntegrationRequest {
  name?: string;
  serverUrl?: string;
  protocol?: 'sse' | 'stdio' | 'http';
  toolApprovalMode?: ToolApprovalMode;
  forcePreToolSpeech?: boolean;
  disableInterruptions?: boolean;
  tools?: IntegrationTool[];
}

/**
 * List all integrations
 */
export async function listIntegrations(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Integration[]> {
  const { data } = await apiClient.get<any>('/integrations', { params });

  if (data.success && data.integrations) {
    return data.integrations;
  }

  return [];
}

/**
 * Get integration by ID
 */
export async function getIntegration(id: string): Promise<Integration> {
  const { data } = await apiClient.get<any>(`/integrations/${id}`);

  if (data.success && data.integration) {
    return data.integration;
  }

  throw new Error('Integration not found');
}

/**
 * Create new integration
 */
export async function createIntegration(
  integrationData: CreateIntegrationRequest
): Promise<Integration> {
  const { data } = await apiClient.post<any>('/integrations', integrationData);

  if (data.success && data.integration) {
    return data.integration;
  }

  throw new Error('Failed to create integration');
}

/**
 * Update integration
 */
export async function updateIntegration(
  id: string,
  updates: UpdateIntegrationRequest
): Promise<Integration> {
  const { data } = await apiClient.put<any>(`/integrations/${id}`, updates);

  if (data.success && data.integration) {
    return data.integration;
  }

  throw new Error('Failed to update integration');
}

/**
 * Delete integration
 */
export async function deleteIntegration(id: string): Promise<void> {
  await apiClient.delete(`/integrations/${id}`);
}

/**
 * Refresh integration tools (re-fetch from MCP server)
 */
export async function refreshIntegrationTools(id: string): Promise<Integration> {
  const { data } = await apiClient.post<any>(`/integrations/${id}/refresh`);

  if (data.success && data.integration) {
    return data.integration;
  }

  throw new Error('Failed to refresh integration tools');
}
