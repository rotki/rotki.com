import { type ConsolaOptions, consola } from 'consola';

export const logger = consola;

export function useLogger(tag?: string, options: Partial<ConsolaOptions> = {}) {
  return tag ? logger.create(options).withTag(tag) : logger;
}
