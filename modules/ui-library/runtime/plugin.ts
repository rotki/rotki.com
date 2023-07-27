import {
  RiAppleLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiDiscordLine,
  RiDownloadCloud2Line,
  RiExternalLinkLine,
  RiGithubLine,
  RiLogoutBoxRLine,
  RiMailSendLine,
  RiTwitterLine,
  RiWindowsLine,
  RuiPlugin,
} from '@rotki/ui-library';
import { defineNuxtPlugin } from '#app';
import '@fontsource/roboto/latin.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(RuiPlugin, {
    mode: 'light',
    icons: [
      RiAppleLine,
      RiArrowLeftLine,
      RiArrowRightLine,
      RiDiscordLine,
      RiDownloadCloud2Line,
      RiExternalLinkLine,
      RiGithubLine,
      RiLogoutBoxRLine,
      RiMailSendLine,
      RiTwitterLine,
      RiWindowsLine,
    ],
  });
});
