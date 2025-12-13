import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Provide test env vars for Supabase client initialization
  define: {
    'import.meta.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify('http://localhost:54321'),
    'import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules/**', 'dist/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: [
        'src/components/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/pages/**/*.{ts,tsx}',
        'src/types/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/integrations/supabase/types.ts',
        'src/components/admin/**', // Admin components are less critical
        'src/components/ui/**', // UI primitives from shadcn
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
