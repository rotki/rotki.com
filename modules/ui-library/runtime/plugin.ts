import {
  LuBadgeDollarSign,
  LuBlockchain,
  LuCalendar,
  LuChartNoAxesColumn,
  LuChartPie,
  LuChevronDown,
  LuChevronRight,
  LuChevronUp,
  LuCircleArrowRight,
  LuCircleCheck,
  LuCircleUserRound,
  LuCircleX,
  LuCloudDownload2Fill,
  LuCodeXml,
  LuCopy,
  LuCreditCard,
  LuCrown,
  LuDatabase,
  LuDiscord,
  LuDonateFill,
  LuExternalLink,
  LuGithub,
  LuHistory,
  LuInfo,
  LuLandmark,
  LuLaptopMinimal,
  LuLayers,
  LuLightbulb,
  LuLink,
  LuLink2,
  LuLockKeyhole,
  LuLogOut,
  LuMail,
  LuMapPin,
  LuMenu,
  LuMessageCircle,
  LuOsApple,
  LuOsWindows,
  LuPaypal,
  LuRefreshCw,
  LuSearch,
  LuTimer,
  LuTrash2,
  LuX,
  LuXTwitter,
  createRui,
} from '@rotki/ui-library';
import { defineNuxtPlugin } from '#app';
import '@fontsource/roboto/latin.css';

export default defineNuxtPlugin((nuxtApp) => {
  const RuiPlugin = createRui({
    theme: {
      icons: [
        LuOsApple,
        LuOsWindows,
        LuPaypal,
        LuChevronRight,
        LuCircleArrowRight,
        LuChevronDown,
        LuChevronUp,
        LuX,
        LuDiscord,
        LuCloudDownload2Fill,
        LuExternalLink,
        LuGithub,
        LuLightbulb,
        LuLogOut,
        LuMail,
        LuMenu,
        LuTimer,
        LuXTwitter,
        LuCreditCard,
        LuLandmark,
        LuBadgeDollarSign,
        LuCalendar,
        LuDonateFill,
        LuRefreshCw,
        LuCopy,
        LuCrown,
        LuInfo,
        LuCircleUserRound,
        LuMapPin,
        LuMessageCircle,
        LuCodeXml,
        LuLaptopMinimal,
        LuDatabase,
        LuChartPie,
        LuLayers,
        LuHistory,
        LuChartNoAxesColumn,
        LuTrash2,
        LuBlockchain,
        LuSearch,
        LuLink2,
        LuLockKeyhole,
        LuLink,
        LuCircleX,
        LuCircleCheck,
      ],
      mode: 'light',
    },
  });

  nuxtApp.vueApp.use(RuiPlugin);
});
