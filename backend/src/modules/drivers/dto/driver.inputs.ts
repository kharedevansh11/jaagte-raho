import { Field, InputType, PartialType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import {
  E164,
  HH_MM,
  LANGUAGE_CODES,
  type LanguageCode,
} from '../../../common/languages.js';

@InputType()
export class CreateDriverInput {
  @Field() @IsString() @Length(1, 80) name: string;

  @Field()
  @Matches(E164, { message: 'phone must be E.164, e.g. +919876543210' })
  phone: string;

  // Defaults for language and shift live in the Prisma schema, not here: a GraphQL
  // defaultValue would also fill these on updateDriver and silently reset them.
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(LANGUAGE_CODES)
  language?: LanguageCode;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  ownerName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(E164, { message: 'ownerPhone must be E.164, e.g. +919876543210' })
  ownerPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(HH_MM, { message: 'shiftStart must be HH:mm' })
  shiftStart?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(HH_MM, { message: 'shiftEnd must be HH:mm' })
  shiftEnd?: string;
}

@InputType()
export class UpdateDriverInput extends PartialType(CreateDriverInput) {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
