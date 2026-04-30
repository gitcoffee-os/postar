import { createMetaRegistry } from '@gitcoffee/postbot-media';

const metaRegistry = createMetaRegistry();

export const registerPlatformMeta = metaRegistry.registerPlatformMeta;
export const getPlatformMeta = metaRegistry.getPlatformMeta;
export const getAllPlatformMetas = metaRegistry.getAllPlatformMetas;
export const getMetaInfoList = metaRegistry.getMetaInfoList;
