import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    root: '.',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dist': path.resolve(__dirname, './dist'),
    },
  },
});
