import {
  RiDiscordLine,
  RiExternalLinkLine,
  RiGithubLine,
  RiMailSendLine,
  RiTwitterLine,
  RuiPlugin,
} from '@rotki/ui-library';
import '@fontsource/roboto/latin.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(RuiPlugin, {
    mode: 'light',
    icons: [
      RiExternalLinkLine,
      RiGithubLine,
      RiTwitterLine,
      RiDiscordLine,
      RiMailSendLine,
    ],
  });
});
