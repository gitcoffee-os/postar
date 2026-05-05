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
export const initCopyEvent = () => {
  document.addEventListener('copy', (event) => {
    const clipboardData = event.clipboardData || (window as any).clipboardData;

    if (clipboardData) {
      const text = clipboardData.getData('text/plain');
      const html = clipboardData.getData('text/html');

      let contentImages: string[] = [];
      if (html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const imgElements = doc.querySelectorAll('img');
        imgElements.forEach(img => {
          contentImages.push(img.src);
        });
      }

      if (contentImages.length > 0) {
        console.log('Copied image links:', contentImages);
      } else {
        console.log('No images in copied content');
      }
    }
  });
}
