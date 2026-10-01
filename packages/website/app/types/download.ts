interface DownloadItemBase {
  /** Upper-case key matched against the visitor's OS, e.g. `MAC`. */
  platform: string;
  /** Human-readable name shown on the page, e.g. `macOS`. */
  label: string;
  /** One line under the name saying what you get, e.g. `Apple Silicon or Intel`. */
  caption?: string;
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
    /** Full name used for the accessible label, e.g. `macOS Intel`. */
    name: string;
    /**
     * Value sent as `platform` in the `download_click` event, e.g. `MAC Intel`.
     * Kept apart from `name` so renaming a button does not split the download stats.
     */
    analyticsKey: string;
    /** Short name shown on the button inside the platform card, e.g. `Intel`. */
    variant: string;
    url: string;
  }[];
}

export type DownloadItem = DownloadItemSingle | DownloadItemGroup;
