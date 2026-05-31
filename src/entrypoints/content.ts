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
import { debounce as debounceUtils } from '@gitcoffee/postbot-utils';
import { initMessageEventListener } from '@gitcoffee/postbot-content-services';
import { handleMessage } from '~/content/services/message.services';
import { setupI18n } from '~/locales';
import { processContent } from '@gitcoffee/postbot-content-adapter';
import { startMediaSyncMessageListener, stopMediaSyncMessageListener } from '~/utils/media';
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
  main() {
    initMessageEventListener();
    startMediaSyncMessageListener();

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

    document.body.appendChild(host);

    const app = createApp(PostarModal);

    app.provide('postar-shadow-root', shadowRoot);
    app.provide('postar-shadow-container', container);

    setupI18n(app, 'en');

    app.mount(container);

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
      handleMessage(request, sender, sendResponse);
      return true;
    });

    window.addEventListener('unload', () => {
      clearInterval(contextCheckInterval);
      stopMediaSyncMessageListener();
    });
  }
};
