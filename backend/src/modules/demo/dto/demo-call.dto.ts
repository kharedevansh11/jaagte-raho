import { IsIn, IsString, Length, Matches } from 'class-validator';
import {
  E164,
  LANGUAGE_CODES,
  type LanguageCode,
} from '../../../common/languages.js';

export class DemoCallDto {
  @IsString() @Length(1, 40) name: string;

  @Matches(E164, { message: 'phone must be E.164, e.g. +919876543210' })
  phone: string;

  @IsIn(LANGUAGE_CODES) language: LanguageCode;
}
