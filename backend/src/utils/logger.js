function format(level, message, context = {}) {
  return JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...context,
  })
}

export const logger = {
  info(message, context) {
    console.log(format('info', message, context))
  },
  warn(message, context) {
    console.warn(format('warn', message, context))
  },
  error(message, context) {
    console.error(format('error', message, context))
  },
}
