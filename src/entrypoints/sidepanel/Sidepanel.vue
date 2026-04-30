<!--
  Copyright (c) 2025-2099 GitCoffee All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->
<template>
    <ConfigProvider :theme="themeConfig">
      <TabsManage
        app-name="Postar"
        :icon-url="iconUrl"
        :cover-image-url="getCoverImageUrl()"
        :default-avatar-url="getDefaultAvatarUrl()"
        :publish-url="publishUrl"
        :fetch-user-info="fetchUserInfo"
        :fetch-task-list="fetchTaskList"
        :download-images="downloadImages"
        :sync-images="syncImages"
        :on-explore-version-change="onExploreVersionChange"
      />
    </ConfigProvider>
</template>

<script lang="ts" setup>
import { ConfigProvider } from 'ant-design-vue';
import { TabsManage } from '@gitcoffee/postbot-sidepanel-ui';
import '~/locales';
import iconUrl from '~/assets/icon.png';
import { getPostarBaseUrl, getPublishPath, getCoverImageUrl, getDefaultAvatarUrl } from '~/config/config';
import { saveExploreVersionSetting } from '~/config/setting';
import { user, authority } from '@gitcoffee/postbot-api';
import { handleSyncContentImages, handleSyncSelectionImages } from '~/media/handler';

const themeConfig = {
  token: {
    colorPrimary: '#bd34fe',
    colorLink: '#bd34fe',
    colorInfo: '#bd34fe',
  },
};

const publishUrl = `${getPostarBaseUrl()}${getPublishPath()}`;

const fetchUserInfo = () => user.userInfoApi();

const fetchTaskList = (pageNo: number) => authority.task.listApi({ pageNo });

const downloadImages = (images: { src: string }[], _type: 'content' | 'selection') => {
  images.forEach((img) => {
    chrome.downloads.download({ url: img.src });
  });
};

const syncImages = async (images: { src: string }[], type: 'content' | 'selection') => {
  if (type === 'content') {
    await handleSyncContentImages(images);
  } else {
    await handleSyncSelectionImages(images);
  }
};

const onExploreVersionChange = (enabled: boolean) => {
  saveExploreVersionSetting(enabled);
};
</script>
