import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.{test,spec}.{ts,js}', 'tests/**/*.{test,spec}.{ts,js}', 'server/tests/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules', 'dist', '.nuxt'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        'tests/',
        '*.config.js',
        '*.config.ts',
        'dist/',
        '.nuxt/',
        'coverage/',
        'server/api/',
        'plugins/',
        'middleware/',
        'app.vue'
      ]
    }
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
      '#app': resolve(__dirname, '.nuxt')
    }
  }
})
