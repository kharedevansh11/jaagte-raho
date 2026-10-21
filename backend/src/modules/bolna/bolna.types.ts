// Subset of Bolna's execution payload we read. Webhook body and GET /executions/{id} share this shape.
// https://www.bolna.ai/docs/api-reference/executions/get_execution
export interface BolnaExecution {
  id: string;
  status: string;
  transcript?: string | null;
  summary?: string | null;
  conversation_duration?: number | null;
  answered_by_voice_mail?: boolean | null;
  extracted_data?: Record<string, unknown> | null;
  telephony_data?: {
    recording_url?: string | null;
    // "inactivity_timeout" when the call ended because nobody spoke.
    hangup_reason?: string | null;
  } | null;
}

// Statuses after which Bolna sends no more updates for a call.
export const TERMINAL_STATUSES = new Set([
  'completed',
  'no-answer',
  'busy',
  'failed',
  'canceled',
  'stopped',
  'error',
  'balance-low',
]);

// The driver didn't take the call. Other failures (error, balance-low…) are ours, not theirs.
export const MISSED_STATUSES = new Set([
  'no-answer',
  'busy',
  'failed',
  'canceled',
]);
