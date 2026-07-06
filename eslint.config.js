import js from '@eslint/js';
import globals from 'globals';
import jsonc from 'eslint-plugin-jsonc';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'package-lock.json',
      // Managed by release-please; not linted so its Release PR stays green.
      'release-please-config.json',
      '.release-please-manifest.json',
    ],
  },

  // Node ESM: build tooling and this config file.
  {
    files: ['**/*.mjs', 'eslint.config.js'],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } },
  },

  // Browser classic script (loaded via <script src> — not a module).
  {
    files: ['web/app.js'],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser } },
  },

  // JSON / JSONC: treat every .json as JSONC so .vscode comments are allowed.
  ...jsonc.configs['flat/recommended-with-jsonc'].map((c) => ({ ...c, files: ['**/*.json'] })),

  prettier,
];
