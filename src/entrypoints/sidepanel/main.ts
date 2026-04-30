import { createApp } from 'vue';
import Sidepanel from './Sidepanel.vue';
import { setupI18n } from '~/locales';
import { setupStore } from '~/stores';
import 'ant-design-vue/dist/reset.css';

const app = createApp(Sidepanel);

setupStore(app);

setupI18n(app, 'en').then(() => {
  app.mount('#app');
});
