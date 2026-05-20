'use client';

import { useStore } from '@/lib/store';
import LoginScreen from '@/components/LoginScreen';
import AppShell from '@/components/AppShell';

export default function HomePage() {
  const { authUser } = useStore();
  return authUser ? <AppShell /> : <LoginScreen />;
}
