import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { currentUserApi, googleLoginApi, loginApi, logoutApi, registerApi, webSocketTokenApi } from '../Service/AuthService';
import { setUnauthorizedHandler } from '../config/AxiosHelper';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setLoading(false);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setUser(await currentUserApi());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    refreshSession();
    return () => setUnauthorizedHandler(null);
  }, [clearSession, refreshSession]);

  const login = useCallback(async (details) => {
    const response = await loginApi(details);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (details) => {
    const response = await registerApi(details);
    setUser(response.user);
    return response.user;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const response = await googleLoginApi(credential);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const getWebSocketToken = useCallback(() => webSocketTokenApi(), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshSession, getWebSocketToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// This hook intentionally shares the context alongside its provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
