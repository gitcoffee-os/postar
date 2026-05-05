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
import { ensureI18n } from '~/locales';
import iconUrl from '~/assets/icon.png';
import { getPostarBaseUrl, getPublishPath, getCoverImageUrl, getDefaultAvatarUrl } from '~/config/config';
import { saveExploreVersionSetting } from '~/config/setting';
import { user, authority } from '@gitcoffee/postbot-api';
import { syncContentImages, syncSelectionImages } from '~/utils/media';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';

ensureI18n('en');

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

const extractFilenameFromUrl = (url: string, defaultName: string) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    const cleanFilename = filename.split('?')[0];
    if (cleanFilename && cleanFilename.includes('.')) {
      return cleanFilename;
    }
    return `${defaultName}.jpg`;
  } catch (e) {
    return `${defaultName}.jpg`;
  }
};

const getFileExtension = (filename: string) => {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
};

const fetchImageAsBlob = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
};

const downloadImagesAsZip = async (images: { src: string }[], zipName: string) => {
  if (!images || images.length === 0) {
    message.warning('No images to download');
    return;
  }

  const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss');
  const timestampedZipName = `${zipName}_${timestamp}`;
  const loadingMessage = message.loading('Packing images, please wait...', 0);

  try {
    const zip = new JSZip();
    const folder = zip.folder(zipName);
    const usedFilenames = new Set<string>();

    const downloadPromises = images.map(async (image, index) => {
      try {
        const originalFilename = extractFilenameFromUrl(image.src, `image-${index + 1}`);
        let filename = originalFilename;

        if (usedFilenames.has(filename)) {
          const ext = getFileExtension(filename);
          const baseName = filename.substring(0, filename.lastIndexOf('.'));
          let counter = 1;
          while (usedFilenames.has(filename)) {
            filename = `${baseName}_${counter}.${ext}`;
            counter++;
          }
        }
        usedFilenames.add(filename);

        const blob = await fetchImageAsBlob(image.src);
        folder.file(filename, blob);
      } catch (error) {
        console.error(`Failed to download image ${index + 1}:`, error);
      }
    });

    await Promise.all(downloadPromises);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${timestampedZipName}.zip`);
    message.success('Images packed successfully, please confirm download');
  } catch (error) {
    console.error('Error creating zip:', error);
    message.error('Failed to pack images, please try again');
  } finally {
    loadingMessage();
  }
};

const downloadImages = (images: { src: string }[], type: 'content' | 'selection') => {
  const zipName = type === 'content' ? 'content-images' : 'selection-images';
  downloadImagesAsZip(images, zipName);
};

const syncImages = async (images: { src: string }[], type: 'content' | 'selection') => {
  if (!images || images.length === 0) {
    message.warning(type === 'content' ? 'No content images to sync' : 'No selection images to sync');
    return;
  }

  const loadingMessage = message.loading('Syncing images, please wait...', 0);

  try {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        const syncFn = type === 'content' ? syncContentImages : syncSelectionImages;
        const success = await syncFn(images, tabs[0].id);
        if (success) {
          message.success('Image sync started, redirecting to media library...');
        } else {
          message.error('Image sync failed, please try again');
        }
      } else {
        message.error('Unable to get current tab info');
      }
      loadingMessage();
    });
  } catch (error) {
    console.error('Failed to sync images:', error);
    message.error('Sync failed, please try again');
    loadingMessage();
  }
};

const onExploreVersionChange = (enabled: boolean) => {
  saveExploreVersionSetting(enabled);
};
</script>
