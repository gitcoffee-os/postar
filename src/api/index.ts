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
