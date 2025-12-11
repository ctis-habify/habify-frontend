import 'axios';
import { Category } from '../types/category';
import api from './api';
const API_URL = 'http://localhost:3000';


export const categoryService = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get(`${API_URL}/categories`);
    return res.data;
  },

  // Get category by ID
  getCategoryById: async (categoryId: number): Promise<Category> => {
    const res = await api.get(`/categories/${categoryId}`);
    return res.data;
  },
};
