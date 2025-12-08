interface GithubReleaseAsset {
  readonly name: string;
  readonly browser_download_url: string;
}

export interface GithubRelease {
  readonly tag_name: string;
  readonly assets: GithubReleaseAsset[];
}
