import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sadbhawana.billdesk',
  appName: 'Sadbhawana BillDesk',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://sadbhawanabilldesk.vercel.app',
    allowNavigation: ['sadbhawanabilldesk.vercel.app'],
    errorPath: 'offline.html'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0d1b2a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  }
};

export default config;
