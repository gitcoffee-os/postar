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
import type { BridgeProfile } from '@gitcoffee-os/postbot-content-services';
import { appId, getPostarBaseUrl } from '~/config/config';

/**
 * Postar 的窗口消息通道 profile。
 *
 * 只做「类型导入」+ 字面量：background 也用这份 profile，不能把
 * content-services 的运行时一并打进 service worker。
 *
 * 页面消息带 `channel: 'postbot'` 时本扩展整体不消费，反之亦然；
 * 写操作只接受 postar 自己的 Web 源，避免在 PostBot 站点上被误触发发布。
 */
export const bridgeProfile = {
  channel: appId,
  ownOrigins: [getPostarBaseUrl(), 'https://postar.exmay.com', 'https://postar-dev.exmay.com'],
  trustedOrigins: ['https://postbot.exmay.com', 'https://postbot-dev.exmay.com'],
  allowLegacyWrite: true,
} satisfies BridgeProfile;
