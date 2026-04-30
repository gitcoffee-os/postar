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
