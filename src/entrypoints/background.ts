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
import { initPostar } from '~/api';
import { initPostarEvents } from '../events';
import { initPlugins } from '../plugins';
import { handleMessage } from '../background';
import { initCdpBackground } from '../background/cdp.background';
import { initAdapterBackground } from '../background/adapter.background';
import { createBackgroundListener } from '@gitcoffee-os/postbot-background';
import { getPostarBaseUrl, getPublishPath } from '~/config/config';
import { bridgeProfile } from '~/message/bridge.profile';

const backgroundMain = () => {
  console.log('Postar background script loaded');

  initPostar();
  initPlugins();
  initPostarEvents();

  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: `${getPostarBaseUrl()}${getPublishPath()}` });
  });

  // 供内容脚本读取页面主世界的发布器调试配置注册表
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type !== 'GET_RUNTIME_DEBUG_CONFIGS') {
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        sendResponse({});
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: () => {
            const key = '__postbotPublisherDebugRegistry__';
            const w = window as unknown as Record<string, any>;
            const registry = w[key];
            return registry ? JSON.parse(JSON.stringify(registry)) : {};
          },
          world: 'MAIN',
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.warn('[Postar Background] fetch runtime debug configs failed:', chrome.runtime.lastError.message);
            sendResponse({});
            return;
          }
          sendResponse((results?.[0]?.result as Record<string, any>) || {});
        }
      );
    });
    return true;
  });

  chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
          chrome.tabs.sendMessage(tab.id, { type: 'POSTAR_RELOAD' }).catch(() => {});
        }
      });
    });
  });

  createBackgroundListener(handleMessage, bridgeProfile);

  // CDP 上传/点击（chrome.debugger，需 manifest debugger 权限）
  initCdpBackground();

  // AI 自适应修复后台模块（同步中心 / 诊断 / 补丁决策）
  initAdapterBackground().catch((error) => {
    console.error('[AiAdapter] 后台自适应模块初始化失败:', error);
  });
};

export default {
  main() {
    backgroundMain();
  }
};
