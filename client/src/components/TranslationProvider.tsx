import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, TranslationContextType, translate, getDefaultLanguage, saveLanguage } from '../lib/i18n';

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [language, setLanguage] = useState<Language>(getDefaultLanguage());

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    saveLanguage(newLanguage);
  };

  const t = (key: string, params?: Record<string, string>) => {
    return translate(key, language, params);
  };

  const value: TranslationContextType = {
    language,
    setLanguage: handleLanguageChange,
    t
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}