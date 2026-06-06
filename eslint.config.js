import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/automation.cjs'],
    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 2021,
      globals: {
        GmailApp: 'readonly',
        Gmail: 'readonly',
        UrlFetchApp: 'readonly',
        Utilities: 'readonly',
        PropertiesService: 'readonly',
        ScriptApp: 'readonly',
        console: 'readonly',
        module: 'writable'
      }
    }
  },
  {
    files: ['scripts/**/*.js', 'test/**/*.js', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      globals: {
        ...globals.node
      }
    }
  }
];
