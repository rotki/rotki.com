import type { Options } from 'tsdown';

const config: Options = {
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  dts: true,
  external: ['zod'],
  platform: 'neutral',
};

export default config;
