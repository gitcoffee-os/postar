import { publish, getSupportedPlatforms } from '@gitcoffee/postbot-media';
import { createTabsForPlatforms } from '@gitcoffee/postbot-tabs';
import { getMetaInfoList } from '../meta';

export { publish, getSupportedPlatforms };

export const getPlatformMetaInfoList = () => {
  return getMetaInfoList();
};

export const windowPublish = (data: any) => {
    if (!data?.platforms) {
        return;
    }
    if (data?.platforms.length === 0) {
        return;
    }
    createTabsForPlatforms(data, (tabs, data) => {
        console.log('Postar: publishing to tabs', tabs.length);
    }, 'Postar');
}
