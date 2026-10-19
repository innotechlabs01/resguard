import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from 'eslint-config-next'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'supabase/**',
      'public/**',
      '.agents/**',
      '__tests__/**',
      'scripts/**',
      'vitest.config.ts',
      'eslint.config.js',
      'next.config.*',
    ],
  },
  {
    rules: {
      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      // Next.js route handlers legitimately export non-component functions
      // Allow explicit any in query mappers (helpers.ts pattern)
      '@typescript-eslint/no-explicit-any': 'warn',
      // react-hooks plugin not installed; suppress the "rule not found" error
      'react-hooks/exhaustive-deps': 'off',
    },
  },
)
