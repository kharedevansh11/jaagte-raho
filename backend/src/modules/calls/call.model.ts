import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { AlertLevel, CallKind } from '../../generated/prisma/enums.js';

registerEnumType(CallKind, { name: 'CallKind' });

@ObjectType()
export class Call {
  @Field(() => ID) id: string;
  @Field() driverId: string;
  @Field(() => CallKind) kind: CallKind;
  @Field() status: string;
  @Field(() => AlertLevel, { nullable: true }) level: AlertLevel | null;
  @Field(() => Int, { nullable: true }) score: number | null;
  @Field(() => [String]) reasons: string[];
  @Field(() => String, { nullable: true }) transcript: string | null;
  @Field(() => String, { nullable: true }) summary: string | null;
  @Field(() => String, { nullable: true }) location: string | null;
  @Field(() => Boolean, { nullable: true }) passenger: boolean | null;
  @Field(() => Float, { nullable: true }) durationSec: number | null;
  @Field(() => String, { nullable: true }) recordingUrl: string | null;
  @Field() createdAt: Date;
  @Field(() => Date, { nullable: true }) completedAt: Date | null;
}
