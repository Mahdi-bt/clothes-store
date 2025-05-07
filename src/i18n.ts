import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import translationAR from './locales/ar/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  },
  ar: {
    translation: translationAR
  }
};

// Function to set document direction
const setDocumentDirection = (lng: string) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })
  .then(() => {
    // Set initial direction based on detected language
    setDocumentDirection(i18n.language);
  });

// Add event listener for language changes
i18n.on('languageChanged', (lng) => {
  setDocumentDirection(lng);
});

export default i18n; 