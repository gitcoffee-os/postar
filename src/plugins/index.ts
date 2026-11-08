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
import { pluginRegistry, setupInjection, PluginType, PluginBase, PublisherConfig, PluginImplementation } from '@gitcoffee-os/postbot-plugin-engine';
import { publishEngine } from '@gitcoffee-os/postbot-publish-engine';
import { registerEnPlatforms, platformMetas as enPlatformMetas, metaInfoList as enMetaInfoList, publisher as enPublisher, publisherDebugConfigs as enPublisherDebugConfigs } from '@gitcoffee-os/postbot-publisher-en';
import { createAiAdapterPlugin } from '@gitcoffee-os/postbot-ai-adapter';
import type { DebugConfigLike } from '@gitcoffee-os/postbot-ai-adapter';

import { platformMetas, platforms } from '~/media/platform';
import { metaInfoList } from '~/media/meta';
import { publisher } from '~/media/publisher/publisher.script';
import { getAdapterRegistry } from '~/ai-adapter/adapter.shared';

const pluginBaseEn: PluginBase = {
  code: 'en',
  name: 'International Publisher Plugin',
  version: '1.0.0',
  type: PluginType.PUBLISHER,
  description: 'Medium, Dev.to, LinkedIn and more international platforms',
  author: 'GitCoffee'
};

const pluginConfigEn: PublisherConfig = {
  types: ['article'
    // , 'moment', 'video', 'podcast'
  ],
};

const pluginImplementationEn: PluginImplementation = {
  initialize: async () => {
    registerEnPlatforms(publishEngine);
  },
  getSupportedPlatforms: () => {
    return Object.keys(enPlatformMetas);
  }
};

const enPlugin = {
  base: pluginBaseEn,
  config: pluginConfigEn,
  implementation: pluginImplementationEn,
  modules: {
    platform: { platformMetas: enPlatformMetas },
    meta: { metaInfoList: enMetaInfoList },
    publisher: { publisher: enPublisher, publisherDebugConfigs: enPublisherDebugConfigs }
  }
};

export const initPlugins = () => {
  setupInjection({
    platformMetas,
    platforms,
    metaInfoList,
    publisher,
  });

  pluginRegistry.register(pluginBaseEn, pluginConfigEn, pluginImplementationEn, enPlugin.modules);

  pluginImplementationEn.initialize();

  // AI 自适应插件：用存量调试配置建立基线（幂等），与 content/background 各上下文共享 registry
  try {
    const aiAdapterPlugin = createAiAdapterPlugin({
      debugConfigs: enPublisherDebugConfigs as Record<string, DebugConfigLike>,
      registry: getAdapterRegistry(),
    });

    pluginRegistry.register(
      aiAdapterPlugin.base,
      aiAdapterPlugin.config,
      aiAdapterPlugin.implementation,
      aiAdapterPlugin.modules,
    );

    aiAdapterPlugin.implementation.initialize?.().catch((error: any) => {
      console.error('AI 自适应插件初始化失败:', error);
    });
  } catch (error) {
    console.error('AI 自适应插件注册失败:', error);
  }

  console.log(`Postar: EN publisher plugin initialized`);
};
