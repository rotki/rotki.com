export interface DownloadItemBase {
  platform: string;
  icon?: 'lu-os-apple' | 'lu-os-windows';
  image?: string;
  command?: string;
}

export interface DownloadItemSingle extends DownloadItemBase {
  url: string;
}

export interface DownloadItemGroup extends DownloadItemBase {
  group: true;
  items: {
    name: string;
    url: string;
  }[];
}

export type DownloadItem = DownloadItemSingle | DownloadItemGroup;
