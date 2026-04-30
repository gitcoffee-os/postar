/**
 * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
