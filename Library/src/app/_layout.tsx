import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/context/auth-context';
import { BooksApiProvider } from '@/context/books-api-context';
import { LibraryColors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <BooksApiProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: LibraryColors.surface },
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login-teacher" options={{ presentation: 'card' }} />
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
        </BooksApiProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
