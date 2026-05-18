import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '@/services/api';
import type { AuthRole, StudentSession, TeacherSession } from '@/types/api';

const TOKEN_KEY = 'ej_library_auth_token';
const ROLE_KEY = 'ej_library_auth_role';
const TEACHER_KEY = 'ej_library_teacher';
const STUDENT_KEY = 'ej_library_student';

type AuthContextValue = {
  role: AuthRole | null;
  teacher: TeacherSession | null;
  student: StudentSession | null;
  token: string | null;
  isLoading: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isLoggedIn: boolean;
  loginTeacher: (teacherId: string, password: string) => Promise<void>;
  loginStudent: (userId: string, password: string) => Promise<void>;
  updateStudentSession: (student: StudentSession) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AuthRole | null>(null);
  const [teacher, setTeacher] = useState<TeacherSession | null>(null);
  const [student, setStudent] = useState<StudentSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedRole, savedTeacher, savedStudent] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(ROLE_KEY),
          AsyncStorage.getItem(TEACHER_KEY),
          AsyncStorage.getItem(STUDENT_KEY),
        ]);
        if (savedToken && savedRole === 'teacher' && savedTeacher) {
          setToken(savedToken);
          setRole('teacher');
          setTeacher(JSON.parse(savedTeacher));
        } else if (savedToken && savedRole === 'student' && savedStudent) {
          setToken(savedToken);
          setRole('student');
          setStudent(JSON.parse(savedStudent));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const clearSession = useCallback(async () => {
    setToken(null);
    setRole(null);
    setTeacher(null);
    setStudent(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY, TEACHER_KEY, STUDENT_KEY]);
  }, []);

  const loginTeacher = useCallback(async (teacherId: string, password: string) => {
    const result = await api.loginTeacher(teacherId.trim(), password);
    setToken(result.token);
    setRole('teacher');
    setTeacher(result.teacher);
    setStudent(null);
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    await AsyncStorage.setItem(ROLE_KEY, 'teacher');
    await AsyncStorage.setItem(TEACHER_KEY, JSON.stringify(result.teacher));
    await AsyncStorage.removeItem(STUDENT_KEY);
  }, []);

  const loginStudent = useCallback(async (userId: string, password: string) => {
    const result = await api.loginStudent(userId.trim(), password);
    setToken(result.token);
    setRole('student');
    setStudent(result.student);
    setTeacher(null);
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    await AsyncStorage.setItem(ROLE_KEY, 'student');
    await AsyncStorage.setItem(STUDENT_KEY, JSON.stringify(result.student));
    await AsyncStorage.removeItem(TEACHER_KEY);
  }, []);

  const updateStudentSession = useCallback(async (next: StudentSession) => {
    setStudent(next);
    await AsyncStorage.setItem(STUDENT_KEY, JSON.stringify(next));
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    router.replace('/');
  }, [clearSession]);

  const value = useMemo(
    () => ({
      role,
      teacher,
      student,
      token,
      isLoading,
      isTeacher: role === 'teacher' && Boolean(token),
      isStudent: role === 'student' && Boolean(token),
      isLoggedIn: Boolean(token),
      loginTeacher,
      loginStudent,
      updateStudentSession,
      logout,
    }),
    [role, teacher, student, token, isLoading, loginTeacher, loginStudent, updateStudentSession, logout],
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
