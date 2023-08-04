import {
  RiAppleLine,
  RiArrowDropRightLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
  RiDiscordLine,
  RiDownloadCloud2Line,
  RiExternalLinkLine,
  RiGithubLine,
  RiLightbulbLine,
  RiLogoutBoxRLine,
  RiMailSendLine,
  RiMenuLine,
  RiTimer2Line,
  RiTwitterLine,
  RiUserLocationLine,
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
      RiArrowDropRightLine,
      RiArrowLeftLine,
      RiArrowRightLine,
      RiCloseLine,
      RiDiscordLine,
      RiDownloadCloud2Line,
      RiExternalLinkLine,
      RiGithubLine,
      RiLightbulbLine,
      RiLogoutBoxRLine,
      RiMailSendLine,
      RiMenuLine,
      RiTimer2Line,
      RiTwitterLine,
      RiUserLocationLine,
      RiWindowsLine,
    ],
  });
});
