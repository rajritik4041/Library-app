import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '@/services/api';
import type { AuthRole, DeanSession, StudentSession, TeacherSession } from '@/types/api';

const TOKEN_KEY = 'ej_library_auth_token';
const ROLE_KEY = 'ej_library_auth_role';
const TEACHER_KEY = 'ej_library_teacher';
const DEAN_KEY = 'ej_library_dean';
const STUDENT_KEY = 'ej_library_student';

type AuthContextValue = {
  role: AuthRole | null;
  teacher: TeacherSession | null;
  dean: DeanSession | null;
  student: StudentSession | null;
  token: string | null;
  isLoading: boolean;
  isTeacher: boolean;
  isDean: boolean;
  isStaff: boolean;
  isStudent: boolean;
  isLoggedIn: boolean;
  loginTeacher: (teacherId: string, password: string) => Promise<void>;
  loginDean: (deanId: string, password: string) => Promise<void>;
  loginStudent: (userId: string, password: string) => Promise<void>;
  signupStudent: (body: Parameters<typeof api.signupStudent>[0]) => Promise<{
    success: boolean;
    message: string;
    token: string;
    student: StudentSession;
  }>;
  updateStudentSession: (student: StudentSession) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AuthRole | null>(null);
  const [teacher, setTeacher] = useState<TeacherSession | null>(null);
  const [dean, setDean] = useState<DeanSession | null>(null);
  const [student, setStudent] = useState<StudentSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedRole, savedTeacher, savedDean, savedStudent] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(ROLE_KEY),
          AsyncStorage.getItem(TEACHER_KEY),
          AsyncStorage.getItem(DEAN_KEY),
          AsyncStorage.getItem(STUDENT_KEY),
        ]);
        if (savedToken && savedRole === 'teacher' && savedTeacher) {
          setToken(savedToken);
          setRole('teacher');
          setTeacher(JSON.parse(savedTeacher));
        } else if (savedToken && savedRole === 'dean' && savedDean) {
          setToken(savedToken);
          setRole('dean');
          setDean(JSON.parse(savedDean));
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
    setDean(null);
    setStudent(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY, TEACHER_KEY, DEAN_KEY, STUDENT_KEY]);
  }, []);

  const loginTeacher = useCallback(async (teacherId: string, password: string) => {
    const result = await api.loginTeacher(teacherId.trim(), password);
    setToken(result.token);
    setRole('teacher');
    setTeacher(result.teacher);
    setDean(null);
    setStudent(null);
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    await AsyncStorage.setItem(ROLE_KEY, 'teacher');
    await AsyncStorage.setItem(TEACHER_KEY, JSON.stringify(result.teacher));
    await AsyncStorage.multiRemove([DEAN_KEY, STUDENT_KEY]);
  }, []);

  const loginDean = useCallback(async (deanId: string, password: string) => {
    const result = await api.loginDean(deanId.trim(), password);
    setToken(result.token);
    setRole('dean');
    setDean(result.dean);
    setTeacher(null);
    setStudent(null);
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    await AsyncStorage.setItem(ROLE_KEY, 'dean');
    await AsyncStorage.setItem(DEAN_KEY, JSON.stringify(result.dean));
    await AsyncStorage.multiRemove([TEACHER_KEY, STUDENT_KEY]);
  }, []);

  const loginStudent = useCallback(async (userId: string, password: string) => {
    const result = await api.loginStudent(userId.trim(), password);
    setToken(result.token);
    setRole('student');
    setStudent(result.student);
    setTeacher(null);
    setDean(null);
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    await AsyncStorage.setItem(ROLE_KEY, 'student');
    await AsyncStorage.setItem(STUDENT_KEY, JSON.stringify(result.student));
    await AsyncStorage.multiRemove([TEACHER_KEY, DEAN_KEY]);
  }, []);

  const signupStudent = useCallback(
    async (body: Parameters<typeof api.signupStudent>[0]) => {
      const result = await api.signupStudent(body);
      setToken(result.token);
      setRole('student');
      setStudent(result.student);
      setTeacher(null);
      setDean(null);
      await AsyncStorage.setItem(TOKEN_KEY, result.token);
      await AsyncStorage.setItem(ROLE_KEY, 'student');
      await AsyncStorage.setItem(STUDENT_KEY, JSON.stringify(result.student));
      await AsyncStorage.multiRemove([TEACHER_KEY, DEAN_KEY]);
      return result;
    },
    [],
  );

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
      dean,
      student,
      token,
      isLoading,
      isTeacher: role === 'teacher' && Boolean(token),
      isDean: role === 'dean' && Boolean(token),
      isStaff: (role === 'teacher' || role === 'dean') && Boolean(token),
      isStudent: role === 'student' && Boolean(token),
      isLoggedIn: Boolean(token),
      loginTeacher,
      loginDean,
      loginStudent,
      signupStudent,
      updateStudentSession,
      logout,
    }),
    [
      role,
      teacher,
      dean,
      student,
      token,
      isLoading,
      loginTeacher,
      loginDean,
      loginStudent,
      signupStudent,
      updateStudentSession,
      logout,
    ],
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
