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

/**
 * 云端 Web 子域环境（子域名方案，与 postbot / desktop 的 EXMAY_WEB_ENV 对齐）：
 * - prod（默认）: postar.exmay.com（公网生产，终端用户扩展构建用这个）
 * - dev         : postar-dev.exmay.com（开发联调，构建时注入 VITE_EXMAY_WEB_ENV=dev）
 * 必须用同级子域（postar-dev 而非 dev.postar）以命中 `*.exmay.com` 通配符证书。
 * Vite/WXT 编译期静态替换 import.meta.env.VITE_*；运行时无该变量时安全兜底 prod。
 * __POSTAR_CONFIG__ 仍具最高覆盖优先级。
 */
type ExmayWebEnv = 'dev' | 'prod';

const resolveExmayWebEnv = (): ExmayWebEnv => {
  try {
    const env =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_EXMAY_WEB_ENV) ||
      (typeof process !== 'undefined' && process.env?.EXMAY_WEB_ENV);
    return env === 'dev' ? 'dev' : 'prod';
  } catch {
    return 'prod';
  }
};

const exmayWebHost = resolveExmayWebEnv() === 'dev' ? 'postar-dev.exmay.com' : 'postar.exmay.com';

const defaultConfig: PostarConfig = {
  baseUrl: `https://${exmayWebHost}`,
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
