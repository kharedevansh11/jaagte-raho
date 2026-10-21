import { plainToInstance, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export class Env {
  @IsString() @IsNotEmpty() DATABASE_URL: string;

  @IsString() @IsNotEmpty() BOLNA_API_KEY: string;
  @IsString() @IsNotEmpty() BOLNA_CHECKIN_AGENT_ID: string;
  @IsString() @IsNotEmpty() BOLNA_ALERT_AGENT_ID: string;
  @IsOptional() @IsString() BOLNA_FROM_NUMBER?: string;

  @IsString() @IsNotEmpty() WEBHOOK_TOKEN: string;
  // Owner sign-in (https://dashboard.clerk.com → API keys)
  @IsString() @IsNotEmpty() CLERK_SECRET_KEY: string;
  // Comma-separated frontend origins allowed to use a session, e.g. http://localhost:5173
  @IsOptional() @IsString() CLERK_AUTHORIZED_PARTIES?: string;

  @IsString() REDIS_URL = 'redis://localhost:6379';

  @IsString() APP_TIMEZONE = 'Asia/Kolkata';
  @Type(() => Number) @IsInt() @Min(1) CALL_INTERVAL_MINUTES = 20;
  @Type(() => Number) @IsInt() @Min(1) RECALL_MINUTES = 10;
  @Type(() => Number) @IsInt() @Min(1) ALERT_COOLDOWN_MINUTES = 30;
  @Type(() => Number) @IsInt() @Min(0) DEMO_CALLS_PER_DAY = 50;
}

export function validateEnv(raw: Record<string, unknown>): Env {
  // Empty strings from .env mean "not set", so defaults and @IsOptional apply.
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== ''),
  );
  const env = plainToInstance(Env, cleaned);
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length) {
    const missing = errors.map((e) => e.property).join(', ');
    throw new Error(`Invalid or missing env vars: ${missing}`);
  }
  return env;
}
