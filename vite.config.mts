import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { esbuildOptions: { plugins: [{ name: 'svg-web-touch-sound', setup(build) { build.onResolve({ filter: /NativeSvgSoundModule/ }, () => ({ path: resolve('web/SvgTouchSound.ts') })); } }], resolveExtensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'] } },
  root: 'web',
  base: './',
  define: { global: 'globalThis', __DEV__: 'false', 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: [
      { find: /^\.\.\/fabric\/NativeSvgSoundModule$/, replacement: resolve('web/SvgTouchSound.ts') },
      { find: /^react-native-svg$/, replacement: resolve('node_modules/react-native-svg/lib/module/elements.web.js') },
      { find: /^react-native$/, replacement: 'react-native-web' },
      
      { find: /^react-native-sound$/, replacement: resolve('web/Sound.ts') },
      { find: /^(?:\.\/src\/|(?:\.\.\/)+|\.\/)assets$/, replacement: resolve('src/assets.web.ts') },
    ],
  },
  build: {
    outDir: resolve('dist'),
    emptyOutDir: true,
    rollupOptions: { input: resolve('web/index.html') },
  },
  server: { host: '0.0.0.0' },
});
