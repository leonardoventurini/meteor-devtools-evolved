import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-plugin-prettier'
import unicorn from 'eslint-plugin-unicorn'
import globals from 'globals'

export default [
  {
    ignores: [
      'node_modules/**',
      'extension/**',
      'devapp-*/**',
      '.yarn/**',
      'webpack/**',
    ],
  },
  // Base config for all files
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      prettier,
      unicorn,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
        Meteor: 'readonly',
        Helene: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...unicorn.configs.recommended.rules,
      'no-console': 0,
      'react/prop-types': 0,
      'react/jsx-curly-spacing': 0,
      'react/display-name': 0,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 0,
      'no-inner-declarations': 0,
      'react/no-unescaped-entities': 0,
      'react/react-in-jsx-scope': 0,
      // Unicorn adjustments for this project
      'unicorn/prevent-abbreviations': 0,
      'unicorn/filename-case': 0,
      'unicorn/no-null': 0,
      'unicorn/prefer-module': 0,
      'unicorn/prefer-node-protocol': 0,
      'prettier/prettier': 'error',
    },
  },
  // TypeScript specific config
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescript,
      react,
      'react-hooks': reactHooks,
      prettier,
      unicorn,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
        Meteor: 'readonly',
        Helene: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...unicorn.configs.recommended.rules,
      'no-console': 0,
      'react/prop-types': 0,
      'react/jsx-curly-spacing': 0,
      'react/display-name': 0,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 0,
      'no-inner-declarations': 0,
      'react/no-unescaped-entities': 0,
      'react/react-in-jsx-scope': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-unused-vars': 0,
      '@typescript-eslint/no-this-alias': 0,
      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/no-namespace': 0,
      'no-undef': 0, // TypeScript handles this
      // Unicorn adjustments for this project
      'unicorn/prevent-abbreviations': 0,
      'unicorn/filename-case': 0,
      'unicorn/no-null': 0,
      'unicorn/prefer-module': 0,
      'unicorn/prefer-node-protocol': 0,
      'prettier/prettier': 'error',
    },
  },
]
