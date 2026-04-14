const CATEGORY_ACCENT_PALETTE = [
  '#f97316',
  '#3b82f6',
  '#10b981',
  '#e879f9',
  '#f43f5e',
  '#14b8a6',
  '#8b5cf6',
  '#84cc16',
] as const;

const normalizeCategoryKey = (name?: string | null, id?: number | null): string => {
  if (name && name.trim()) {
    return name.trim().toLowerCase();
  }
  if (typeof id === 'number' && Number.isFinite(id)) {
    return `category-${id}`;
  }
  return 'default-category';
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getCategoryAccentColor = (name?: string | null, id?: number | null): string => {
  const key = normalizeCategoryKey(name, id);
  const index = hashString(key) % CATEGORY_ACCENT_PALETTE.length;
  return CATEGORY_ACCENT_PALETTE[index];
};
