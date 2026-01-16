// =============================================================================
// ESLint Flat Config for redditx2md
// Compatible with ESLint 9.x
// =============================================================================

import js from '@eslint/js';

export default [
  // Ignore patterns (must be first in flat config)
  {
    ignores: [
      'node_modules/**',
      'output/**',
      'coverage/**',
      '*.config.js',
      'dist/**'
    ]
  },

  // Base JavaScript rules
  js.configs.recommended,

  // Project-specific overrides
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __filename: 'readonly',
        __dirname: 'readonly',
        // Console is allowed in this CLI project
        console: 'readonly',
        // Browser/Timer globals (used in tests and async operations)
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly'
      }
    },
    rules: {
      // Relax rules for CLI tool
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',

      // Code quality
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],

      // Style
      'brace-style': ['error', '1tbs'],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],

      // Spacing
      'arrow-spacing': ['error', { before: true, after: true }],
      'space-before-blocks': 'error',
      'keyword-spacing': ['error', { before: true, after: true }],
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'eol-last': ['error', 'always']
    }
  }
];
