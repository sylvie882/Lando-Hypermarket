// components/auth/AuthSync.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export default function AuthSync() {
  const { isAuthenticated, token, user, syncAuthToCookies } = useAuth();

  useEffect(() => {
    // Sync auth to cookies on every page load if authenticated
    if (isAuthenticated && token && user) {
      syncAuthToCookies(token, user);
    }
  }, [isAuthenticated, token, user, syncAuthToCookies]);

  return null; // This component doesn't render anything
}