// eslint.config.js - Habify Frontend (Expo / React Native)

import eslint from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 1) Ignore list
  {
    ignores: ['node_modules', 'dist', '.expo', 'android', 'ios'],
  },

  // 2) Uygulama kodu (React Native, TS/TSX)
  {
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        JSX: 'readonly',
        // Expo/React Native tarafında process kullandığın için:
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
      'react-native': reactNative,
    },
    rules: {
      // ESLint temel kuralları
      ...eslint.configs.recommended.rules,
      // TS için önerilen (type-checked) kurallar
      ...tseslint.configs.recommendedTypeChecked[0].rules,

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Native
      'react-native/no-unused-styles': 'warn',

      // TypeScript Specific
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off', // Turn off base rule as TS rule is used
    },
  },

  // 3) Config & script dosyaları (Node ortamı)
  {
    files: ['eslint.config.js', 'commitlint.config.js', 'scripts/**/*.{js,ts}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
);
