// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  // Replaces .eslintignore. Anything generated or vendored.
  {
    ignores: ['**/dist/**', '**/build/**', '**/coverage/**', '**/node_modules/**'],
  },

  // Type-aware linting for all TypeScript in the monorepo. projectService finds
  // the nearest tsconfig.json per file, so each workspace lints under its own config.
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Unhandled promises are the single most common Node bug. Not negotiable.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Allow deliberately unused args when prefixed with _.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Type-only imports must say so — required by verbatimModuleSyntax.
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // The service boundary rule. services/* and apps/* talk over HTTP, never by import.
  // This is what stops the monorepo quietly dissolving the architecture.
  {
    files: ['services/*/src/**/*.ts', 'apps/*/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@tracker/bff',
                '@tracker/applications',
                '@tracker/companies',
                '@tracker/events-worker',
                '@tracker/web',
              ],
              message:
                'Services and apps are separately deployed. Talk over HTTP, or put the shared code in @tracker/shared.',
            },
            {
              group: ['**/../../services/**', '**/../../apps/**'],
              message: 'Do not reach across workspace boundaries with a relative path.',
            },
          ],
        },
      ],
    },
  },

  // Plain JS (this file, and any config files) gets no type-aware rules.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
  },

  // Must be last: turns off every rule that would fight Prettier.
  prettier,
);
