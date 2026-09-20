import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nomin.workspace',
  appName: 'Nomin Workspace',
  webDir: 'out',
  server: {
    url: 'https://nomin-workspace.vercel.app',
    cleartext: true
  }
};

export default config;
