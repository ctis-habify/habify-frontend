
import { Category } from '../types/category';
import { api } from './api';



export const categoryService = {
  // Get all categories (optional type filter)
  async getCategories(type?: 'personal' | 'collaborative', token?: string): Promise<Category[]> {
    const params = type ? { type } : {};
    const config = {
      params,
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {})
    };
    const res = await api.get('/categories', config);
    return res.data;
  },

  // Get category by ID
  async getCategoryById(categoryId: number): Promise<Category> {
    const res = await api.get(`/categories/${categoryId}`);
    return res.data;
  },

  // Create a new category
  async createCategory(
    name: string,
    type: 'personal' | 'collaborative' = 'personal',
    token?: string
  ): Promise<Category> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const res = await api.post('/categories', { name, type }, config);
    return res.data;
  },

  async deleteCategory(categoryId: number, token?: string): Promise<void> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    await api.delete(`/categories/${categoryId}`, config);
  },
};
