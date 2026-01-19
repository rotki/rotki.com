import { consola, type ConsolaOptions } from 'consola';

export const logger = consola;

if (import.meta.dev) {
  logger.level = 5;
}

export function useLogger(tag?: string, options: Partial<ConsolaOptions> = {}): typeof logger {
  const instanceId = import.meta.server ? (process.env.pm_id ?? process.env.NODE_APP_INSTANCE) : undefined;
  const fullTag = instanceId && tag ? `${instanceId}:${tag}` : tag;
  return fullTag ? logger.create(options).withTag(fullTag) : logger;
}
