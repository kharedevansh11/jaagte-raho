import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation.js';

export interface PlaceCallParams {
  agentId: string;
  to: string;
  userData: Record<string, string>;
  language?: string;
}

@Injectable()
export class BolnaClient {
  private static readonly BASE_URL = 'https://api.bolna.ai';

  constructor(private readonly config: ConfigService<Env, true>) {}

  /** Places an outbound call and returns Bolna's execution id. */
  async placeCall({
    agentId,
    to,
    userData,
    language,
  }: PlaceCallParams): Promise<string> {
    const from = this.config.get('BOLNA_FROM_NUMBER', { infer: true });
    const res = await fetch(`${BolnaClient.BASE_URL}/call`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.get('BOLNA_API_KEY', { infer: true })}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        recipient_phone_number: to,
        ...(from && { from_phone_number: from }),
        user_data: userData,
        ...(language && { agent_data: { language } }),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Bolna /call ${res.status}: ${await res.text()}`);
    }
    const body = (await res.json()) as { execution_id?: string };
    if (!body.execution_id)
      throw new Error('Bolna /call returned no execution_id');
    return body.execution_id;
  }
}
