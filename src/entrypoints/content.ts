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
import { createApp } from 'vue';
import PostarModal from '~/content/components/PostarModal';
import { getReaderData } from '~/media/parser';
import { debounce as debounceUtils } from '@gitcoffee-os/postbot-utils';
import { initMessageEventListener } from '@gitcoffee-os/postbot-content-services';
import { BRIDGE_PROTOCOL_VERSION } from '@gitcoffee-os/postbot-content-services';
import { bridgeProfile } from '~/message/bridge.profile';
import { handleMessage } from '~/content/services/message.services';
import { POSTAR_ACTION } from '~/message/postar.action';
import { setupI18n } from '~/locales';
import { processContent } from '@gitcoffee-os/postbot-content-adapter';
import { startMediaSyncMessageListener, stopMediaSyncMessageListener } from '~/utils/media';
import { setupDebugger } from '~/content/debugger';
import { initAdapterService } from '~/content/services/adapter.service';
import antDesignCss from 'ant-design-vue/dist/reset.css?inline';
import globalCss from '~/styles/global.css?inline';

const isContextValid = () => {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
};

const safeSendMessage = (message: any): void => {
  if (!isContextValid()) return;
  try {
    chrome.runtime.sendMessage(message);
  } catch {
  }
};

let updateBannerShown = false;

const showUpdateBanner = (shadowRoot: ShadowRoot) => {
  if (updateBannerShown) return;
  updateBannerShown = true;

  const bannerStyle = document.createElement('style');
  bannerStyle.textContent = `
    .postar-update-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea 0%, #bd34fe 100%);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      animation: postar-banner-slide 0.3s ease-out;
    }
    .postar-update-banner span {
      line-height: 1.5;
    }
    .postar-update-reload-btn {
      padding: 4px 16px;
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }
    .postar-update-reload-btn:hover {
      background: rgba(255, 255, 255, 0.35);
    }
    .postar-update-close-btn {
      padding: 2px 8px;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      font-size: 18px;
      cursor: pointer;
      line-height: 1;
    }
    .postar-update-close-btn:hover {
      color: #fff;
    }
    @keyframes postar-banner-slide {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  shadowRoot.appendChild(bannerStyle);

  const banner = document.createElement('div');
  banner.className = 'postar-update-banner';
  banner.innerHTML = `
    <span>Postar has been updated, please refresh the page to continue using it.</span>
    <button class="postar-update-reload-btn">Refresh</button>
    <button class="postar-update-close-btn">&times;</button>
  `;

  const reloadBtn = banner.querySelector('.postar-update-reload-btn');
  const closeBtn = banner.querySelector('.postar-update-close-btn');

  reloadBtn?.addEventListener('click', () => {
    window.location.reload();
  });

  closeBtn?.addEventListener('click', () => {
    banner.remove();
  });

  shadowRoot.appendChild(banner);
};

export default {
  matches: ['<all_urls>'],
  // 兄弟 App 站点不注入：不挂浮窗、不监听页面消息（channel/origin 闸是第二层）
  excludeMatches: ['*://postbot.exmay.com/*', '*://postbot-dev.exmay.com/*'],
  main() {
    initMessageEventListener(bridgeProfile);
    startMediaSyncMessageListener(bridgeProfile);
    setupDebugger();

    // AI 自适应修复模块：观测当前页面发布表单健康度，平台改版自动修复
    void initAdapterService();

    const host = document.createElement('div');
    host.id = 'postar-host';
    host.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; overflow: visible; z-index: 2147483647;';

    const shadowRoot = host.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = antDesignCss + '\n' + globalCss;
    shadowRoot.appendChild(styleEl);

    const container = document.createElement('div');
    container.id = 'postar-container';
    shadowRoot.appendChild(container);

    const initApp = () => {
      if (!document.body.contains(host)) {
        document.body.appendChild(host);
      }

      const app = createApp(PostarModal);

      app.provide('postar-shadow-root', shadowRoot);
      app.provide('postar-shadow-container', container);

      setupI18n(app, 'en');

      app.mount(container);
    };

    if (document.readyState === 'complete') {
      initApp();
    } else {
      window.addEventListener('load', initApp, { once: true });
    }

    const contextCheckInterval = setInterval(() => {
      if (!isContextValid()) {
        clearInterval(contextCheckInterval);
        stopMediaSyncMessageListener();
        showUpdateBanner(shadowRoot);
      }
    }, 3000);

    window.addEventListener('load', () => {
      const data = getReaderData();
      const { content, contentImages } = data;

      safeSendMessage({
        type: 'IMAGE_DETECTED',
        contentImages: Array.from(contentImages).map((img: any) => ({ src: img.src })),
      });

      safeSendMessage({
        type: 'CONTENT_DETECTED',
        content: content,
      });
    });

    const handleSelectionChange = debounceUtils.debounce(() => {
      if (!isContextValid()) return;

      const selection = window.getSelection();

      const hasSelection = selection && selection.rangeCount > 0 && selection.toString().trim().length > 0;

      const selectionData: { selectionContent: string; selectionImages: { src: string }[] } = {
        selectionContent: '',
        selectionImages: [],
      };

      if (hasSelection) {
        try {
          const range = selection!.getRangeAt(0);
          const selectedHTML = range.cloneContents();
          const serializer = new XMLSerializer();
          const htmlContent = serializer.serializeToString(selectedHTML);
          const processedHtml = processContent(htmlContent);

          selectionData.selectionContent = processedHtml;

          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = processedHtml;
          const imgElements = tempDiv.querySelectorAll('img');
          const selectedImages = Array.from(imgElements)
            .filter((img) => img.src && !img.src.startsWith('chrome-extension://'))
            .map((img) => ({ src: img.src }));
          selectionData.selectionImages = selectedImages;
        } catch (error) {
          console.error('Error with range operations:', error);
        }
      }

      safeSendMessage({
        type: 'SELECTION_DATA',
        ...selectionData,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        hasSelection: hasSelection,
      });
    }, 300);

    document.addEventListener('selectionchange', () => {
      handleSelectionChange();
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!isContextValid()) return false;
      if (request?.type === 'POSTAR_RELOAD') {
        clearInterval(contextCheckInterval);
        stopMediaSyncMessageListener();
        showUpdateBanner(shadowRoot);
        return true;
      }
      // 自动发布终态中继（M3 路径 D）：background 汇总各平台结果 → 本 content script → 发布页 window.postMessage。
      // 页面侧由桌面注入的监听脚本捕获，经 renderer 上报 engine（桌面 WebContentsView 无 preload，只能走页面消息）。
      if (request?.action === POSTAR_ACTION.AUTOPUBLISH_RESULT) {
        try {
          relayAutopublishResult(request.data, request.traceId);
          sendResponse({ ok: true });
        } catch (err) {
          console.warn('[Postar] AUTOPUBLISH_RESULT 中继失败:', err);
          sendResponse({ ok: false });
        }
        return true;
      }
      handleMessage(request, sender, sendResponse);
      return true;
    });

    window.addEventListener('beforeunload', () => {
      clearInterval(contextCheckInterval);
      stopMediaSyncMessageListener();
    });

    // ===== 自动发布终态存储桥（路径 D 关键通道）=====
    // background 交付终态时写入 chrome.storage.local；本 content script 经 onChanged
    // 中继回发布页 window。Electron 下 WebContentsView 非真实 chrome.tabs.Tab，
    // tabs.sendMessage/query 不可达，此通道为唯一可靠回传路径（Chrome 中与 tabs 通道并存）。
    const AUTOPUBLISH_LATEST_KEY = 'autopublish-result:latest';
    /** 启动补偿只中继近期结果，避免页面重载时回放陈旧终态（页面侧按 jobId 过滤，双保险） */
    const STALE_RESULT_WINDOW_MS = 10 * 60 * 1000;

    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;
        const change = changes[AUTOPUBLISH_LATEST_KEY];
        if (change?.newValue) {
          relayAutopublishResult(change.newValue);
        }
      });

      // 启动补偿：content script 注入晚于终态落库时（如页面加载慢），补中继一次
      chrome.storage.local.get(AUTOPUBLISH_LATEST_KEY, (items) => {
        const latest = items?.[AUTOPUBLISH_LATEST_KEY] as { deliveredAt?: number } | undefined;
        if (latest && typeof latest.deliveredAt === 'number' && Date.now() - latest.deliveredAt < STALE_RESULT_WINDOW_MS) {
          relayAutopublishResult(latest);
        }
      });
    } catch (err) {
      console.warn('[Postar] AUTOPUBLISH_RESULT 存储桥初始化失败:', err);
    }
  }
};

// AUTOPUBLISH_RESULT 统一中继：tabs 消息与存储桥共用，回传发布页 window
const relayAutopublishResult = (result: unknown, traceId?: string): void => {
  try {
    window.postMessage({
      type: 'response',
      protocolVersion: BRIDGE_PROTOCOL_VERSION,
      channel: bridgeProfile.channel,
      traceId,
      action: POSTAR_ACTION.AUTOPUBLISH_RESULT,
      code: 0,
      message: 'success',
      data: result,
    }, '*');
  } catch (err) {
    console.warn('[Postar] AUTOPUBLISH_RESULT 存储桥中继失败:', err);
  }
};
