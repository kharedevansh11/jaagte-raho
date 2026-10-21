// Codes Bolna accepts as a per-call language override; the agent must have each one configured.
export const LANGUAGES = {
  hi: 'Hindi',
  kn: 'Kannada',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  bn: 'Bengali',
  en: 'English',
} as const;

export type LanguageCode = keyof typeof LANGUAGES;
export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];

export const E164 = /^\+[1-9]\d{7,14}$/;
export const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;
