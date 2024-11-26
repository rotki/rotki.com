import {
  RiAccountCircleLine,
  RiAppleLine,
  RiArrowDownSLine,
  RiArrowDropRightLine,
  RiArrowLeftLine,
  RiArrowRightCircleLine,
  RiArrowRightLine,
  RiArrowUpSLine,
  RiBankCardLine,
  RiBankLine,
  RiBarChart2Line,
  RiBitCoinLine,
  RiCalendarTodoLine,
  RiChat1Line,
  RiChatSmile2Line,
  RiCloseLine,
  RiCoinLine,
  RiCoinsLine,
  RiComputerLine,
  RiDatabaseLine,
  RiDeleteBin5Line,
  RiDiscordLine,
  RiDownloadCloud2Line,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiGithubLine,
  RiHandCoinLine,
  RiInformationLine,
  RiLightbulbLine,
  RiLink,
  RiLinksLine,
  RiLockLine,
  RiLogoutBoxRLine,
  RiMailSendLine,
  RiMapPinLine,
  RiMenuLine,
  RiMoneyDollarCircleLine,
  RiOpenSourceLine,
  RiPaypalLine,
  RiPieChartLine,
  RiRefreshLine,
  RiSearchLine,
  RiTimer2Line,
  RiTwitterXLine,
  RiUserLocationLine,
  RiVipCrownLine,
  RiWindowsLine,
  createRui,
} from '@rotki/ui-library';
import { defineNuxtPlugin } from '#app';
import '@fontsource/roboto/latin.css';

export default defineNuxtPlugin((nuxtApp) => {
  const RuiPlugin = createRui({
    theme: {
      icons: [
        RiAppleLine,
        RiArrowDropRightLine,
        RiArrowLeftLine,
        RiArrowRightLine,
        RiArrowRightCircleLine,
        RiArrowDownSLine,
        RiArrowUpSLine,
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
        RiTwitterXLine,
        RiUserLocationLine,
        RiWindowsLine,
        RiBankCardLine,
        RiBankLine,
        RiMoneyDollarCircleLine,
        RiCalendarTodoLine,
        RiHandCoinLine,
        RiChatSmile2Line,
        RiRefreshLine,
        RiFileCopyLine,
        RiVipCrownLine,
        RiInformationLine,
        RiAccountCircleLine,
        RiMapPinLine,
        RiChat1Line,
        RiOpenSourceLine,
        RiComputerLine,
        RiDatabaseLine,
        RiBitCoinLine,
        RiPieChartLine,
        RiCoinsLine,
        RiBarChart2Line,
        RiDeleteBin5Line,
        RiCoinLine,
        RiPaypalLine,
        RiSearchLine,
        RiLink,
        RiLockLine,
        RiLinksLine,
      ],
      mode: 'light',
    },
  });

  nuxtApp.vueApp.use(RuiPlugin);
});
