
import { Category } from '../types/category';
import { api } from './api';

type RawCategory = Partial<{
  categoryId: number | string;
  id: number | string;
  name: string;
  categoryName: string;
  title: string;
}>;

const toCategory = (input: unknown): Category | null => {
  if (!input || typeof input !== 'object') return null;
  const raw = input as RawCategory;

  const rawId = raw.categoryId ?? raw.id;
  const id = Number(rawId);
  const name = (raw.name ?? raw.categoryName ?? raw.title ?? '').toString().trim();

  if (!Number.isFinite(id) || !name) return null;
  return { categoryId: id, name };
};

const unwrapCategoryList = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  const data = obj.data;

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;
    if (Array.isArray(dataObj.categories)) return dataObj.categories;
    if (Array.isArray(dataObj.items)) return dataObj.items;
  }

  if (Array.isArray(obj.categories)) return obj.categories;
  if (Array.isArray(obj.items)) return obj.items;
  return [];
};

const unwrapSingleCategory = (payload: unknown): unknown => {
  if (!payload || typeof payload !== 'object') return payload;
  const obj = payload as Record<string, unknown>;
  return obj.data ?? obj.category ?? payload;
};

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
    const category = toCategory(unwrapSingleCategory(res.data));
    if (!category) {
      throw new Error('Invalid category response');
    }
    return category;
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
