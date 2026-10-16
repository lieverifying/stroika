import { defineConfig } from 'vitest/config';

// Юнит-тесты чистой логики (без DOM): окружение node
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
