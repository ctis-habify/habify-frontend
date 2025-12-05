import { Category } from '../types/category';
import { categoryService } from '../services/category.service';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

class CategoriesStore {
  private state: CategoriesState = {
    categories: [],
    isLoading: false,
    error: null,
  };

  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getState(): CategoriesState {
    return { ...this.state };
  }

  async fetchCategories() {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      this.state.categories = await categoryService.getCategories();
      this.state.error = null;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to fetch categories';
      this.state.categories = [];
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  clearCategories() {
    this.state.categories = [];
    this.state.error = null;
    this.notify();
  }
}

export const categoriesStore = new CategoriesStore();

