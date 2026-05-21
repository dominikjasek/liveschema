import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/liveschema-resolver.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
  external: ['react-hook-form', '@hookform/resolvers', 'liveschema'],
})
