import type { CodegenConfig } from '@graphql-codegen/cli'

// Reads the backend's schema and our .gql files, and writes fully typed documents.
// Run `pnpm codegen` after changing any .gql file or the backend schema.
const config: CodegenConfig = {
  schema: '../backend/src/schema.gql',
  documents: 'src/graphql/**/*.gql',
  generates: {
    'src/graphql/generated.ts': {
      plugins: ['typescript-operations', 'typed-document-node'],
      config: {
        enumsAsTypes: true,
        onlyOperationTypes: true,
        useTypeImports: true,
        avoidOptionals: { field: true, inputValue: false },
        scalars: { DateTime: 'string' },
      },
    },
  },
}

export default config
