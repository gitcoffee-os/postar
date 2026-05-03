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
import { handleMessage } from '~/content/messageHandler';
import { setupI18n } from '~/locales';
import { processContent } from '@gitcoffee/postbot-content-adapter';
import antDesignCss from 'ant-design-vue/dist/reset.css?inline';
import globalCss from '~/styles/global.css?inline';

export default {
  matches: ['<all_urls>'],
  main() {
    initMessageEventListener();

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

    setupI18n(app);

    app.mount(container);

    window.addEventListener('load', () => {
      const data = getReaderData();
      const { content, contentImages } = data;

      chrome.runtime.sendMessage({
        type: 'IMAGE_DETECTED',
        contentImages: Array.from(contentImages).map((img: any) => ({ src: img.src })),
      });

      chrome.runtime.sendMessage({
        type: 'CONTENT_DETECTED',
        content: content,
      });
    });

    const handleSelectionChange = debounceUtils.debounce(() => {
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

      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'SELECTION_DATA',
          ...selectionData,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          hasSelection: hasSelection,
        });
      }
    }, 300);

    document.addEventListener('selectionchange', () => {
      handleSelectionChange();
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      handleMessage(request, sender, sendResponse);
      return true;
    });
  }
};
