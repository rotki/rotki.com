export const LOCAL_CONTENT_PREFIX = '/local';

export const GITHUB_CONTENT_PREFIX = '/remote';

export const CONTENT_PREFIX
  = process.env.NODE_ENV === 'development'
    ? LOCAL_CONTENT_PREFIX
    : GITHUB_CONTENT_PREFIX;
