import 'i18next';
import type ru from './locales/ru';

// Типобезопасные ключи перевода: t('header.logout') проверяется компилятором.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof ru };
  }
}
