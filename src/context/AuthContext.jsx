import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setApiToken } from '../api/client';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.token) {
        setApiToken(res.data.token);
      }
      setStudent(res.data.student);
    } catch {
      setApiToken(null);
      setStudent(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (!active) return;
        if (res.data.token) {
          setApiToken(res.data.token);
        }
        setStudent(res.data.student);
      } catch {
        if (!active) return;
        setApiToken(null);
        setStudent(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    });
    setApiToken(res.data.token);
    setStudent(res.data.student);
    return res.data.student;
  }, []);

  const register = useCallback(async (payload) => {
    await api.post('/auth/register', payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setApiToken(null);
      setStudent(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        student,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        setStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
