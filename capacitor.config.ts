
import { CapacitorConfig } from '@capacitor/cli';

const appId = 'svelte-giflist.ionic.io';
const appName = 'svelte-giflist';
const server = process.argv.includes('-hmr') ? {
  'url': '192.168.86.23:5173',
  'cleartext': true
} : {};
const webDir = 'build';

const config: CapacitorConfig = {
  appId,
  appName,
  webDir,
  server
};

if (process.argv.includes('-hmr')) console.log('WARNING: running capacitor with livereload config', config);

export default config;
  