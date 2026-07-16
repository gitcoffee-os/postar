import { publisherEntries } from '@gitcoffee/postbot-publisher-en'
import type { PublisherEntry, DebugConfig } from '@gitcoffee/postbot-publisher-debug'

export { publisherEntries }

/**
 * 保留函数映射格式，兼容 plugins/index.ts 里的 setupInjection。
 */
export const publisher = {
  article: Object.fromEntries(
    Object.entries(publisherEntries.article).map(([code, entry]) => [code, (entry as PublisherEntry).publish])
  ),
  moment: Object.fromEntries(
    Object.entries(publisherEntries.moment).map(([code, entry]) => [code, (entry as PublisherEntry).publish])
  ),
  video: Object.fromEntries(
    Object.entries(publisherEntries.video).map(([code, entry]) => [code, (entry as PublisherEntry).publish])
  ),
  audio: Object.fromEntries(
    Object.entries(publisherEntries.audio).map(([code, entry]) => [code, (entry as PublisherEntry).publish])
  ),
}

/**
 * 在页面主世界注册发布器调试配置，供调试面板从运行时拉取选择器。
 * 函数体保持自包含，避免 chrome.scripting.executeScript 序列化时丢失闭包。
 */
function registerPublisherConfigOnPage(code: string, config: DebugConfig): void {
  const key = '__postbotPublisherDebugRegistry__'
  const w = window as unknown as Record<string, any>
  if (!w[key]) {
    w[key] = {}
  }
  w[key][code] = config
}

export const executeScriptsToTabs = (tabs: any, data: any) => {
  tabs?.forEach((item: any) => {
    const { tab, platform } = item
    if (!tab?.id) {
      return
    }
    let executed = false
    const listener = (tabId: number, info: any) => {
      if (tabId === tab.id && info.status === 'complete' && !executed) {
        executed = true
        chrome.tabs.onUpdated.removeListener(listener)
        if (platform) {
          const entry: PublisherEntry | undefined =
            publisherEntries[platform.type]?.[platform.code] ||
            publisherEntries['moment']?.[platform.code] ||
            publisherEntries['article']?.[platform.code]

          const publishFunc = entry?.publish

          // 1. 先把该发布器的选择器配置注册到页面主世界，调试面板可实时拉取
          if (entry?.debugConfig) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: registerPublisherConfigOnPage,
              args: [platform.code, entry.debugConfig],
            })
          }

          // 2. 执行发布脚本
          if (publishFunc && typeof publishFunc === 'function') {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: publishFunc,
              args: [
                {
                  data: data?.data,
                  platform: platform,
                },
              ],
            })
          } else {
            console.warn(`No publish function found for platform: ${platform.type}/${platform.code}`)
          }
        }
      }
    }
    chrome.tabs.onUpdated.addListener(listener)
  })
}
