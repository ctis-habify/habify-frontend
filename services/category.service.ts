
import { Category } from '../types/category';
import { api } from './api';



export const categoryService = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get(`/categories`);
    return res.data;
  },

  // Get category by ID
  getCategoryById: async (categoryId: number): Promise<Category> => {
    const res = await api.get(`/categories/${categoryId}`);
    return res.data;
  },

 // Create a new category
  async createCategory(name: string): Promise<Category> {
    const res = await api.post('/categories', { name });
    return res.data;
  },
};
