import api from './api';
import { Category } from '../types/category';

export const categoryService = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get('/categories');
    return res.data;
  },

  // Get category by ID
  getCategoryById: async (categoryId: number): Promise<Category> => {
    const res = await api.get(`/categories/${categoryId}`);
    return res.data;
  },
};
