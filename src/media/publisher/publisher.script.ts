import { publisher as enPublisher } from '@gitcoffee/postbot-publisher-en';

export const publisher = enPublisher;

export const executeScriptsToTabs = (tabs: any, data: any) => {
    tabs?.forEach((item: any) => {
        const { tab, platform } = item;
        if (!tab?.id) {
            return;
        }
        let executed = false;
        const listener = (tabId: number, info: any) => {
            if (tabId === tab.id && info.status === 'complete' && !executed) {
                executed = true;
                chrome.tabs.onUpdated.removeListener(listener);
                if (platform) {
                    const publisherObj = publisher[platform.type]?.[platform.code] || publisher['moment']?.[platform.code] || publisher['article']?.[platform.code];
                    const publisherData = {
                        data: data?.data,
                        platform: platform,
                    };
                    const publishFunc = typeof publisherObj === 'function' ? publisherObj : publisherObj?.publish;
                    if (publishFunc && typeof publishFunc === 'function') {
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            func: publishFunc,
                            args: [publisherData]
                        });
                    } else {
                        console.warn(`No publish function found for platform: ${platform.type}/${platform.code}`);
                    }
                }
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
}
