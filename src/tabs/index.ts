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
import { createTabsForPlatforms, tabsState } from '@gitcoffee/postbot-tabs';
import { executeScriptsToTabs } from '~/media/publisher/publisher.script';

export { tabsState };

export const createTab = async (url: string) => {
    return await chrome.tabs.create({ url });
}

export const updateTab = async (tabId: number, value: any) => {
    await chrome.tabs.update(tabId, value);
}

export const createTabGroup = async (tabIds: number[]) => {
    return await chrome.tabs.group({ tabIds });
}

export const updateTabGroup = async (tabGroupId: number) => {
    await chrome.tabGroups.update(tabGroupId, {
        color: 'purple',
        title: `Postar Content Sync Assistant`,
    });
}

export const addTabToTabGroup = async (tabIds: number[], groupId: number) => {
    await chrome.tabs.group({ tabIds, groupId });
}

export const createTabsForPlatformsWithScript = (data: any) => {
    return createTabsForPlatforms(data, executeScriptsToTabs, 'Postar Content Sync Assistant');
}
