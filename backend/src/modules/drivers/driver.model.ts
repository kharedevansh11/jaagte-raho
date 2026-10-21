import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AlertLevel } from '../../generated/prisma/enums.js';

registerEnumType(AlertLevel, { name: 'AlertLevel' });

@ObjectType()
export class Driver {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() phone: string;
  @Field() language: string;
  @Field(() => String, { nullable: true }) ownerName: string | null;
  @Field(() => String, { nullable: true }) ownerPhone: string | null;
  @Field() shiftStart: string;
  @Field() shiftEnd: string;
  @Field() active: boolean;
  @Field() isDemo: boolean;
  @Field(() => AlertLevel, { nullable: true }) lastLevel: AlertLevel | null;
  @Field(() => Date, { nullable: true }) lastCallAt: Date | null;
  @Field(() => Date, { nullable: true }) nextCallAt: Date | null;
  @Field(() => Date, { nullable: true }) lastAlertAt: Date | null;
  @Field() createdAt: Date;
}
