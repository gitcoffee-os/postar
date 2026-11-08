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
import { image, media } from '@gitcoffee-os/postbot-utils';
import type { ImageData, ProcessedImage } from '@gitcoffee-os/postbot-utils';
import { checkBridgeRequest, createBridgeResponse, normalizeOrigin } from '@gitcoffee-os/postbot-content-services';
import type { BridgeProfile } from '@gitcoffee-os/postbot-content-services';

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

export const handleGetSyncImages = async (request: any, event: MessageEvent, profile?: BridgeProfile) => {
  console.log('[MediaSync] Handling get sync images request, syncId:', request.data?.syncId);

  const targetOrigin = normalizeOrigin(event.origin);
  const reply = (data: any, code = 0, message = 'success') => {
    if (!targetOrigin || !profile) return;
    (event.source as WindowProxy)?.postMessage(
      createBridgeResponse(request, data, profile, { code, message }),
      targetOrigin,
    );
  };

  const syncId = request.data?.syncId;
  if (!syncId) {
    console.warn('[MediaSync] No syncId provided');
    reply(null, 400, 'No syncId provided');
    return;
  }

  const queueImages = media.getUploadQueueImages(syncId);

  if (queueImages && queueImages.length > 0) {
    console.log('[MediaSync] Got images from queue:', queueImages.length);

    const validImages = queueImages.filter(img => img.data);

    reply({
      images: validImages,
      syncId: syncId
    });
    return;
  }

  chrome.storage.local.get(syncId, (result) => {
    const images = result[syncId] || [];
    console.log('[MediaSync] Got images from storage:', images.length);

    reply({
      images: images,
      syncId: syncId
    });
  });
};

let messageEventHandler: ((event: MessageEvent) => void) | null = null;

export const startMediaSyncMessageListener = (profile: BridgeProfile) => {
  messageEventHandler = async (event: MessageEvent) => {
    // Only handle messages from the current page itself
    if (event.source !== window) return;

    const request = event.data;

    if (request?.type === 'response' || request?.type === undefined || !request?.action) {
      return;
    }

    if (request.action !== media.MEDIA_SYNC_ACTION.GET_SYNC_IMAGES) {
      return;
    }

    // Same gate as the main bridge: only the extension whose channel matches responds
    const decision = checkBridgeRequest(request, event.origin, profile);
    if (!decision.accept) {
      return;
    }

    await handleGetSyncImages(request, event, profile);
  };

  window.addEventListener('message', messageEventHandler);
  console.log('[MediaSync] Message listener started');
};

export const stopMediaSyncMessageListener = () => {
  if (messageEventHandler) {
    window.removeEventListener('message', messageEventHandler);
    messageEventHandler = null;
    console.log('[MediaSync] Message listener stopped');
  }
};
