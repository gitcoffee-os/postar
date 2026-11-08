import { publisherEntries } from '@gitcoffee-os/postbot-publisher-en'
import type { PublisherEntry, DebugConfig } from '@gitcoffee-os/postbot-publisher-debug'
import { backendReportIncident, installRedirectShim } from '@gitcoffee-os/postbot-ai-adapter'
import { initAdapterRegistry } from '~/ai-adapter/adapter.shared'
import { recordAutopublishOutcome } from './autopublish-collector'

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

    const runPublish = async () => {
      if (!platform) return

      const entry: PublisherEntry | undefined =
        publisherEntries[platform.type]?.[platform.code] ||
        publisherEntries['moment']?.[platform.code] ||
        publisherEntries['article']?.[platform.code]

      const publishFunc = entry?.publish

      // 0. 若该平台存在 AI 修复补丁，先把旧→新选择器重定向 shim 注入页面，
      //    再执行发布脚本，保证失效的选择器能在发布期间被自动翻译。
      try {
        const schemaKey = `${platform.type}_${platform.code}`
        const registry = await initAdapterRegistry()
        const redirects = registry.redirectsFor(schemaKey)
        if (redirects.length > 0) {
          const maps: Record<string, string[]> = {}
          redirects.forEach((r) => {
            maps[r.from] = r.to
          })
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: installRedirectShim,
            args: [
              {
                maps,
                schemaKey,
                version: registry.getEffectiveSchema(schemaKey)?.version ?? 1
              }
            ]
          })
          console.log(`[AiAdapter] 已注入 ${redirects.length} 条选择器重定向 → ${schemaKey}`, redirects)
        }
      } catch (e) {
        console.warn('[AiAdapter] 重定向注入失败，按原选择器执行', e)
      }

      // 1. 先把该发布器的选择器配置注册到页面主世界，调试面板可实时拉取
      if (entry?.debugConfig) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: registerPublisherConfigOnPage,
          args: [platform.code, entry.debugConfig],
        }).catch(() => undefined)
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
        }).then((results: any) => {
          // 自动发布终态收集（M3）：发布器函数为 async，executeScript 等其 Promise 落定。
          // 发布器可选返回 { status, publishedUrl, failureReason, errorMsg }；无返回按成功处理
          // （与既有 fire-and-forget 语义一致，不影响手动发布路径）。
          const ret = results?.[0]?.result
          recordAutopublishOutcome({
            platformCode: platform.code,
            platformName: platform.name,
            status: ret?.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
            publishedUrl: ret?.publishedUrl || undefined,
            screenshotUrl: ret?.screenshotUrl || undefined,
            failureReason: ret?.failureReason,
            errorMsg: ret?.errorMsg,
          })
        }).catch((err) => {
          console.warn('[Postar] 发布脚本执行失败:', err)
          recordAutopublishOutcome({
            platformCode: platform.code,
            platformName: platform.name,
            status: 'FAILED',
            failureReason: 'SCRIPT_ERROR',
            errorMsg: (err as Error)?.message ?? '发布脚本执行异常',
          })
          void backendReportIncident({
            schemaKey: `${platform.type}_${platform.code}`,
            platform: platform.code,
            pageType: platform.type,
            url: tab.url,
            errorMsg: (err as Error)?.message ?? '发布脚本执行异常',
          }).catch(() => undefined)
        })
      } else {
        console.warn(`No publish function found for platform: ${platform.type}/${platform.code}`)
        recordAutopublishOutcome({
          platformCode: platform.code,
          platformName: platform.name,
          status: 'FAILED',
          failureReason: 'NOT_SUPPORTED',
          errorMsg: `平台 ${platform.code} 无发布器`,
        })
      }
    }

    // 先查询 tab 当前状态，若已加载完成则立即执行，否则等待 complete 事件
    // （只等 onUpdated 会导致已加载完成的页面永不触发发布）
    let executed = false
    const safeRun = () => {
      if (executed) return
      executed = true
      chrome.tabs.onUpdated.removeListener(listener)
      void runPublish()
    }

    const listener = (tabId: number, info: any) => {
      if (tabId === tab.id && info.status === 'complete') {
        safeRun()
      }
    }
    chrome.tabs.onUpdated.addListener(listener)

    chrome.tabs.get(tab.id, (tabInfo) => {
      if (chrome.runtime.lastError || tabInfo?.status === 'complete') {
        safeRun()
      }
    })
  })
}
