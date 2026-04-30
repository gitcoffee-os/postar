import { authority } from '@gitcoffee/postbot-api';
import { syncImages } from '@gitcoffee/postbot-media';

const syncImagesToMedia = async (images: { src: string }[], label: string) => {
  try {
    const syncedImages = await syncImages(images);
    return await authority.media.syncMediaApi({ images: syncedImages });
  } catch (error) {
    console.error(`Failed to sync ${label} images:`, error);
    throw error;
  }
};

export const handleSyncContentImages = (images: { src: string }[]) => syncImagesToMedia(images, 'content');

export const handleSyncSelectionImages = (images: { src: string }[]) => syncImagesToMedia(images, 'selection');
