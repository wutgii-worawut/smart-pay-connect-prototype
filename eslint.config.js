import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importX from 'eslint-plugin-import-x'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'import-x': importX,
    },
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      // ต้องรู้จัก tsconfig paths (alias @/*) + นามสกุล .ts/.tsx
      // ไม่งั้น no-restricted-paths resolve import ผ่าน '@/...' ไม่ได้แล้วข้ามเงียบ
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './tsconfig.app.json',
        }),
      ],
    },
    rules: {
      // กฎเหล็ก §6: ห้าม import ข้าม feature โดยตรง + shared ห้าม import จาก features/app
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/features/auth',
              from: './src/features',
              except: ['./auth'],
            },
            {
              target: './src/features/attendance',
              from: './src/features',
              except: ['./attendance'],
            },
            {
              target: './src/features/leave',
              from: './src/features',
              except: ['./leave'],
            },
            {
              target: './src/features/approval',
              from: './src/features',
              except: ['./approval'],
            },
            {
              target: './src/features/payroll',
              from: './src/features',
              except: ['./payroll'],
            },
            {
              target: './src/features/calendar',
              from: './src/features',
              except: ['./calendar'],
            },
            // features ห้าม import จาก app
            { target: './src/features', from: './src/app' },
            // shared ห้าม import จาก features/app
            {
              target: [
                './src/components',
                './src/hooks',
                './src/lib',
                './src/types',
                './src/utils',
                './src/stores',
                './src/config',
              ],
              from: ['./src/features', './src/app'],
            },
          ],
        },
      ],
    },
  },
])
