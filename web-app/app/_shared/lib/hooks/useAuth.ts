'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { login, logout, setToken } from '@/app/_shared/lib/store/slices/authSlice';
import { setUser, clearUser } from '@/app/_shared/lib/store/slices/userSlice';
import { setCookie, removeCookie } from '@/app/_shared/lib/utils/storage';
import { persistor } from '@/app/_shared/lib/store/store';

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const user = useAppSelector((state) => state.user.user);

  const handleLogin = useCallback(
    async (token: string, refreshToken: string, userData: { id: string; email: string; firstName: string }) => {
      setCookie('token', token);
      setCookie('refreshToken', refreshToken);
      dispatch(login({ token, refreshToken }));
      dispatch(setUser(userData));
    },
    [dispatch]
  );

  const handleLogout = useCallback(() => {
    removeCookie('token');
    removeCookie('refreshToken');
    dispatch(logout());
    dispatch(clearUser());
    persistor.purge();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  }, [dispatch]);

  const updateToken = useCallback(
    (newToken: string) => {
      setCookie('token', newToken);
      dispatch(setToken(newToken));
    },
    [dispatch]
  );

  return {
    isLoggedIn: auth.isLoggedIn,
    token: auth.token,
    user,
    login: handleLogin,
    logout: handleLogout,
    updateToken,
  };
}
