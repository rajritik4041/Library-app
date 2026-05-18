import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '@/services/api';
import type { TeacherSession } from '@/types/api';

const TOKEN_KEY = 'ej_library_teacher_token';
const TEACHER_KEY = 'ej_library_teacher';

type AuthContextValue = {
  teacher: TeacherSession | null;
  token: string | null;
  isLoading: boolean;
  isTeacher: boolean;
  login: (teacherId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [teacher, setTeacher] = useState<TeacherSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedTeacher] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(TEACHER_KEY),
        ]);
        if (savedToken && savedTeacher) {
          setToken(savedToken);
          setTeacher(JSON.parse(savedTeacher));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (teacherId: string, password: string) => {
    const result = await api.loginTeacher(teacherId.trim(), password);
    setToken(result.token);
    setTeacher(result.teacher);
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    await AsyncStorage.setItem(TEACHER_KEY, JSON.stringify(result.teacher));
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setTeacher(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, TEACHER_KEY]);
  }, []);

  const value = useMemo(
    () => ({
      teacher,
      token,
      isLoading,
      isTeacher: Boolean(token),
      login,
      logout,
    }),
    [teacher, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
