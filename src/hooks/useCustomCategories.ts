import { useState, useEffect } from 'react';

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const STORAGE_KEY = 'ishihara-custom-categories';

export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customCategories));
  }, [customCategories]);

  const addCategory = (category: Omit<CustomCategory, 'id'>): CustomCategory => {
    const newCategory: CustomCategory = { ...category, id: `custom-${Date.now()}` };
    setCustomCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<CustomCategory>) => {
    setCustomCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    setCustomCategories(prev => prev.filter(cat => cat.id !== id));
  };

  return { customCategories, addCategory, updateCategory, deleteCategory };
}
