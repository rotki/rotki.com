import {
  RiDiscordLine,
  RiExternalLinkLine,
  RiGithubLine,
  RiLogoutBoxRLine,
  RiMailSendLine,
  RiTwitterLine,
  RuiPlugin,
} from '@rotki/ui-library';
import { defineNuxtPlugin } from '#app';
import '@fontsource/roboto/latin.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(RuiPlugin, {
    mode: 'light',
    icons: [
      RiDiscordLine,
      RiExternalLinkLine,
      RiGithubLine,
      RiLogoutBoxRLine,
      RiMailSendLine,
      RiTwitterLine,
    ],
  });
});
