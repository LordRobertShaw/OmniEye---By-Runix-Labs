import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: '/',
          name: 'OmniEye',
          short_name: 'OmniEye',
          description: 'Interactive network resilience workbench for WireGuard, SSH, Tailscale, and emergency outage recovery.',
          theme_color: '#050507',
          background_color: '#050507',
          display: 'standalone',
          orientation: 'any',
          categories: ['utilities', 'developer', 'security', 'network'],
          start_url: '/',
          scope: '/',
          shortcuts: [
            {
              name: '10s Self-Tune Benchmark',
              short_name: 'Self-Tune',
              description: 'Run 10-second hardware MTU & keepalive throughput benchmark',
              url: '/#workbench-self-tune',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Tunnel Blueprint Workbench',
              short_name: 'Workbench',
              description: 'Configure WireGuard, SSH, and Geo-IP region-locked tunnels',
              url: '/',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-maps": ["@vis.gl/react-google-maps"],
            "vendor-qr": ["qrcode", "html5-qrcode"],
            "vendor-zip": ["@zip.js/zip.js"],
            "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore"],
            "vendor-motion": ["motion"],
          },
        },
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
