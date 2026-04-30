#!/usr/bin/env node

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

const fs = require('fs');
const path = require('path');

// 配置
const isDevMode = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const isBuildMode = process.argv.includes('--build') || !isDevMode;
const VITE_DIST_DIR = path.join(__dirname, '../dist');
const PLASMO_BUILD_DIR = path.join(__dirname, '../build/chrome-mv3-dev');
const PLASMO_STATIC_DIR = path.join(__dirname, '../.plasmo/static');
const SRC_DIR = path.join(__dirname, '../src');

// 创建目录
function mkdirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 处理 HTML 文件中的资源路径，将绝对路径转为相对路径
function processHtmlFile(src, dest) {
  mkdirSync(path.dirname(dest));
  let content = fs.readFileSync(src, 'utf8');
  // 将绝对路径替换为相对路径
  content = content.replace(/src="\//g, 'src="./');
  content = content.replace(/href="\//g, 'href="./');
  fs.writeFileSync(dest, content);
  console.log(`✓ Processed and copied ${src} to ${dest}`);
}

// 复制文件
function copyFile(src, dest) {
  mkdirSync(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied ${src} to ${dest}`);
}

// 复制目录
function copyDir(src, dest) {
  mkdirSync(dest);
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// 获取背景脚本文件名
function getBackgroundScript() {
  const assetsDir = path.join(VITE_DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    return null;
  }
  const files = fs.readdirSync(assetsDir);
  return files.find(
    (file) => file.startsWith('background-') && (file.endsWith('.js') || file.endsWith('.cjs'))
  );
}

// 获取内容脚本文件名
function getContentScript() {
  const assetsDir = path.join(VITE_DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    return null;
  }
  const files = fs.readdirSync(assetsDir);
  return files.find(
    (file) => file.startsWith('content-') && file.endsWith('.js')
  );
}

// 获取 popup 脚本文件名
function getPopupScript() {
  const assetsDir = path.join(VITE_DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    return null;
  }
  const files = fs.readdirSync(assetsDir);
  return files.find(
    (file) => file.startsWith('popup-') && file.endsWith('.js')
  );
}

// 获取 sidepanel 脚本文件名
function getSidepanelScript() {
  const assetsDir = path.join(VITE_DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    return null;
  }
  const files = fs.readdirSync(assetsDir);
  return files.find(
    (file) => file.startsWith('sidepanel-') && file.endsWith('.js')
  );
}

// 更新 manifest.json
function updateManifest() {
  const manifestPath = path.join(PLASMO_BUILD_DIR, 'manifest.json');
  
  // 如果manifest.json不存在，创建一个基本的manifest.json文件
  if (!fs.existsSync(manifestPath)) {
    console.warn(`⚠️ manifest.json not found at ${manifestPath}, creating a new one`);
    const baseManifest = {
      manifest_version: 3,
      name: 'Postar - Content Sync Assistant',
      version: '1.0.0',
      description: 'Postar - International Content Sync Assistant',
      permissions: [
        'storage',
        'activeTab',
        'tabs',
        'scripting',
        'sidePanel',
        'contextMenus',
        'clipboardRead',
        'downloads',
        'management',
        'background'
      ],
      host_permissions: [
        'https://*/*',
        'http://127.0.0.1/*',
        'http://localhost/*'
      ],
      web_accessible_resources: [
        {
          resources: [
            'index.html',
            'assets/*'
          ],
          matches: [
            '<all_urls>'
          ]
        }
      ],
      side_panel: {
        default_path: 'sidepanel.html'
      }
    };
    fs.writeFileSync(manifestPath, JSON.stringify(baseManifest, null, 2));
    console.log(`✓ Created new manifest.json file`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const backgroundScript = getBackgroundScript();
  const contentScript = getContentScript();

  console.log(`🔍 Checking for background script...`);
  if (backgroundScript) {
    console.log(`✓ Found background script: ${backgroundScript}`);
    // 更新或添加背景脚本配置
    if (!manifest.background) {
      manifest.background = {};
    }
    const oldBackgroundScript = manifest.background.service_worker;
    manifest.background.service_worker = `assets/${backgroundScript}`;
    console.log(`✓ Updated background script in manifest.json from ${oldBackgroundScript || 'none'} to assets/${backgroundScript}`);
  } else {
    console.warn(`⚠️ No background script found`);
  }

  if (contentScript) {
    console.log(`✓ Found content script: ${contentScript}`);
    // 添加内容脚本配置
    manifest.content_scripts = [
      {
        matches: ['http://*/*', 'https://*/*'],
        js: ['assets/' + contentScript],
      },
    ];
    console.log(`✓ Added content script configuration to manifest.json`);
  }

  // 确保 side_panel 配置存在
  if (!manifest.side_panel) {
    manifest.side_panel = {
      default_path: 'sidepanel.html'
    };
    console.log(`✓ Added side_panel configuration to manifest.json`);
  }

  // 保存更新后的 manifest.json
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ Saved updated manifest.json`);
  console.log(`📋 Final manifest background configuration:`, manifest.background);
}

// 将 ES 模块转换为 IIFE 格式（用于背景脚本）
function convertEsModuleToIife(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`✗ File not found at ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 处理 import 语句
  content = content.replace(
    /import\s*([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g,
    (match, importedNames, modulePath) => {
      return '';
    }
  );
  
  // 处理简化的导入语句
  content = content.replace(
    /import\s*['"]([^'"]+)['"];?/g,
    (match, modulePath) => {
      return '';
    }
  );

  // 处理动态导入
  content = content.replace(/import\s*\([\s\S]*?\)/g, (match) => {
    return '{}';
  });

  // 处理 import.meta 代码
  content = content.replace(/import\.meta\.env/g, '{}');
  content = content.replace(/import\.meta\.url/g, `"file://${filePath}"`);
  content = content.replace(/import\.meta/g, '{}');
  content = content.replace(/window\.import\.meta/g, '{}');
  content = content.replace(/window\.import\.meta\.env/g, '{}');
  content = content.replace(/window\.import\.meta\.url/g, `"file://${filePath}"`);

  // 处理 export default
  content = content.replace(
    /export\s*default\s*([^;]+);?/g,
    (match, exported) => {
      return `${exported};`;
    }
  );

  // 处理 export { ... } 格式
  content = content.replace(
    /export\s*\{([^}]+)\};?/g,
    (match, exportedNames) => {
      return '';
    }
  );

  // 处理单个导出
  content = content.replace(
    /export\s+(?:const|let|var|function|class)\s+([^=]+)=?/g,
    (match, declaration) => {
      const keyword = match.match(/export\s+(const|let|var|function|class)/)[1];
      return `${keyword} ${declaration} =`;
    }
  );

  // 处理 export * from ... 格式
  content = content.replace(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g, () => {
    return '';
  });

  // 将整个文件包装在IIFE中
  content = `(function() {\n${content}\n})();`;

  // 写入转换后的内容
  fs.writeFileSync(filePath, content);
  console.log(`✓ Converted ES module to IIFE in ${filePath}`);
}

// 转换 Vite 产物到 Plasmo 格式
function convertViteToPlasmo() {
  console.log(`🚀 Starting Vite to Plasmo conversion... ${isDevMode ? '(Development Mode)' : '(Build Mode)'}`);

  // 1. 处理 HTML 文件
  if (isDevMode) {
    console.log('📁 Development mode: waiting for Vite compilation');
    
    // 清理 build 目录
    console.log('🧹 Cleaning build directory...');
    if (fs.existsSync(PLASMO_BUILD_DIR)) {
      fs.rmSync(PLASMO_BUILD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(PLASMO_BUILD_DIR, { recursive: true });
    console.log('✓ Cleaned build directory');
    
    // 检查 Vite 编译产物是否存在
    const viteDistPopupHtml = path.join(VITE_DIST_DIR, 'src', 'entrypoints', 'popup', 'index.html');
    const viteDistSidepanelHtml = path.join(VITE_DIST_DIR, 'src', 'entrypoints', 'sidepanel', 'index.html');
    
    if (fs.existsSync(viteDistPopupHtml)) {
      console.log('✓ Vite compilation detected, using built artifacts');
      processHtmlFile(viteDistPopupHtml, path.join(PLASMO_BUILD_DIR, 'popup.html'));
      
      const assetsDir = path.join(VITE_DIST_DIR, 'assets');
      if (fs.existsSync(assetsDir)) {
        const plasmoAssetsDir = path.join(PLASMO_BUILD_DIR, 'assets');
        copyDir(assetsDir, plasmoAssetsDir);
        console.log('✓ Copied assets to build directory');
      }
      
      const backgroundScript = getBackgroundScript();
      if (backgroundScript) {
        const buildAssetsBackgroundPath = path.join(PLASMO_BUILD_DIR, 'assets', backgroundScript);
        convertEsModuleToIife(buildAssetsBackgroundPath);
        console.log('✓ Processed background script in development mode');
      }
    }
    
    if (fs.existsSync(viteDistSidepanelHtml)) {
      processHtmlFile(viteDistSidepanelHtml, path.join(PLASMO_BUILD_DIR, 'sidepanel.html'));
      console.log('✓ Processed sidepanel.html');
    }
  } else {
    // 构建模式
    console.log('📁 Build mode: using Vite build artifacts');
    
    // 1. 处理 Vite 构建的背景脚本
    const backgroundScript = getBackgroundScript();
    if (backgroundScript) {
      const viteBackgroundPath = path.join(VITE_DIST_DIR, 'assets', backgroundScript);
      const plasmoBackgroundPath = path.join(PLASMO_STATIC_DIR, 'background', 'index.js');
      const buildAssetsBackgroundPath = path.join(PLASMO_BUILD_DIR, 'assets', backgroundScript);
      const buildBackgroundPath = path.join(PLASMO_BUILD_DIR, 'static', 'background', 'index.js');

      copyFile(viteBackgroundPath, plasmoBackgroundPath);
      copyFile(viteBackgroundPath, buildAssetsBackgroundPath);
      copyFile(viteBackgroundPath, buildBackgroundPath);

      convertEsModuleToIife(plasmoBackgroundPath);
      convertEsModuleToIife(buildAssetsBackgroundPath);
      convertEsModuleToIife(buildBackgroundPath);
    }

    // 2. 处理 Vite 构建的 sidepanel 脚本
    const sidepanelScript = getSidepanelScript();
    if (sidepanelScript) {
      const viteSidepanelPath = path.join(VITE_DIST_DIR, 'assets', sidepanelScript);
      const plasmoSidepanelPath = path.join(PLASMO_STATIC_DIR, 'sidepanel', 'index.js');
      const buildAssetsSidepanelPath = path.join(PLASMO_BUILD_DIR, 'assets', sidepanelScript);
      const buildSidepanelPath = path.join(PLASMO_BUILD_DIR, 'static', 'sidepanel', 'index.js');

      fs.mkdirSync(path.dirname(plasmoSidepanelPath), { recursive: true });
      fs.mkdirSync(path.dirname(buildSidepanelPath), { recursive: true });

      copyFile(viteSidepanelPath, plasmoSidepanelPath);
      copyFile(viteSidepanelPath, buildAssetsSidepanelPath);
      copyFile(viteSidepanelPath, buildSidepanelPath);

      convertEsModuleToIife(plasmoSidepanelPath);
      convertEsModuleToIife(buildAssetsSidepanelPath);
      convertEsModuleToIife(buildSidepanelPath);
    }

    // 3. 处理并复制 Vite 构建的 HTML 文件
    const popupHtmlPath = path.join(VITE_DIST_DIR, 'src', 'entrypoints', 'popup', 'index.html');
    const sidepanelHtmlPath = path.join(VITE_DIST_DIR, 'src', 'entrypoints', 'sidepanel', 'index.html');

    if (fs.existsSync(popupHtmlPath)) {
      processHtmlFile(popupHtmlPath, path.join(PLASMO_BUILD_DIR, 'popup.html'));
      console.log('✓ Processed popup.html');
    }

    if (fs.existsSync(sidepanelHtmlPath)) {
      processHtmlFile(sidepanelHtmlPath, path.join(PLASMO_BUILD_DIR, 'sidepanel.html'));
      console.log('✓ Processed sidepanel.html');
    } else {
      console.warn('⚠️ sidepanel.html not found in Vite dist directory');
      const srcSidepanelHtml = path.join(SRC_DIR, 'entrypoints', 'sidepanel', 'index.html');
      if (fs.existsSync(srcSidepanelHtml)) {
        fs.copyFileSync(srcSidepanelHtml, path.join(PLASMO_BUILD_DIR, 'sidepanel.html'));
        console.log('✓ Copied sidepanel.html from src directory');
      }
    }

    // 4. 复制 Vite 构建的所有资源
    const assetsDir = path.join(VITE_DIST_DIR, 'assets');
    if (fs.existsSync(assetsDir)) {
      const plasmoAssetsDir = path.join(PLASMO_BUILD_DIR, 'assets');
      copyDir(assetsDir, plasmoAssetsDir);
    }

    // 5. 转换 assets 目录下的所有脚本文件
    const buildAssetsDir = path.join(PLASMO_BUILD_DIR, 'assets');
    if (fs.existsSync(buildAssetsDir)) {
      const files = fs.readdirSync(buildAssetsDir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const filePath = path.join(buildAssetsDir, file);
          convertEsModuleToIife(filePath);
        }
      }
    }
  }

  // 6. 更新 manifest.json
  updateManifest();
  console.log('✓ Updated manifest.json with latest background script');

  console.log('🎉 Vite to Plasmo conversion completed!');
}

// 运行转换脚本
convertViteToPlasmo();

// 开发模式下的额外处理
if (isDevMode) {
  console.log('✅ Development mode conversion completed!');
  console.log('🔄 Watching for file changes...');
}
