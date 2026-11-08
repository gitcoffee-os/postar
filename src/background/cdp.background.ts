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

/**
 * 通过 CDP（chrome.debugger）完成“必须由真实用户手势触发”的文件选择上传。
 *
 * 背景：Chrome 要求 file input 的点击必须处于可信用户手势中，脚本合成点击会被拒绝
 * （File chooser dialog can only be shown with a user activation）。部分平台点击封面
 * 即调起系统文件框，因此普通脚本无法注入文件。
 *
 * 方案：
 * 1. 用 chrome.downloads 把图片落到本地，取得绝对路径（CDP 只能设置本地文件）；
 * 2. chrome.debugger 附加到目标标签页，Page.setInterceptFileChooserDialog 拦截文件框；
 * 3. 用 Input.dispatchMouseEvent 派发**可信**鼠标事件（满足 user activation）；
 * 4. 收到 Page.fileChooserOpened 后，用 DOM.setFileInputFiles 注入本地文件；
 * 5. 完成后分离调试器并清理临时下载文件。
 */

const CDP_VERSION = '1.3';
const UPLOAD_DIR = 'postar-upload';

const sendCommand = (target: chrome.debugger.Debuggee, method: string, params?: Record<string, unknown>) =>
  new Promise<any>((resolve, reject) => {
    chrome.debugger.sendCommand(target, method, params || {}, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result);
    });
  });

const waitForDownloadPath = (downloadId: number, timeout = 15000) =>
  new Promise<string>((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      chrome.downloads.search({ id: downloadId }, (items) => {
        const item = items?.[0];
        if (item?.state === 'complete' && item.filename) {
          clearInterval(timer);
          resolve(item.filename);
          return;
        }
        if (Date.now() - startedAt > timeout) {
          clearInterval(timer);
          reject(new Error('等待封面图片下载完成超时'));
        }
      });
    }, 200);
  });

const waitFileChooserOpened = (target: chrome.debugger.Debuggee, timeout = 8000) =>
  new Promise<{ backendNodeId: number }>((resolve, reject) => {
    const startedAt = Date.now();
    const onEvent = (source: chrome.debugger.Debuggee, method: string, params: any) => {
      if (source.tabId !== target.tabId || method !== 'Page.fileChooserOpened') {
        return;
      }
      cleanup();
      resolve(params || {});
    };
    const timer = setInterval(() => {
      if (Date.now() - startedAt > timeout) {
        cleanup();
        reject(new Error('等待文件选择框打开超时'));
      }
    }, 200);
    const cleanup = () => {
      clearInterval(timer);
      chrome.debugger.onEvent.removeListener(onEvent);
    };
    chrome.debugger.onEvent.addListener(onEvent);
  });

const cleanupDownload = (downloadId: number) => {
  setTimeout(() => {
    chrome.downloads.removeFile(downloadId, () => {
      void chrome.runtime.lastError;
      chrome.downloads.erase({ id: downloadId }, () => void chrome.runtime.lastError);
    });
  }, 8000);
};

export const uploadFileViaCDP = async (
  tabId: number,
  payload: { dataUrl: string; fileName?: string; x: number; y: number }
) => {
  const { dataUrl, fileName, x, y } = payload || ({} as any);
  if (!dataUrl || typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('上传参数不完整（需要 dataUrl/x/y）');
  }

  const downloadId = await new Promise<number>((resolve, reject) => {
    chrome.downloads.download(
      {
        url: dataUrl,
        filename: `${UPLOAD_DIR}/${fileName || `${Date.now()}.jpg`}`,
        conflictAction: 'overwrite',
        saveAs: false,
      },
      (id) => {
        if (chrome.runtime.lastError || typeof id !== 'number') {
          reject(new Error(chrome.runtime.lastError?.message || '创建临时下载失败'));
          return;
        }
        resolve(id);
      }
    );
  });

  const filePath = await waitForDownloadPath(downloadId);
  const target: chrome.debugger.Debuggee = { tabId };

  try {
    await new Promise<void>((resolve, reject) => {
      chrome.debugger.attach(target, CDP_VERSION, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });

    await sendCommand(target, 'Page.enable');
    await sendCommand(target, 'DOM.enable');
    await sendCommand(target, 'Page.setInterceptFileChooserDialog', { enabled: true });

    const chooserPromise = waitFileChooserOpened(target);
    // 可信鼠标事件（满足 user activation），坐标由内容脚本按视口 CSS 像素提供
    await sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', clickCount: 0 });
    await sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

    const chooser = await chooserPromise;
    await sendCommand(target, 'DOM.setFileInputFiles', { files: [filePath], backendNodeId: chooser.backendNodeId });

    console.log('[CDP] 封面上传完成', { filePath, backendNodeId: chooser.backendNodeId });
    return { success: true, filePath };
  } finally {
    await new Promise<void>((resolve) => {
      chrome.debugger.detach(target, () => {
        void chrome.runtime.lastError;
        resolve();
      });
    });
    cleanupDownload(downloadId);
  }
};

/**
 * 通过 CDP 派发真实鼠标事件点击页面坐标（悬浮 → 按下 → 抬起）。
 * 用于合成 element.click() 无法满足的场景（如平台校验 isTrusted、hover 才出现的交互）。
 * 坐标由内容脚本按视口 CSS 像素提供（scrollIntoView 后取 getBoundingClientRect 中心）。
 */
export const clickViaCDP = async (tabId: number, payload: { x: number; y: number }) => {
  const { x, y } = payload || ({} as any);
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('点击参数不完整（需要 x/y）');
  }

  const target: chrome.debugger.Debuggee = { tabId };

  try {
    await new Promise<void>((resolve, reject) => {
      chrome.debugger.attach(target, CDP_VERSION, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });

    await sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', clickCount: 0 });
    await sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

    console.log('[CDP] 真实点击完成', { x, y });
    return { success: true };
  } finally {
    await new Promise<void>((resolve) => {
      chrome.debugger.detach(target, () => {
        void chrome.runtime.lastError;
        resolve();
      });
    });
  }
};

export const initCdpBackground = () => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request?.type !== 'request') {
      return;
    }
    if (request?.action === 'uploadFileViaCDP') {
      const tabId = sender?.tab?.id;
      if (!tabId) {
        sendResponse({ error: '无法获取当前标签页' });
        return;
      }
      uploadFileViaCDP(tabId, request.data)
        .then((result) => sendResponse(result))
        .catch((error) => {
          console.error('[CDP] 上传失败', error);
          sendResponse({ error: String(error?.message || error) });
        });
      return true;
    }
    if (request?.action === 'cdpClick') {
      const tabId = sender?.tab?.id;
      if (!tabId) {
        sendResponse({ error: '无法获取当前标签页' });
        return;
      }
      clickViaCDP(tabId, request.data)
        .then((result) => sendResponse(result))
        .catch((error) => {
          console.error('[CDP] 点击失败', error);
          sendResponse({ error: String(error?.message || error) });
        });
      return true;
    }
  });
};
