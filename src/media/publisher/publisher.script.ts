import { publisher as enPublisher } from '@gitcoffee/postbot-publisher-en';

export const publisher = enPublisher;

export const executeScriptsToTabs = (tabs: any, data: any) => {
    tabs?.forEach((item: any) => {
        const { tab, platform } = item;
        if (!tab?.id) {
            return;
        }
        chrome.tabs.onUpdated.addListener(function listener(tabId: number, info: any) {
            if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                if (platform) {
                    platform['executeScript'] = publisher[platform.type]?.[platform.code] || publisher['article']?.[platform.code];
                    const publisherData = {
                        data: data?.data,
                        platform: platform,
                    };
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: platform.executeScript,
                        args: [publisherData]
                    });
                }
            }
        });
    });
}
