import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './locales/ru';
import tg from './locales/tg';

export const SUPPORTED_LANGUAGES = ['ru', 'tg'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'auditrank.lang';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      tg: { translation: tg },
    },
    fallbackLng: 'ru',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false }, // React сам экранирует разметку
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
