import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.towerofcardborn.app',
  appName: 'Tower of Cardborn',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  // 릴리스 로깅 최소화
  loggingBehavior: 'production',
  android: {
    // 릴리스 웹뷰 디버깅 차단
    webContentsDebuggingEnabled: false,
  },
};

export default config;
