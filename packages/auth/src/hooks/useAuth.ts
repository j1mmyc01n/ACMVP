import { useState, useEffect } from 'react';
import type { UserRole } from '@acmvp/types';
import { getSession, signOut, onAuthChange } from '../session';

interface AuthState {
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    userId: null,
    email: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    getSession().then((session) => {
      setState({
        userId: session?.userId ?? null,
        email: session?.email ?? null,
        role: session?.role ?? null,
        loading: false,
      });
    });

    const { data: listener } = onAuthChange((_event, session) => {
      setState({
        userId: session?.userId ?? null,
        email: session?.email ?? null,
        role: session?.role ?? null,
        loading: false,
      });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return {
    ...state,
    signOut,
    isAuthenticated: state.userId !== null,
  };
}
