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
import { createMessageHandler } from '@gitcoffee/postbot-background';
import { state } from '~/content/components/postar.data';
import { getSupportedPlatforms, windowPublish } from '~/media/publisher';
import { getMetaInfoList } from '~/media/meta';
import { user } from '@gitcoffee/postbot-api';

export const handleMessage = createMessageHandler({
  getPlatforms: (type?: string) => getSupportedPlatforms()[type || 'article'],
  getMetaInfoList: async () => {
    const metaInfoList = await getMetaInfoList();
    state.metaInfoList = metaInfoList;
    return metaInfoList;
  },
  setContentData: (data: any) => { state.contentData = data; },
  getContentData: () => state.contentData,
  windowPublish: (data: any) => {
    const mediaType = data.mediaType || 'article';
    const platformCodes = data.platformCodes;
    const publishPlatforms = getSupportedPlatforms();
    const allPlatforms = Object.values(publishPlatforms[mediaType]);
    const checkedPlatforms = allPlatforms.filter((item: any) => platformCodes.includes(item.code));
    checkedPlatforms.forEach((item: any) => {
      item['metaInfo'] = state.metaInfoList[item.code];
    });
    const publishData = {
      platforms: checkedPlatforms,
      data: data,
    };
    windowPublish(publishData);
  },
  isLogin: () => user.isLoginApi({}),
});
