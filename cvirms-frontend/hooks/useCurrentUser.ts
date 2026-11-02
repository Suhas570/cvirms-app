'use client';

import { useState, useEffect } from 'react';

export interface CurrentUser {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  user_id?: string;
  role?: string;
  member_type?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const readUser = () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('cvirms_user') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            setUser(parsed);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    readUser();
    window.addEventListener('storage', readUser);
    window.addEventListener('user-profile-updated', readUser);
    return () => {
      window.removeEventListener('storage', readUser);
      window.removeEventListener('user-profile-updated', readUser);
    };
  }, []);

  return { user, loading };
}
