import { useEffect, useState } from 'react';
import { userStore } from '../store/user.store';
import { User } from '../types/user';

export const useUser = () => {
  const [state, setState] = useState(userStore.getState());

  useEffect(() => {
    const unsubscribe = userStore.subscribe(() => {
      setState(userStore.getState());
    });

    return unsubscribe;
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    fetchCurrentUser: () => userStore.fetchCurrentUser(),
    updateUser: (data: Parameters<typeof userStore.updateUser>[0]) =>
      userStore.updateUser(data),
    setUser: (user: User | null) => userStore.setUser(user),
    clearUser: () => userStore.clearUser(),
  };
};

