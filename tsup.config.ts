import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ['better-sqlite3'],
  onSuccess: 'echo "Build complete!"'
});
