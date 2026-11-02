import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aviv.saveapp',
  appName: 'Collections',
  webDir: '../../dist/apps/collections-mobile/browser',
  server: {
    androidScheme: 'https', // DEV ONLY
    cleartext: true,       //  DEV ONLY
  },
};

export default config;
