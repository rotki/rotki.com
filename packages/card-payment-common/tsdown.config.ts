import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/schemas/*.ts', 'src/utils/*.ts', '!src/**/*.spec.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  dts: true,
  external: ['zod'],
  platform: 'neutral',
});
