import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicornPlugin from 'eslint-plugin-unicorn';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import promisePlugin from 'eslint-plugin-promise';
import nPlugin from 'eslint-plugin-n';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import prettierPlugin from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'scripts/',
      'src/database/migrations/',
      'test/',
      '**/*.spec.ts',
      '*.config.*',
      'ormconfig.ts',
      '.vuepress/',
      '.yarn/',
      '_templates/',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  unicornPlugin.configs['flat/recommended'],
  sonarjsPlugin.configs.recommended,
  promisePlugin.configs['flat/recommended'],
  nPlugin.configs['flat/recommended'],
  prettierPlugin,

  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Node plugin
      'n/no-extraneous-import': 'off',
      'n/no-missing-import': 'off',
      'n/no-process-exit': 'off',

      // Unicorn
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-abusive-eslint-disable': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-static-only-class': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/expiring-todo-comments': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-empty-file': 'off',
      'unicorn/text-encoding-identifier-case': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-process-exit': 'off',

      // Sonarjs
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/fixme-tag': 'off',
      'sonarjs/todo-tag': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/anchor-precedence': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/assertions-in-tests': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/no-useless-intersection': 'off',
      'sonarjs/function-return-type': 'off',
      'sonarjs/argument-type': 'off',
      'sonarjs/prefer-regexp-exec': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/redundant-type-aliases': 'off',

      // Unicorn additional
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/prefer-ternary': 'off',

      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Prettier
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
          tabWidth: 2,
          bracketSpacing: true,
        },
      ],

      // TypeScript
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',

      // General
      'no-console': [
        'warn',
        {
          allow: ['log', 'info', 'warn', 'error', 'dir', 'table'],
        },
      ],
      'no-await-in-loop': 'off',
      'no-return-await': 'off',
      'max-len': 'off',
      radix: 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },
);
