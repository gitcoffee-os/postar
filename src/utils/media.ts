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
import { getPostarBaseUrl } from '~/config/config';
import { image, media } from '@gitcoffee/postbot-utils';
import type { ImageData, ProcessedImage } from '@gitcoffee/postbot-utils';

export type { ImageData, ProcessedImage };
export const { isValidOrigin, extractFilenameFromUrl, getImageType, fetchImageAsBlob, processImages, uploadQueueManager, getUploadQueueImages, markUploadComplete, MEDIA_SYNC_ACTION } = { ...image, ...media };

export const syncImagesToMediaLibrary = async (images: ImageData[], tabId: number): Promise<boolean> => {
  try {
    const processedImages = await media.processImages(images);

    if (processedImages.length === 0) {
      console.error('[MediaSync] No images to sync');
      return false;
    }

    const syncId = `sync_${Date.now()}`;

    media.uploadQueueManager.add(syncId, processedImages);

    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set(
        { [syncId]: processedImages },
        () => {
          if (chrome.runtime.lastError) {
            console.warn('[MediaSync] Failed to store image data:', chrome.runtime.lastError);
          } else {
            console.log('[MediaSync] Image data stored:', syncId);
          }
          resolve();
        }
      );
    });

    const mediaLibraryUrl = `${getPostarBaseUrl()}/exmay/postbot/file/list?syncId=${syncId}`;

    console.log('[MediaSync] Opening media library:', mediaLibraryUrl);
    const tab = await chrome.tabs.create({ url: mediaLibraryUrl });

    return true;
  } catch (error) {
    console.error('[MediaSync] Sync failed:', error);
    return false;
  }
};

export const syncContentImages = async (contentImages: ImageData[], tabId: number): Promise<boolean> => {
  return syncImagesToMediaLibrary(contentImages, tabId);
};

export const syncSelectionImages = async (selectionImages: ImageData[], tabId: number): Promise<boolean> => {
  return syncImagesToMediaLibrary(selectionImages, tabId);
};

export const handleGetSyncImages = async (request: any, event: MessageEvent) => {
  console.log('[MediaSync] Handling get sync images request, syncId:', request.data?.syncId);

  const syncId = request.data?.syncId;
  if (!syncId) {
    console.warn('[MediaSync] No syncId provided');
    event.source?.postMessage({
      type: 'response',
      traceId: request.traceId,
      action: request.action,
      code: 400,
      message: 'No syncId provided',
      data: null
    });
    return;
  }

  const queueImages = media.getUploadQueueImages(syncId);

  if (queueImages && queueImages.length > 0) {
    console.log('[MediaSync] Got images from queue:', queueImages.length);

    const validImages = queueImages.filter(img => img.data);

    event.source?.postMessage({
      type: 'response',
      traceId: request.traceId,
      action: request.action,
      code: 0,
      message: 'success',
      data: {
        images: validImages,
        syncId: syncId
      }
    });
    return;
  }

  chrome.storage.local.get(syncId, (result) => {
    const images = result[syncId] || [];
    console.log('[MediaSync] Got images from storage:', images.length);

    event.source?.postMessage({
      type: 'response',
      traceId: request.traceId,
      action: request.action,
      code: 0,
      message: 'success',
      data: {
        images: images,
        syncId: syncId
      }
    });
  });
};
