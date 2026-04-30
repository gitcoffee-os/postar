import { createApp } from 'vue';
import PostarModal from '~/content/components/PostarModal';
import { getReaderData } from '~/media/parser';
import { debounce as debounceUtils } from '@gitcoffee/postbot-utils';
import { initMessageEventListener } from '~/content/messageEventListener';
import { handleMessage } from '~/content/messageHandler';
import { setupI18n } from '~/locales';
import 'ant-design-vue/dist/reset.css';

export default {
  matches: ['<all_urls>'],
  main() {
    initMessageEventListener();

    const app = createApp(PostarModal);

    setupI18n(app);

    const container = document.createElement('div');
    container.id = 'postar-container';
    document.body.appendChild(container);

    app.mount(container);

    window.addEventListener('load', () => {
      const data = getReaderData();
      const { content, contentImages } = data;

      chrome.runtime.sendMessage({
        type: 'IMAGE_DETECTED',
        contentImages: Array.from(contentImages).map((img: any) => ({ src: img.src })),
      });

      chrome.runtime.sendMessage({
        type: 'CONTENT_DETECTED',
        content: content,
      });
    });

    const handleSelectionChange = debounceUtils.debounce(() => {
      const selection = window.getSelection();

      const hasSelection = selection && selection.rangeCount > 0 && selection.toString().trim().length > 0;

      const selectionData: { selectionContent: string; selectionImages: { src: string }[] } = {
        selectionContent: '',
        selectionImages: [],
      };

      if (hasSelection) {
        try {
          const range = selection!.getRangeAt(0);

          const selectedHTMLForContent = range.cloneContents();
          const selectedHTMLForImages = range.cloneContents();

          const serializer = new XMLSerializer();
          const htmlContent = serializer.serializeToString(selectedHTMLForContent);
          selectionData.selectionContent = htmlContent;

          const tempDiv = document.createElement('div');
          tempDiv.appendChild(selectedHTMLForImages);
          const imgElements = tempDiv.querySelectorAll('img');
          const selectedImages = Array.from(imgElements).map((img) => ({ src: img.src }));
          selectionData.selectionImages = selectedImages;
        } catch (error) {
          console.error('Error with range operations:', error);
        }
      }

      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'SELECTION_DATA',
          ...selectionData,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          hasSelection: hasSelection,
        });
      }
    }, 300);

    document.addEventListener('selectionchange', () => {
      handleSelectionChange();
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      handleMessage(request, sender, sendResponse);
      return true;
    });
  }
};
