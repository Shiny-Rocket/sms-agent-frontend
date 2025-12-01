import { apiClient } from './client';

/**
 * Models API
 */

export type LLMProvider = 'openai' | 'gemini' | 'groq' | 'anthropic';

export interface LLMModel {
  id: string;
  provider: LLMProvider;
  name: string;
  contextWindow?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  maxOutputTokens?: number;
  supportsStreaming?: boolean;
}

/**
 * List all available models
 * GET /api/v1/models
 */
export async function listModels(): Promise<LLMModel[]> {
  const { data } = await apiClient.get<any>('/models');

  if (data.success && data.models) {
    return data.models;
  }

  return [];
}

/**
 * List models by provider
 * GET /api/v1/models/:provider
 */
export async function listModelsByProvider(
  provider: LLMProvider
): Promise<LLMModel[]> {
  const { data } = await apiClient.get<any>(`/models/${provider}`);

  if (data.success && data.models) {
    return data.models;
  }

  return [];
}

/**
 * Refresh model cache
 * POST /api/v1/models/refresh
 */
export async function refreshModels(): Promise<void> {
  await apiClient.post('/models/refresh');
}
