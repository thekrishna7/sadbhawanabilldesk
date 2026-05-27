import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import LogoAnimation from '@/components/LogoAnimation';
import { useStore } from '@/store/useStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated } = useStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (showSplash) return;

    // Determine current route state
    const inAuthGroup = segments[0] === '(tabs)';
    
    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if trying to access tabs but not authenticated
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      // Redirect to dashboard tabs if authenticated and on auth pages (login/signup)
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, showSplash]);

  if (showSplash) {
    return <LogoAnimation onComplete={() => setShowSplash(false)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen 
          name="create-invoice" 
          options={{ 
            title: 'Create Invoice',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#18181B' : '#1E3A8A' },
            headerTintColor: '#fff',
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="invoice-detail" 
          options={{ 
            title: 'Invoice Details',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#18181B' : '#1E3A8A' },
            headerTintColor: '#fff',
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Info' }} />
      </Stack>
    </ThemeProvider>
  );
}
