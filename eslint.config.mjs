// @ts-check
import eslint from '@eslint/js';
import { flatConfigs as importXConfigs } from 'eslint-plugin-import-x';
import jest from 'eslint-plugin-jest';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist', 'coverage'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  importXConfigs.recommended,
  importXConfigs.typescript,
  sonarjs.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // --- TypeScript: async/await y promesas ---
      // En una API bancaria una promesa colgada es una operación perdida.
      '@typescript-eslint/no-floating-promises': 'error',
      // Sin return await dentro de try, el catch no atrapa el rechazo.
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],

      // --- TypeScript: higiene de tipos ---
      // Warn: los any quedan visibles para ir limpiando sin bloquear.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // || vs ?? importa: 0, '' y false no son "sin valor".
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      // Caza chequeos que los tipos demuestran siempre verdaderos/falsos.
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      // Al agregar un valor a un enum, marca los switch que no lo manejan.
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // La regla base da falsos positivos con enums de TS.
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      // --- JavaScript general ---
      // En NestJS se usa Logger; evita console.log de debug olvidados.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      // config-prettier la apaga; se reactiva acá (después de prettier).
      curly: ['error', 'all'],
      'object-shorthand': 'error',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // --- Imports ---
      // Orden: builtin → externos → internos → relativos,
      // alfabético dentro de cada grupo, sin líneas en blanco entre grupos.
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'never',
        },
      ],
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-mutable-exports': 'error',
      'import-x/no-duplicates': 'error',
      // La cubre import-x/no-duplicates, que además entiende type imports.
      'no-duplicate-imports': 'off',
    },
  },
  {
    // Buenas prácticas de Jest solo en archivos de test.
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    ...jest.configs['flat/recommended'],
  },
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      // En los tests es normal repetir strings (emails, ids, mensajes).
      'sonarjs/no-duplicate-string': 'off',
      // Las fixtures de test necesitan literales que parecen credenciales.
      'sonarjs/no-hardcoded-passwords': 'off',
      // supertest afirma con .expect() encadenado, no con expect() de Jest.
      'jest/expect-expect': [
        'warn',
        { assertFunctionNames: ['expect', '**.expect'] },
      ],
    },
  },
);
