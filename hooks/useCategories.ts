import { useEffect, useState } from 'react';
import { categoriesStore } from '../store/categories.store';

export const useCategories = () => {
  const [state, setState] = useState(categoriesStore.getState());

  useEffect(() => {
    const unsubscribe = categoriesStore.subscribe(() => {
      setState(categoriesStore.getState());
    });

    return unsubscribe;
  }, []);

  return {
    categories: state.categories,
    isLoading: state.isLoading,
    error: state.error,
    fetchCategories: () => categoriesStore.fetchCategories(),
    clearCategories: () => categoriesStore.clearCategories(),
  };
};

