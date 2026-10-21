// App-facing names for the generated GraphQL types, so the rest of the app never
// depends on generated naming. Everything here is derived from the backend schema.
import type {
  AlertLevel,
  CallFieldsFragment,
  CallKind as GeneratedCallKind,
  DriversQuery,
  UpdateDriverInput,
} from '../graphql/generated'

export type Level = AlertLevel
export type CallKind = GeneratedCallKind
export type Call = CallFieldsFragment
export type Driver = DriversQuery['drivers'][number]
export type DriverInput = UpdateDriverInput

/** What the public demo page receives for a call (REST, not GraphQL). */
export interface DemoResult {
  status: string
  level: Level | null
  score: number | null
  reasons: string[]
  summary: string | null
  transcript: string | null
  completedAt: string | null
}

export interface DemoCallInput {
  name: string
  phone: string
  language: string
}
