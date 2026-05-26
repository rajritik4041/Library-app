import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppDialogHost } from '@/components/ui/app-dialog-host';
import { AuthProvider } from '@/context/auth-context';
import { BooksApiProvider } from '@/context/books-api-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLibraryColors } from '@/hooks/use-library-colors';

function RootStack() {
  const colorScheme = useColorScheme();
  const palette = useLibraryColors();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.surface },
        }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login-teacher" options={{ presentation: 'card' }} />
              <Stack.Screen name="login-dean" options={{ presentation: 'card' }} />
              <Stack.Screen name="login-student" options={{ presentation: 'card' }} />
              <Stack.Screen name="login" options={{ presentation: 'card' }} />
              <Stack.Screen name="edit-student" options={{ presentation: 'card' }} />
              <Stack.Screen name="student/register" options={{ presentation: 'card' }} />
              <Stack.Screen name="student/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="student-profile" options={{ presentation: 'card' }} />
              <Stack.Screen
                name="book/[id]"
                options={{ presentation: 'card', animation: 'slide_from_right' }}
              />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <AuthProvider>
        <BooksApiProvider>
          <RootStack />
          <AppDialogHost />
        </BooksApiProvider>
      </AuthProvider>
    </ThemePreferenceProvider>
  );
}
