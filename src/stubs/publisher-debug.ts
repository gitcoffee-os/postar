export const createDebugger = () => ({
  testAll: () => [],
  testSelectors: () => [],
  testSelector: () => ({ name: '', selector: '', found: false, count: 0, elements: [] }),
  show: () => {},
  hide: () => {},
  toggle: () => {},
  destroy: () => {},
  addGroup: () => {},
})

export const facebookReelsDebugConfig = { platform: '', groups: [] }
export const pinterestVideoDebugConfig = { platform: '', groups: [] }
export const instagramDebugConfig = { platform: '', groups: [] }

export type DebugSelectorItem = { name: string; selector: string }
export type DebugSelectorGroup = { name: string; selectors: DebugSelectorItem[] }
export type DebugConfig = { platform: string; groups: DebugSelectorGroup[]; autoShow?: boolean; autoRefresh?: number; shortcutKey?: string }
export type SelectorTestResult = { name: string; selector: string; found: boolean; count: number; elements: any[]; error?: string }
export type DebuggerInstance = ReturnType<typeof createDebugger>
