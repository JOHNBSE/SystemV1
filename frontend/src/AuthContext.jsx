import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, csrf, ApiError } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    api('GET', '/user')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async (email, password) => {
    await csrf();
    const res = await api('POST', '/login', { email, password });
    setUser(res.user);
  }, []);

  const register = useCallback(async (payload) => {
    await csrf();
    const res = await api('POST', '/register', payload);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('POST', '/logout');
    } catch {
      /* already logged out server-side — proceed to clear client state anyway */
    }
    setUser(null);
  }, []);

  // Wraps api() so any 401 mid-session (expired cookie) drops back to the login screen.
  const call = useCallback(async (method, path, body) => {
    try {
      return await api(method, path, body);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
      }
      throw e;
    }
  }, []);

  return (
    <AuthCtx.Provider value={{ user, booting, login, register, logout, call }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
