

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define the shape of the context
interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Define the provider component
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      return localStorage.getItem('writeweave_lang') || navigator.language.split('-')[0] || 'fr';
    } catch {
      return 'fr';
    }
  });
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load translation file for the current language
    const fetchTranslations = async () => {
      setIsLoaded(false);
      try {
        const response = await fetch(`/locales/${language}.json`);
        if (!response.ok) {
          throw new Error(`Could not load translations for ${language}`);
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error(error);
        if (language !== 'fr') {
          console.warn('Fallback to French language');
          setLanguage('fr');
        }
      } finally {
        setIsLoaded(true);
      }
    };
    fetchTranslations();
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('writeweave_lang', lang);
    } catch (e) {
      console.warn('Could not save language to localStorage');
    }
  };

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    if (!isLoaded) return key; // Return key if translations are not loaded yet

    let translation = key.split('.').reduce((acc, currentKey) => {
      return acc && typeof acc === 'object' && acc[currentKey] !== undefined ? acc[currentKey] : null;
    }, translations);

    if (translation === null || typeof translation !== 'string') {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = (translation as string).replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }

    return translation as string;
  }, [translations, isLoaded]);

  const value = { language, setLanguage, t };

  if (!isLoaded) {
    // Render a basic loader or null while translations are loading
    return null;
  }

  return React.createElement(I18nContext.Provider, { value: value }, children);
};

// Custom hook to use the context
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
