// utils/storage.ts

export const saveToLocalStorage = <T>(key: string, data: T): boolean => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde dans localStorage (clé: ${key}):`, error);
    return false;
  }
};

export const loadFromLocalStorage = <T>(key: string): T | null => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error(`Erreur lors du chargement depuis localStorage (clé: ${key}):`, error);
    return null;
  }
};