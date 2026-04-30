import { createMessageHandler } from '@gitcoffee/postbot-content-services';
import { getReaderData } from '~/media/parser';
import { state } from './components/postar.data';
import { getPostarBaseUrl, getPublishPath } from '~/config/config';
import { POSTAR_ACTION } from '~/message/postar.action';

export const handleMessage = createMessageHandler({
  state,
  getReaderData,
  getBaseUrl: getPostarBaseUrl,
  publishPath: getPublishPath(),
  actionSyncData: POSTAR_ACTION.PUBLISH_SYNC_DATA,
});
