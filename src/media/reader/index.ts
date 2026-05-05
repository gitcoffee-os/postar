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
import { Readability } from '@mozilla/readability';

import { state } from '~/content/components/postar.data';

import { getImgElements } from '~/media/handler';

import { defaultReader } from './default.reader';

const readers: Record<string, () => any> = {
    'default': defaultReader,
};

const readerContent = () => {
    let contentData: any = {
        title: '',
        content: '',
        contentImages: []
    };
    try {
        const documentClone = document.cloneNode(true) as Document;
        const postarContainer = documentClone.getElementById('postar-container');
        if (postarContainer) {
            postarContainer.remove();
        }
        const readability = new Readability(documentClone);
        const parsedData = readability.parse();
        if (parsedData) {
            contentData = parsedData;
        }
    } catch (e) {
        // Silent error handling
    }
    return contentData;
}

const readerSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedHTML = range.cloneContents();
        return selectedHTML;
    }
    return null;
}

const mergeData = (data: any, readerContent: any) => {
    if (readerContent.title) {
        data.title = readerContent.title;
    }
    if (readerContent.content) {
        data.content = readerContent.content;
    }
    if (readerContent.contentImages) {
        data.contentImages = readerContent.contentImages;
    }
}

export const reader = () => {
    const readabilityData = readerContent();

    let data: any = {
        title: '',
        content: '',
        contentImages: [],
    };
    let contentImages: any[] = [];

    if (readabilityData && readabilityData.content) {
        data = readabilityData;
    }

    const selectionElements = readerSelection();
    if (selectionElements && selectionElements.textContent) {
        const docFragment = selectionElements;
        const serializer = new XMLSerializer();
        const htmlContent = serializer.serializeToString(docFragment);

        data.content = htmlContent;
    } else {
        const domain = window.location.hostname;
        const hasCustomReader = readers[domain] && readers[domain] !== readers['default'];

        if (hasCustomReader) {
            const customReader = readers[domain];
            const readerContent = customReader();
            mergeData(data, readerContent);
        } else if (!data.content) {
            const fallbackReader = readers['default'];
            if (fallbackReader) {
                const readerContent = fallbackReader();
                mergeData(data, readerContent);
            }
        }
    }

    if (data.content) {
        const imgElements = getImgElements(data.content);
        if (imgElements && imgElements.length > 0) {
            contentImages = imgElements;
        }
    }

    if (data.contentImages && data.contentImages.length > 0) {
        contentImages = data.contentImages;
    }

    return {
        title: data.title,
        content: data.content,
        contentImages: contentImages,
    };
}
