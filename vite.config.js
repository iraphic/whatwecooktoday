import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs';

// Read package version
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
let gitHash = '';
let gitDate = '';

try {
  gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  gitDate = execSync('git log -1 --format=%cd --date=short').toString().trim();
} catch (e) {
  console.warn('Warning: Could not fetch git info.');
}

const appVersion = `${pkg.version}${gitHash ? ` (${gitHash})` : ''}`;

export default defineConfig({
  root: '.',
  publicDir: 'public',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_UPDATED__: JSON.stringify(gitDate || new Date().toISOString().split('T')[0]),
  },
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
