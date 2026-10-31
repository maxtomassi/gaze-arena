import { defineConfig } from 'vitest/config';

// Repo-level checks only; each workspace runs its own tests with its own config.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/repo/**/*.test.ts'],
    testTimeout: 30_000,
  },
});
