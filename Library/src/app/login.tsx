import { Redirect } from 'expo-router';

/** Legacy route — redirects to teacher login */
export default function LoginRedirect() {
  return <Redirect href="/login-teacher" />;
}
