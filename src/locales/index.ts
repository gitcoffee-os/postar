import {
  t as coreT,
  localeManager,
  registerLanguageChangeCallback,
  registerProjectMessages,
  getCurrentLanguage,
  initI18n
} from '@gitcoffee/i18n';
import { App, ref } from 'vue';
import '@gitcoffee/postbot-sidepanel-ui/locales';
import enCommon from './en/common.json';
import enPostar from './en/postar.json';
import zhCommon from './zh/common.json';
import zhPostar from './zh/postar.json';

registerProjectMessages('postar', 'en', {
  common: enCommon,
  postar: enPostar,
});

registerProjectMessages('postar', 'zh', {
  common: zhCommon,
  postar: zhPostar,
});

export const currentLanguage = ref(getCurrentLanguage());

registerLanguageChangeCallback((lang: string) => {
  currentLanguage.value = lang;
});

export const i18nPlugin = {
  install(app: App) {
    (app.config.globalProperties as any).$t = coreT;
    app.provide('$t', coreT);
  },
};

export const useTranslation = () => {
  const currentLanguageRef = currentLanguage;
  const translate = (key: string, params?: any): string => {
    currentLanguageRef.value;
    return coreT(key, params);
  };
  return translate;
};

export const useCurrentLanguage = () => {
  return currentLanguage;
};

export const setupI18n = async (app: App, defaultLanguage?: string) => {
  const i18n = await initI18n();
  app.use(i18n);
  app.use(i18nPlugin);
  if (defaultLanguage) {
    localeManager.setLanguage(defaultLanguage);
  }
};

export { registerLanguageChangeCallback, localeManager };
export * from '@gitcoffee/i18n';
