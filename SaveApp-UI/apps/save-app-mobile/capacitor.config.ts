import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aviv.saveapp',
  appName: 'SaveApp',
  webDir: '../../dist/apps/save-app-mobile/browser',
  server: {
    androidScheme: 'https', // DEV ONLY
    cleartext: true,       //  DEV ONLY
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
