'use client';

import { useStore } from '@/lib/store';
import LoginScreen from '@/components/LoginScreen';
import AppShell from '@/components/AppShell';

export default function HomePage() {
  const { ready, authUser } = useStore();
  if (!ready) return null;
  return authUser ? <AppShell /> : <LoginScreen />;
}
