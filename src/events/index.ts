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
import { initEvents } from '@gitcoffee/postbot-events';
import { CONTEXT_MENU_ACTION } from '@gitcoffee/postbot-actions';
import { user } from '@gitcoffee/postbot-api';

const checkLoginAndSend = async (tab: chrome.tabs.Tab | undefined, action: string, extra?: { srcUrl?: string }) => {
  if (!tab?.id) return;
  try {
    const res = await user.isLoginApi({});
    if (res?.data?.login) {
      chrome.tabs.sendMessage(tab.id, { action, ...extra });
    } else {
      chrome.tabs.sendMessage(tab.id, { action: CONTEXT_MENU_ACTION.DO_LOGIN });
    }
  } catch {
    chrome.tabs.sendMessage(tab.id, { action: CONTEXT_MENU_ACTION.DO_LOGIN });
  }
};

export const initPostarEvents = () => {
  initEvents({
    contextMenus: {
      onSyncSelection: (tab) => {
        checkLoginAndSend(tab, CONTEXT_MENU_ACTION.SYNC_SELECTION);
      },
      onSyncImage: (tab, srcUrl) => {
        checkLoginAndSend(tab, CONTEXT_MENU_ACTION.SYNC_IMAGE, { srcUrl });
      },
      onSyncPage: (tab) => {
        checkLoginAndSend(tab, CONTEXT_MENU_ACTION.SYNC_PAGE);
      },
    },
    contextMenuTitles: {
      syncSelection: 'Sync Selection',
      syncImage: 'Sync Image',
      syncPage: 'Sync Page',
    },
    copy: true,
  });
};
