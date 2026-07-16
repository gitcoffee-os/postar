import { createDebugger } from '@gitcoffee/postbot-publisher-debug'
import { publisherDebugConfigs } from '@gitcoffee/postbot-publisher-en'
import type { DebugConfig, DebuggerInstance } from '@gitcoffee/postbot-publisher-debug'

interface PlatformPattern {
  match: (url: string) => boolean
  key: string
}

/**
 * URL -> publisherDebugConfigs 索引映射。
 * 这里只列出常用平台的主形态；同一域名存在多种形态时（如 X 的 moment/video），
 * 优先取最常用的一种。其余形态可在运行时由发布器自身注册到主世界注册表后被拉取。
 */
const PLATFORM_URL_PATTERNS: PlatformPattern[] = [
  { match: (url) => /tiktok\.com/.test(url), key: 'video_tiktok_video' },
  { match: (url) => /youtube\.com/.test(url), key: 'video_youtube' },
  { match: (url) => /medium\.com/.test(url) || /medium\.com\/new-story/.test(url), key: 'article_medium' },
  { match: (url) => /linkedin\.com/.test(url), key: 'moment_linkedin' },
  { match: (url) => /x\.com/.test(url) || /twitter\.com/.test(url), key: 'moment_x' },
  { match: (url) => /facebook\.com/.test(url), key: 'video_facebook_reels' },
  { match: (url) => /pinterest\.com/.test(url) && !/\/pin\/create\/button/.test(url), key: 'video_pinterest_video' },
  { match: (url) => /instagram\.com/.test(url), key: 'video_instagram_reels' },
  { match: (url) => /reddit\.com/.test(url), key: 'moment_reddit' },
  { match: (url) => /dev\.to/.test(url), key: 'article_devto' },
  { match: (url) => /github\.com/.test(url) && /\/new\//.test(url), key: 'article_github' },
]

let debugInstance: DebuggerInstance | null = null

export function setupDebugger(): void {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault()
      e.stopPropagation()
      toggleDebugPanel()
    }
  })

  if (import.meta.env.DEV) {
    detectAndInitDebugger()
  }
}

async function detectAndInitDebugger(): Promise<void> {
  const config = await resolveConfig(window.location.href)
  if (config) {
    setTimeout(() => {
      debugInstance = createDebugger({ ...config, autoShow: true })
    }, 1000)
  }
}

async function toggleDebugPanel(): Promise<void> {
  if (debugInstance) {
    debugInstance.toggle()
    return
  }

  const config = await resolveConfig(window.location.href)
  const groups = config?.groups || [
    {
      name: '通用选择器',
      selectors: [
        { name: 'File Input', selector: 'input[type="file"]' },
        { name: 'Contenteditable', selector: 'div[contenteditable="true"]' },
        { name: 'All Buttons', selector: 'button' },
        { name: 'Text Input', selector: 'input[type="text"]' },
        { name: 'Textarea', selector: 'textarea' },
      ],
    },
  ]

  debugInstance = createDebugger({
    platform: config?.platform || window.location.hostname,
    groups,
    autoShow: true,
    shortcutKey: 'Ctrl+Shift+D',
  })
}

/**
 * 解析当前页面应使用的调试配置：
 * 1. 根据 URL 从 publisherEntries 取静态配置（发布器源码中的选择器）。
 * 2. 通过 chrome.scripting.executeScript 从页面主世界拉取运行时注册表，
 *    合并由 executeScriptsToTabs 在发布前注入的更精确/更多形态的配置。
 */
async function resolveConfig(url: string): Promise<DebugConfig | null> {
  const staticConfig = getStaticConfig(url)
  const runtimeConfigs = await fetchRuntimeConfigs()

  const matchedRuntime = Object.values(runtimeConfigs).find((cfg) =>
    staticConfig ? cfg.platform === staticConfig.platform : false
  )

  // 如果有运行时配置，优先用它；否则回退到静态配置
  if (matchedRuntime) {
    return mergeConfigs(staticConfig, matchedRuntime)
  }

  return staticConfig
}

function getStaticConfig(url: string): DebugConfig | null {
  for (const p of PLATFORM_URL_PATTERNS) {
    if (p.match(url)) {
      const config = publisherDebugConfigs[p.key]
      if (config) {
        return config
      }
    }
  }
  return null
}

/**
 * 从 Background 读取当前页面主世界的运行时注册表。
 * 发布器被注入前会通过 registerPublisherConfigOnPage 写入该表。
 * 内容脚本无法直接访问主世界 window，因此通过 background 中转 chrome.scripting.executeScript。
 */
async function fetchRuntimeConfigs(): Promise<Record<string, DebugConfig>> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve({})
      return
    }

    chrome.runtime.sendMessage({ type: 'GET_RUNTIME_DEBUG_CONFIGS' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Postar Debugger] fetch runtime configs failed:', chrome.runtime.lastError.message)
        resolve({})
        return
      }
      resolve((response as Record<string, DebugConfig>) || {})
    })
  })
}

/**
 * 合并静态与运行时配置：保留静态配置的元信息，把运行时 groups 追加到末尾。
 * 如果平台名一致则直接覆盖 groups，避免重复。
 */
function mergeConfigs(staticCfg: DebugConfig | null, runtimeCfg: DebugConfig): DebugConfig {
  if (!staticCfg) return runtimeCfg

  const staticGroupNames = new Set(staticCfg.groups.map((g) => g.name))
  const extraGroups = runtimeCfg.groups.filter((g) => !staticGroupNames.has(g.name))

  return {
    ...staticCfg,
    platform: runtimeCfg.platform || staticCfg.platform,
    groups: [...staticCfg.groups, ...extraGroups],
  }
}
