import { consola, type ConsolaOptions } from 'consola';

export const logger = consola;

if (import.meta.dev) {
  logger.level = 5;
}

export function useLogger(tag?: string, options: Partial<ConsolaOptions> = {}) {
  return tag ? logger.create(options).withTag(tag) : logger;
}
