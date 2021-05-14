import { createLogger, Level } from 'extra-logger'
import { isntUndefined } from '@blackglory/types'
import chalk from 'chalk'

export { Level } from 'extra-logger'

export interface IMessageLog {
  id: number
  timestamp: number
  message: string
  elapsed?: number
}

export interface IErrorLog {
  id: number
  timestamp: number
  reason: string
  elapsed?: number
}

interface IPrefix {
  level: Level
  id: number
  timestamp: number
}

export function createCustomLogger(level: Level) {
  return createLogger(level, {
    [Level.Trace]: printMessage(Level.Trace, console.log)
  , [Level.Debug]: printMessage(Level.Debug, console.log)
  , [Level.Info]: printMessage(Level.Info, console.info)
  , [Level.Warn]: printMessage(Level.Warn, console.warn)
  , [Level.Error]: printError(Level.Error, console.error)
  , [Level.Fatal]: printError(Level.Fatal, console.error)
  })
}

function printMessage(
  level: Level
, log: (...args: unknown[]) => void
): (log: IMessageLog) => void {
  return ({ id, timestamp, elapsed, message }: IMessageLog) => {
    const pre = createPrefix({ level, id, timestamp })
    const post = isntUndefined(elapsed) ? createPostfix({ elapsed }) : null

    let result = `${pre} ${message}`
    if (post) result += ' ' + post

    log(result)
  }
}

function printError(
  level: Level
, log: (...args: unknown[]) => void
): (error: IErrorLog) => void {
  return ({ id, timestamp, elapsed, reason }: IErrorLog) => {
    const pre = createPrefix({ level, id, timestamp })
    const post = isntUndefined(elapsed) ? createPostfix({ elapsed }) : null

    let result = `${pre} ${reason}`
    if (post) result += ' ' + post

    log(result)
  }
}

function createPrefix({ level, timestamp, id }: IPrefix): string {
  return `[${levelToString(level).toUpperCase()}]`
       + `[${formatDate(timestamp)}]`
       + ` #${id}`
}

function createPostfix({ elapsed }: { elapsed: number }): string {
  return formatElapsedTime(elapsed)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

function formatElapsedTime(elapsed: number): string {
  if (elapsed <= 100) {
    return chalk.green`${elapsed}ms`
  }

  if (elapsed <= 300) {
    return chalk.yellow`${elapsed}ms`
  }

  return chalk.red`${elapsed}ms`
}

function levelToString(level: Level): string {
  switch (level) {
    case Level.Info: return 'Info'
    case Level.Debug: return 'Debug'
    case Level.Warn: return 'Warn'
    case Level.Trace: return 'Trace'
    case Level.Error: return 'Error'
    case Level.Fatal: return 'Fatal'
    default: return 'None'
  }
}
