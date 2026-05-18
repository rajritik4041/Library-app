import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { useBooksApi } from '@/context/books-api-context';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';

export default function TeacherScreen() {
  const { isTeacher, token, teacher, logout } = useAuth();
  const { refresh } = useBooksApi();
  const router = useRouter();
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [rackNo, setRackNo] = useState('');
  const [copies, setCopies] = useState('1');
  const [department, setDepartment] = useState('MISC');
  const [issueBookId, setIssueBookId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');

  if (!isTeacher || !token) {
    return (
      <ScrollView contentContainerStyle={styles.centered}>
        <PageHeader title="Teacher Panel" subtitle="Login required for book management" />
        <Pressable style={styles.btn} onPress={() => router.push('/login')}>
          <ThemedText style={styles.btnText}>Teacher Login</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  const addBook = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Book title required');
      return;
    }
    try {
      await api.addBook(token, {
        title,
        authors,
        rackNo,
        department,
        copies: Number(copies) || 1,
      });
      setTitle('');
      setAuthors('');
      await refresh();
      Alert.alert('Success', 'Book add ho gayi');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const issueBook = async () => {
    if (!issueBookId.trim() || !studentId.trim()) {
      Alert.alert('Error', 'Book catalog ID aur Student ID required');
      return;
    }
    try {
      await api.issueBook(token, {
        bookId: issueBookId.trim(),
        studentId: studentId.trim(),
        studentName: studentName.trim(),
      });
      setStudentId('');
      setStudentName('');
      await refresh();
      Alert.alert('Success', `Book student ${studentId} ko issue ho gayi`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Issue failed');
    }
  };

  const removeBook = async () => {
    if (!issueBookId.trim()) {
      Alert.alert('Error', 'Book catalog ID daalein (delete ke liye)');
      return;
    }
    Alert.alert('Confirm', 'Book delete karein?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteBook(token, issueBookId.trim());
            await refresh();
            Alert.alert('Deleted', 'Book hata di gayi');
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Delete failed');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <PageHeader
        badge="Teacher"
        title={`Welcome, ${teacher?.name}`}
        subtitle={`ID: ${teacher?.teacherId} · Add / Issue / Remove books`}
      />

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>➕ Add New Book</ThemedText>
        <TextInput
          placeholder="Book title *"
          value={title}
          onChangeText={setTitle}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Authors"
          value={authors}
          onChangeText={setAuthors}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Rack no."
          value={rackNo}
          onChangeText={setRackNo}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Department (e.g. ME)"
          value={department}
          onChangeText={setDepartment}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Copies"
          value={copies}
          onChangeText={setCopies}
          keyboardType="number-pad"
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
        />
        <Pressable style={styles.btn} onPress={addBook}>
          <ThemedText style={styles.btnText}>Add Book</ThemedText>
        </Pressable>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>📤 Issue Book to Student</ThemedText>
        <TextInput
          placeholder="Book catalog ID (e.g. 1, 2 from book detail)"
          value={issueBookId}
          onChangeText={setIssueBookId}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Student ID *"
          value={studentId}
          onChangeText={setStudentId}
          autoCapitalize="characters"
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Student name (optional)"
          value={studentName}
          onChangeText={setStudentName}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
        />
        <Pressable style={styles.btn} onPress={issueBook}>
          <ThemedText style={styles.btnText}>Issue Book</ThemedText>
        </Pressable>
        <Pressable style={styles.btnDanger} onPress={removeBook}>
          <ThemedText style={styles.btnText}>Delete Book by ID</ThemedText>
        </Pressable>
      </View>

      <Pressable style={styles.logout} onPress={logout}>
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 120,
  },
  centered: {
    flexGrow: 1,
    padding: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  card: {
    backgroundColor: LibraryColors.card,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: LibraryColors.border,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: LibraryColors.navy,
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: LibraryColors.border,
    borderRadius: Radius.md,
    padding: Spacing.three,
    fontSize: 15,
    backgroundColor: LibraryColors.surface,
    outlineStyle: 'none',
  } as object,
  btn: {
    backgroundColor: LibraryColors.navy,
    padding: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  btnDanger: {
    backgroundColor: '#b91c1c',
    padding: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },
  logout: { alignItems: 'center', padding: Spacing.three },
  logoutText: { color: LibraryColors.muted, fontWeight: '600' },
});
