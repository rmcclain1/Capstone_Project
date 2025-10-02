import React from "react";
import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/app/context/auth_context';

export default function RootLayout() {
  return (
      <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
              {/* Tabs */}
              <Stack.Screen name="(tabs)" />
              {/* Standalone screens */}
              <Stack.Screen name="login" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="organization" />
              <Stack.Screen name="ai" />
              <Stack.Screen name="manual-entry" />
              <Stack.Screen name="recall/[id]" />
          </Stack>
      </AuthProvider>
  );
}
