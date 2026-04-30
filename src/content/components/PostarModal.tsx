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
import { h, defineComponent } from 'vue'
import { createModal } from '@gitcoffee/postbot-content-ui'
import PostarFloatButton from './PostarFloatButton'
import { getReaderData } from '~/media/parser'
import { state } from './postar.data';
import { POSTAR_ACTION } from '~/message/postar.action';
import { getPostarBaseUrl, getPublishPath } from '~/config/config';
import iconUrl from '~/assets/icon.png';

const PostarModalInner = createModal({
  state,
  iconUrl,
  assistantLabel: 'Postar Content Sync Assistant',
  previewLabel: 'Content Preview',
  syncNowLabel: 'Sync Now',
  cancelLabel: 'Cancel',
  getBaseUrl: getPostarBaseUrl,
  publishPath: getPublishPath(),
  actionSyncData: POSTAR_ACTION.PUBLISH_SYNC_DATA,
  getReaderData,
});

export default defineComponent({
  name: 'PostarModal',
  setup() {
    const handleClick = () => {
      chrome.runtime.sendMessage({ type: 'request', action: 'checkLogin' }, (response) => {
        if (response?.isLogin) {
          state.rangType = 'content';
          state.isModalVisible = true;
        } else {
          window.open(`${getPostarBaseUrl()}${getPublishPath()}`, '_blank');
        }
      });
    }

    return () =>
      h('div', {
        style: {
          width: '100%',
          height: '100%',
        }
      }, [
        state.showFlowButton ? h(PostarFloatButton, { onClick: handleClick }) : null,
        h(PostarModalInner),
      ])
  }
})
