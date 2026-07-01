import { createDebugger, instagramDebugConfig, facebookReelsDebugConfig, pinterestVideoDebugConfig } from '@gitcoffee/postbot-publisher-debug'
import type { DebugConfig, DebuggerInstance } from '@gitcoffee/postbot-publisher-debug'

const PLATFORM_PATTERNS: { match: (url: string) => boolean; config: DebugConfig }[] = [
  {
    match: (url) => /tiktok\.com/.test(url),
    config: {
      platform: 'TikTok Video',
      shortcutKey: 'Ctrl+Shift+D',
      autoRefresh: 2000,
      groups: [
        {
          name: 'Step 1 — Upload',
          selectors: [
            { name: 'Upload Container', selector: '[data-e2e="select_video_container"]' },
            { name: 'Upload Button', selector: '[data-e2e="select_video_button"]' },
            { name: 'File Input', selector: 'input[type="file"]' },
          ],
        },
        {
          name: 'Step 2 — Edit Page',
          selectors: [
            { name: 'Upload Success', selector: '[data-e2e="upload_status_container"] .info-status.success' },
            { name: 'Caption Container', selector: '[data-e2e="caption_container"]' },
            { name: 'Draft Editor', selector: '[data-e2e="caption_container"] div[contenteditable="true"]' },
          ],
        },
        {
          name: 'Cover Dialog',
          selectors: [
            { name: 'Cover Container', selector: '[data-e2e="cover_container"]' },
            { name: 'Cover Container Inner', selector: 'div.cover-container' },
            { name: 'Edit Button', selector: 'div.edit-container' },
            { name: 'Cover Dialog', selector: 'div.Dialog__content[data-dialog-content="true"]' },
            { name: 'Upload Area', selector: 'label.ImageUpload__uploadArea' },
            { name: 'File Input', selector: 'div.Dialog__content input[type="file"]' },
            { name: 'Save Button', selector: 'button.header-button' },
          ],
        },
        {
          name: 'Publish',
          selectors: [
            { name: 'Publish Button (e2e)', selector: '[data-e2e="post_video_button"]' },
            { name: 'All Buttons', selector: 'button' },
          ],
        },
      ],
    },
  },
  {
    match: (url) => /youtube\.com/.test(url),
    config: {
      platform: 'YouTube',
      shortcutKey: 'Ctrl+Shift+D',
      autoRefresh: 2000,
      groups: [
        {
          name: 'Step 1 — Upload Dialog',
          selectors: [
            { name: 'Upload Dialog', selector: 'ytcp-uploads-dialog' },
            { name: 'Video File Input', selector: 'ytcp-uploads-dialog input[type="file"]' },
            { name: 'Global File Input', selector: 'input[type="file"]' },
          ],
        },
        {
          name: 'Step 2 — Details Editor',
          selectors: [
            { name: 'Details Form', selector: 'ytcp-video-metadata-editor#details' },
            { name: 'Title Editor', selector: '#title-textarea #textbox' },
            { name: 'Description Editor', selector: '#description-textarea #textbox' },
            { name: 'Title Textarea Container', selector: '#title-textarea' },
            { name: 'Description Textarea Container', selector: '#description-textarea' },
          ],
        },
        {
          name: 'Step 2b — Thumbnail',
          selectors: [
            { name: 'Thumbnail Container', selector: 'ytcp-video-thumbnail-editor' },
            { name: 'Thumbnail Uploader', selector: 'ytcp-thumbnail-uploader' },
            { name: 'Select Button (Upload File)', selector: 'ytcp-video-thumbnail-editor button#select-button' },
            { name: 'Thumbnail File Input', selector: 'ytcp-video-thumbnail-editor input[type="file"]' },
          ],
        },
        {
          name: 'Step 2c — Audience',
          selectors: [
            { name: 'Kids Not MFK', selector: 'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]' },
            { name: 'Kids MFK', selector: 'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_MFK"]' },
          ],
        },
        {
          name: 'Step 3 — Navigation & Visibility',
          selectors: [
            { name: 'Next Button', selector: '#next-button' },
            { name: 'Back Button', selector: '#back-button' },
            { name: 'Done Button', selector: '#done-button' },
            { name: 'Visibility Public', selector: 'paper-radio-button[name="PUBLIC"]' },
            { name: 'Visibility Unlisted', selector: 'paper-radio-button[name="UNLISTED"]' },
            { name: 'Visibility Private', selector: 'paper-radio-button[name="PRIVATE"]' },
          ],
        },
      ],
    },
  },
  {
    match: (url) => /medium\.com/.test(url) || /medium\.com\/new-story/.test(url),
    config: {
      platform: 'Medium',
      shortcutKey: 'Ctrl+Shift+D',
      groups: [
        {
          name: 'Editor',
          selectors: [
            { name: 'Title', selector: 'h1[data-testid="storyTitle"]' },
            { name: 'Contenteditable', selector: 'div[contenteditable="true"]' },
          ],
        },
        {
          name: 'Publish',
          selectors: [
            { name: 'Publish Button', selector: 'button[data-testid="headerPublishButton"]' },
          ],
        },
      ],
    },
  },
  {
    match: (url) => /linkedin\.com/.test(url),
    config: {
      platform: 'LinkedIn',
      shortcutKey: 'Ctrl+Shift+D',
      groups: [
        {
          name: 'Editor',
          selectors: [
            { name: 'Contenteditable', selector: 'div[contenteditable="true"]' },
            { name: 'Article Title', selector: 'input[aria-label*="Title"]' },
          ],
        },
        {
          name: 'Publish',
          selectors: [
            { name: 'Publish Button', selector: 'button[aria-label*="Publish"]' },
            { name: 'Post Button', selector: 'button[data-control-name="post"]' },
          ],
        },
      ],
    },
  },
  {
    match: (url) => /x\.com/.test(url) || /twitter\.com/.test(url),
    config: {
      platform: 'X / Twitter',
      shortcutKey: 'Ctrl+Shift+D',
      groups: [
        {
          name: 'Post',
          selectors: [
            { name: 'Contenteditable', selector: 'div[contenteditable="true"]' },
            { name: 'File Input', selector: 'input[type="file"]' },
          ],
        },
        {
          name: 'Publish',
          selectors: [
            { name: 'Post Button', selector: 'button[data-testid="tweetButtonInline"]' },
            { name: 'Reply Button', selector: 'button[data-testid="tweetButton"]' },
          ],
        },
      ],
    },
  },
  {
    match: (url) => /facebook\.com/.test(url),
    config: facebookReelsDebugConfig,
  },
  {
    match: (url) => /pinterest\.com/.test(url) && !/\/pin\/create\/button/.test(url),
    config: pinterestVideoDebugConfig,
  },
  {
    match: (url) => /instagram\.com/.test(url),
    config: instagramDebugConfig,
  },
  {
    match: (url) => /reddit\.com/.test(url),
    config: {
      platform: 'Reddit',
      shortcutKey: 'Ctrl+Shift+D',
      groups: [
        {
          name: 'Post',
          selectors: [
            { name: 'Title', selector: 'textarea[name="title"]' },
            { name: 'Contenteditable', selector: 'div[contenteditable="true"]' },
            { name: 'File Input', selector: 'input[type="file"]' },
          ],
        },
        {
          name: 'Publish',
          selectors: [
            { name: 'Post Button', selector: 'button[data-click-id="text"]' },
          ],
        },
      ],
    },
  },
  {
    match: (url) => /dev\.to/.test(url),
    config: {
      platform: 'Dev.to',
      shortcutKey: 'Ctrl+Shift+D',
      groups: [
        {
          name: 'Editor',
          selectors: [
            { name: 'Title', selector: 'textarea[aria-label*="title"]' },
            { name: 'Contenteditable', selector: 'div[contenteditable="true"]' },
          ],
        },
        {
          name: 'Publish',
          selectors: [
            { name: 'Publish Button', selector: 'button[data-testid="submit-btn"]' },
          ],
        },
      ],
    },
  },
  {
    match: (url) => /github\.com/.test(url) && /\/new\//.test(url),
    config: {
      platform: 'GitHub',
      shortcutKey: 'Ctrl+Shift+D',
      groups: [
        {
          name: 'Editor',
          selectors: [
            { name: 'File Name', selector: 'input[aria-label*="name"]' },
            { name: 'Contenteditable', selector: 'div[contenteditable="true"]' },
            { name: 'Code Editor', selector: '.CodeMirror' },
          ],
        },
        {
          name: 'Publish',
          selectors: [
            { name: 'Commit Button', selector: 'button[type="submit"]' },
          ],
        },
      ],
    },
  },
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
    const config = detectPlatform(window.location.href)
    if (config) {
      setTimeout(() => {
        debugInstance = createDebugger({ ...config, autoShow: true })
      }, 1000)
    }
  }
}

function detectPlatform(url: string): DebugConfig | null {
  for (const p of PLATFORM_PATTERNS) {
    if (p.match(url)) return p.config
  }
  return null
}

function toggleDebugPanel(): void {
  if (debugInstance) {
    debugInstance.toggle()
    return
  }

  const config = detectPlatform(window.location.href)
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
