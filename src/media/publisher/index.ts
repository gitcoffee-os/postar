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
import { publish, getSupportedPlatforms } from '@gitcoffee/postbot-media';
import { createTabsForPlatforms } from '@gitcoffee/postbot-tabs';
import { getMetaInfoList } from '../meta';

export { publish, getSupportedPlatforms };

export const getPlatformMetaInfoList = () => {
  return getMetaInfoList();
};

export const windowPublish = (data: any) => {
    if (!data?.platforms) {
        return;
    }
    if (data?.platforms.length === 0) {
        return;
    }
    createTabsForPlatforms(data, (tabs, data) => {
        console.log('Postar: publishing to tabs', tabs.length);
    }, 'Postar');
}
