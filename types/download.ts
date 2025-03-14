export interface DownloadItemSingle {
  platform: string;
  url?: string;
  icon?: 'lu-os-apple' | 'lu-os-windows';
  image?: string;
  command?: string;
}

export interface DownloadItemGroup extends DownloadItemSingle {
  group: true;
  items: {
    name: string;
    url: string;
  }[];
}

export type DownloadItem = DownloadItemSingle | DownloadItemGroup;
