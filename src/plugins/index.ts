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
import { pluginRegistry, setupInjection, PluginType, PluginBase, PublisherConfig, PluginImplementation } from '@gitcoffee/postbot-plugin-engine';
import { publishEngine } from '@gitcoffee/postbot-publish-engine';
import { registerEnPlatforms, platformMetas as enPlatformMetas, metaInfoList as enMetaInfoList, publisher as enPublisher } from '@gitcoffee/postbot-publisher-en';

const pluginBaseEn: PluginBase = {
  code: 'en',
  name: 'International Publisher Plugin',
  version: '1.0.0',
  type: PluginType.PUBLISHER,
  description: 'Medium, Dev.to, LinkedIn and more international platforms',
  author: 'GitCoffee'
};

const pluginConfigEn: PublisherConfig = {
  types: ['article', 'moment', 'video', 'podcast'],
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
    publisher: { publisher: enPublisher }
  }
};

export const initPlugins = () => {
  pluginRegistry.register(pluginBaseEn, pluginConfigEn, pluginImplementationEn, enPlugin.modules);
  console.log(`Postar: EN publisher plugin initialized`);
};
