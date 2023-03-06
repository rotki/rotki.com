import logger from 'loglevel'

if (process.env.NODE_ENV === 'development') {
  logger.setDefaultLevel('DEBUG')
}

export { logger }
