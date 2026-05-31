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
import { h, defineComponent, inject } from 'vue'
import { StyleProvider } from 'ant-design-vue/es/_util/cssinjs'
import { ConfigProvider } from 'ant-design-vue'
import { createModal } from '@gitcoffee/postbot-content-ui'
import PostarFloatButton from './PostarFloatButton'
import { getReaderData } from '~/media/parser'
import { state } from './postar.data';
import { POSTAR_ACTION } from '~/message/postar.action';
import { getPostarBaseUrl, getPublishPath } from '~/config/config';
import { useTranslation } from '~/locales';
import iconUrl from '~/assets/icon.png';

export default defineComponent({
  name: 'PostarModal',
  setup() {
    const shadowRoot = inject<ShadowRoot>('postar-shadow-root');
    const shadowContainer = inject<HTMLElement>('postar-shadow-container');

    const PostarModalInner = createModal({
      state,
      iconUrl,
      assistantLabel: () => useTranslation()('postar:postar.content_sync_assistant'),
      previewLabel: () => useTranslation()('postar:postar.content_preview'),
      syncNowLabel: () => useTranslation()('postar:postar.sync_now'),
      cancelLabel: () => useTranslation()('postar:common.cancel'),
      getBaseUrl: getPostarBaseUrl,
      publishPath: getPublishPath(),
      actionSyncData: POSTAR_ACTION.PUBLISH_SYNC_DATA,
      getReaderData,
      ...(shadowContainer ? { getContainer: () => shadowContainer } : {}),
    });

    const isContextValid = () => {
      try {
        return !!chrome.runtime?.id;
      } catch {
        return false;
      }
    };

    const showContextInvalidTip = () => {
      if (!shadowRoot) return;
      const existing = shadowRoot.querySelector('.postar-update-banner');
      if (existing) return;

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
        .postar-update-banner span { line-height: 1.5; }
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
        .postar-update-reload-btn:hover { background: rgba(255, 255, 255, 0.35); }
        .postar-update-close-btn {
          padding: 2px 8px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
        }
        .postar-update-close-btn:hover { color: #fff; }
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
      banner.querySelector('.postar-update-reload-btn')?.addEventListener('click', () => {
        window.location.reload();
      });
      banner.querySelector('.postar-update-close-btn')?.addEventListener('click', () => {
        banner.remove();
      });
      shadowRoot.appendChild(banner);
    };

    const handleClick = () => {
      if (!isContextValid()) {
        showContextInvalidTip();
        return;
      }
      try {
        chrome.runtime.sendMessage({ type: 'request', action: 'checkLogin' }, (response) => {
          if (chrome.runtime.lastError) {
            window.open(`${getPostarBaseUrl()}${getPublishPath()}`, '_blank');
            return;
          }
          if (response?.isLogin) {
            state.rangType = 'content';
            state.isModalVisible = true;
          } else {
            window.open(`${getPostarBaseUrl()}${getPublishPath()}`, '_blank');
          }
        });
      } catch {
        window.open(`${getPostarBaseUrl()}${getPublishPath()}`, '_blank');
      }
    }

    const getPopupContainer = shadowContainer ? () => shadowContainer : undefined;

    return () =>
      h(StyleProvider, {
        container: shadowRoot,
      }, {
        default: () =>
          h(ConfigProvider, {
            getPopupContainer,
          }, {
            default: () =>
              h('div', {
                style: {
                  width: '100%',
                  height: '100%',
                }
              }, [
                state.showFlowButton ? h(PostarFloatButton, { onClick: handleClick }) : null,
                h(PostarModalInner),
              ])
          })
      })
  }
})
