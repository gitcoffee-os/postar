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
import { setApiConfig, user, authority } from '@gitcoffee/postbot-api';
import { getPostarBaseUrl, getPostarBaseApi, appId, getDefaultTrustedDomain } from '~/config/config';
import { getTrustedDomains, setTrustedDomains } from '~/stores';

setApiConfig({
  getBaseUrl: getPostarBaseUrl,
  getBaseApi: getPostarBaseApi,
  appId,
});

const intervalTime: number = 1000 * 30;

const initDefaultTrustedDomains = async () => {
  const trustedDomains = await getTrustedDomains();
  if (!trustedDomains) {
    await setTrustedDomains([
      {
        id: crypto.randomUUID(),
        domain: getDefaultTrustedDomain(),
      },
    ]);
  }
};

export const initPostar = async () => {
  initDefaultTrustedDomains();
  await user.isLoginApi({});
  const mediaPlatformList = await authority.platform.listingApi({});
  startPostar(intervalTime);
};

export const startPostar = async (intervalTime: number) => {
  authority.client.updateApi({});
};

export { setApiConfig } from '@gitcoffee/postbot-api';
export { user, authority } from '@gitcoffee/postbot-api';
