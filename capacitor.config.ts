import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.towerofcardborn.app',
  appName: 'Tower of Cardborn',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
