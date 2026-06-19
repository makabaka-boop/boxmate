import type { PropBox } from '@/types';

const STORAGE_KEY = 'prop-box-checklist-data';

export const saveToLocalStorage = (boxes: PropBox[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boxes));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const loadFromLocalStorage = (): PropBox[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    return null;
  }
};

export const clearLocalStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
