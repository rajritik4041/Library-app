import { Redirect, useLocalSearchParams } from 'expo-router';

/** Redirect old /student/[id] URLs to flat edit-student route */
export default function StudentIdRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const key = Array.isArray(id) ? id[0] : id;
  if (!key || key === 'register') {
    return <Redirect href="/student/register" />;
  }
  return <Redirect href={{ pathname: '/edit-student', params: { key } }} />;
}
