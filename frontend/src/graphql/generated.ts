/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AlertLevel =
  | 'AMBER'
  | 'GREEN'
  | 'MISSED'
  | 'RED';

export type CallKind =
  | 'CHECK_IN'
  | 'OWNER_ALERT'
  | 'WELCOME';

export type CreateDriverInput = {
  language?: string | null | undefined;
  name: string;
  ownerName?: string | null | undefined;
  ownerPhone?: string | null | undefined;
  phone: string;
  shiftEnd?: string | null | undefined;
  shiftStart?: string | null | undefined;
};

export type UpdateDriverInput = {
  active?: boolean | null | undefined;
  language?: string | null | undefined;
  name?: string | null | undefined;
  ownerName?: string | null | undefined;
  ownerPhone?: string | null | undefined;
  phone?: string | null | undefined;
  shiftEnd?: string | null | undefined;
  shiftStart?: string | null | undefined;
};

export type CallFieldsFragment = { id: string, kind: CallKind, status: string, level: AlertLevel | null, score: number | null, reasons: Array<string>, summary: string | null, transcript: string | null, location: string | null, passenger: boolean | null, durationSec: number | null, createdAt: string, completedAt: string | null };

export type DriverFieldsFragment = { id: string, name: string, phone: string, language: string, ownerName: string | null, ownerPhone: string | null, shiftStart: string, shiftEnd: string, active: boolean, lastLevel: AlertLevel | null, lastCallAt: string | null, nextCallAt: string | null, lastAlertAt: string | null };

export type CallDriverNowMutationVariables = Exact<{
  id: string | number;
}>;


export type CallDriverNowMutation = { callDriverNow: { id: string } };

export type CreateDriverMutationVariables = Exact<{
  input: CreateDriverInput;
}>;


export type CreateDriverMutation = { createDriver: { id: string } };

export type DeleteDriverMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteDriverMutation = { deleteDriver: { id: string } };

export type UpdateDriverMutationVariables = Exact<{
  id: string | number;
  input: UpdateDriverInput;
}>;


export type UpdateDriverMutation = { updateDriver: { id: string } };

export type DriverQueryVariables = Exact<{
  id: string | number;
}>;


export type DriverQuery = { driver: { id: string, name: string, phone: string, language: string, ownerName: string | null, ownerPhone: string | null, shiftStart: string, shiftEnd: string, active: boolean, lastLevel: AlertLevel | null, lastCallAt: string | null, nextCallAt: string | null, lastAlertAt: string | null, calls: Array<{ id: string, kind: CallKind, status: string, level: AlertLevel | null, score: number | null, reasons: Array<string>, summary: string | null, transcript: string | null, location: string | null, passenger: boolean | null, durationSec: number | null, createdAt: string, completedAt: string | null }> } };

export type DriverCallsQueryVariables = Exact<{
  driverId: string | number;
  take?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type DriverCallsQuery = { driverCalls: { nextCursor: string | null, items: Array<{ id: string, kind: CallKind, status: string, level: AlertLevel | null, score: number | null, reasons: Array<string>, summary: string | null, transcript: string | null, location: string | null, passenger: boolean | null, durationSec: number | null, createdAt: string, completedAt: string | null }> } };

export type DriversQueryVariables = Exact<{ [key: string]: never; }>;


export type DriversQuery = { drivers: Array<{ id: string, name: string, phone: string, language: string, ownerName: string | null, ownerPhone: string | null, shiftStart: string, shiftEnd: string, active: boolean, lastLevel: AlertLevel | null, lastCallAt: string | null, nextCallAt: string | null, lastAlertAt: string | null, calls: Array<{ id: string, kind: CallKind, status: string, level: AlertLevel | null, score: number | null, reasons: Array<string>, summary: string | null, transcript: string | null, location: string | null, passenger: boolean | null, durationSec: number | null, createdAt: string, completedAt: string | null }> }> };

export const CallFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CallFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Call"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"reasons"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"transcript"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"passenger"}},{"kind":"Field","name":{"kind":"Name","value":"durationSec"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]} as unknown as DocumentNode<CallFieldsFragment, unknown>;
export const DriverFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DriverFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Driver"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"ownerName"}},{"kind":"Field","name":{"kind":"Name","value":"ownerPhone"}},{"kind":"Field","name":{"kind":"Name","value":"shiftStart"}},{"kind":"Field","name":{"kind":"Name","value":"shiftEnd"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"lastLevel"}},{"kind":"Field","name":{"kind":"Name","value":"lastCallAt"}},{"kind":"Field","name":{"kind":"Name","value":"nextCallAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastAlertAt"}}]}}]} as unknown as DocumentNode<DriverFieldsFragment, unknown>;
export const CallDriverNowDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CallDriverNow"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"callDriverNow"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CallDriverNowMutation, CallDriverNowMutationVariables>;
export const CreateDriverDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDriver"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDriverInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDriver"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateDriverMutation, CreateDriverMutationVariables>;
export const DeleteDriverDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDriver"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteDriver"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteDriverMutation, DeleteDriverMutationVariables>;
export const UpdateDriverDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDriver"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDriverInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDriver"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateDriverMutation, UpdateDriverMutationVariables>;
export const DriverDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Driver"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"driver"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DriverFields"}},{"kind":"Field","name":{"kind":"Name","value":"calls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CallFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DriverFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Driver"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"ownerName"}},{"kind":"Field","name":{"kind":"Name","value":"ownerPhone"}},{"kind":"Field","name":{"kind":"Name","value":"shiftStart"}},{"kind":"Field","name":{"kind":"Name","value":"shiftEnd"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"lastLevel"}},{"kind":"Field","name":{"kind":"Name","value":"lastCallAt"}},{"kind":"Field","name":{"kind":"Name","value":"nextCallAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastAlertAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CallFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Call"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"reasons"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"transcript"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"passenger"}},{"kind":"Field","name":{"kind":"Name","value":"durationSec"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]} as unknown as DocumentNode<DriverQuery, DriverQueryVariables>;
export const DriverCallsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DriverCalls"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"driverId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"driverCalls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"driverId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"driverId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CallFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CallFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Call"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"reasons"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"transcript"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"passenger"}},{"kind":"Field","name":{"kind":"Name","value":"durationSec"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]} as unknown as DocumentNode<DriverCallsQuery, DriverCallsQueryVariables>;
export const DriversDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Drivers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"drivers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DriverFields"}},{"kind":"Field","name":{"kind":"Name","value":"calls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CallFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DriverFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Driver"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"ownerName"}},{"kind":"Field","name":{"kind":"Name","value":"ownerPhone"}},{"kind":"Field","name":{"kind":"Name","value":"shiftStart"}},{"kind":"Field","name":{"kind":"Name","value":"shiftEnd"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"lastLevel"}},{"kind":"Field","name":{"kind":"Name","value":"lastCallAt"}},{"kind":"Field","name":{"kind":"Name","value":"nextCallAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastAlertAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CallFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Call"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"reasons"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"transcript"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"passenger"}},{"kind":"Field","name":{"kind":"Name","value":"durationSec"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]} as unknown as DocumentNode<DriversQuery, DriversQueryVariables>;