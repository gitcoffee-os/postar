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
interface PostarConfig {
  baseUrl: string;
  baseApiPath: string;
  publishPath: string;
  defaultTrustedDomain: string;
  coverImageUrl: string;
  defaultAvatarUrl: string;
}

const defaultConfig: PostarConfig = {
  baseUrl: 'https://postar.exmay.com',
  baseApiPath: '/exmay/authority/api',
  publishPath: '/exmay/postbot/media/publish',
  defaultTrustedDomain: 'exmay.com',
  coverImageUrl: 'https://cdn.exmay.com/exmay/exmay-app/static/images/postar_home.png',
  defaultAvatarUrl: 'https://cdn.exmay.com/exmay/exmay-app/static/images/postar_logo.png',
};

const loadConfig = (): PostarConfig => {
  try {
    const envConfig = typeof __POSTAR_CONFIG__ !== 'undefined' ? __POSTAR_CONFIG__ : {};
    return { ...defaultConfig, ...envConfig };
  } catch {
    return defaultConfig;
  }
};

const config = loadConfig();

export const getPostarBaseUrl = () => config.baseUrl;
export const getPostarBaseApi = () => `${config.baseUrl}${config.baseApiPath}`;
export const getPublishPath = () => config.publishPath;
export const getDefaultTrustedDomain = () => config.defaultTrustedDomain;
export const getCoverImageUrl = () => config.coverImageUrl;
export const getDefaultAvatarUrl = () => config.defaultAvatarUrl;

export const appId = 'postar';

declare const __POSTAR_CONFIG__: Partial<PostarConfig>;
