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
import { metaInfoList as enMetaInfoList } from '@gitcoffee/postbot-publisher-en';

export const metaInfoList = enMetaInfoList;

export const getMetaInfoList = async () => {
    const results = await Promise.all(
        Object.keys(metaInfoList).map(async (key) => {
            let metaInfo: Record<string, any> = {};
            const meta = metaInfoList[key];
            if (meta != null) {
                try {
                    const mediaInfo = await meta?.getMediaInfo();
                    if (mediaInfo) {
                        mediaInfo[key] = key;
                        metaInfo = {
                            [key]: mediaInfo
                        };
                    }
                } catch (e) {
                    console.error('Failed to get meta info', e);
                }
            }
            return metaInfo;
        })
    );

    const metaInfos = results.reduce((acc: Record<string, any>, currentData) => {
        return { ...acc, ...currentData };
    }, {});

    return metaInfos;
}
