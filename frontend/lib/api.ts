import type { Evaluation, EvaluationHistoryItem } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers }
  });
  if (!response.ok) {
    const message = await response.json().catch(() => null);
    throw new Error(message?.detail || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function evaluate(input: Pick<Evaluation, 'prompt' | 'response_a' | 'response_b'>) {
  return request<Evaluation>('/evaluations', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchHistory() {
  return request<EvaluationHistoryItem[]>('/evaluations?limit=50');
}
