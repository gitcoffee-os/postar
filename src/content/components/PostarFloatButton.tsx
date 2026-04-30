import { createFloatButton } from '@gitcoffee/postbot-content-ui';
import { useTranslation } from '~/locales';
import iconUrl from '~/assets/icon.png';

const PostarFloatButton = createFloatButton({
  storageKey: 'postar-float-button-position',
  iconUrl,
  syncLabel: 'Sync',
  tooltipLabel: 'Postar Content Sync Assistant',
});

export default PostarFloatButton;
