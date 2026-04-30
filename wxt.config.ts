import { defineConfig } from 'wxt';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  modules: ['@wxt-dev/module-vue', '@wxt-dev/auto-icons'],
  srcDir: 'src',
  autoIcons: {
    developmentIndicator: false
  },
  build: {
    outDir: '.output',
    rollupOptions: {
      external: ['wxt/browser'],
    }
  },
  vite: (config) => {
    return {
      ...config,
      build: {
        ...config.build,
        modulePreload: {
          polyfill: false,
        },
      },
      optimizeDeps: {
        exclude: []
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '~': resolve(__dirname, 'src'),
          'wxt/browser': resolve(__dirname, 'node_modules/wxt/dist/browser.mjs')
        }
      }
    };
  },
  hooks: {
    'build:done': () => {
      const sidepanelPath = resolve(__dirname, '.output/chrome-mv3/sidepanel.html');
      if (fs.existsSync(sidepanelPath)) {
        let content = fs.readFileSync(sidepanelPath, 'utf8');
        content = content.replace(/src="\/chunks\//g, 'src="./chunks/');
        content = content.replace(/href="\/chunks\//g, 'href="./chunks/');
        fs.writeFileSync(sidepanelPath, content);
        console.log('✓ Fixed sidepanel.html paths');
      }
    }
  },
  manifest: {
    name: 'Postar',
    version: '1.0.0',
    description: 'Postar - International Content Sync Assistant',
    action: {},
    permissions: [
      'storage',
      'activeTab',
      'tabs',
      'scripting',
      'sidePanel',
      'contextMenus',
      'clipboardRead',
      'downloads',
      'management',
      'background'
    ],
    host_permissions: [
      'https://*/*',
      'http://127.0.0.1/*',
      'http://localhost/*'
    ],
    web_accessible_resources: [
      {
        resources: ['index.html', 'assets/*'],
        matches: ['<all_urls>']
      }
    ],
  }
});
