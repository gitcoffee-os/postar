import { initPostar } from '~/api';
import { initPostarEvents } from '../events';
import { initPlugins } from '../plugins';
import { handleMessage } from '../background';
import { createBackgroundListener } from '@gitcoffee/postbot-background';

const backgroundMain = () => {
  console.log('Postar background script loaded');

  initPostar();
  initPlugins();
  initPostarEvents();

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err: any) => {
    console.error('Failed to set sidePanel behavior:', err);
  });

  createBackgroundListener(handleMessage);
};

export default {
  main() {
    backgroundMain();
  }
};
