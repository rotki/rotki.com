import { consola, type ConsolaOptions } from 'consola';

export const logger = consola;

export function useLogger(tag?: string, options: Partial<ConsolaOptions> = {}) {
  return tag ? logger.create(options).withTag(tag) : logger;
}
