import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/context/auth-context';
import { BooksApiProvider } from '@/context/books-api-context';
import { LibraryProvider } from '@/context/library-context';
import { LibraryColors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <BooksApiProvider>
          <LibraryProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: LibraryColors.surface },
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" options={{ presentation: 'modal' }} />
              <Stack.Screen
                name="book/[id]"
                options={{ presentation: 'card', animation: 'slide_from_right' }}
              />
            </Stack>
          </LibraryProvider>
        </BooksApiProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
