import * as http from 'http'
import * as DelightRPC from 'delight-rpc'
import { RequestHandler, json, createError } from 'micro'
import micro from 'micro'
import { Level, createCustomLogger } from './logger'
import { countup } from 'extra-generator'
export { Level } from './logger'

export function createServer<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, options: {
    loggerLevel: Level
  , healthCheckEndpoint?: boolean
  , parameterValidators?: DelightRPC.ParameterValidators<IAPI>
  , version?: `${number}.${number}.${number}`
  }
): http.Server {
  const counter = countup(1, Infinity)
  const logger = createCustomLogger(options.loggerLevel)

  const handler: RequestHandler = async (req, res) => {
    res.setHeader('cache-control', 'no-store')
    if (options.healthCheckEndpoint && req.url === '/health') {
      return 'OK'
    }

    const request = await json(req)
    if (DelightRPC.isRequest(request)) {
      // https://github.com/microsoft/TypeScript/issues/33353
      const id = counter.next().value as number

      const startTime = Date.now()
      const result = await DelightRPC.createResponse(
        api
      , request
      , options.parameterValidators
      , options.version
      )
      const endTime = Date.now()

      logger.info({
        id
      , message: JSON.stringify(request.method)
      , timestamp: endTime
      , elapsed: endTime - startTime
      })

      return result
    } else {
      throw createError(400, 'The payload is not a valid Delight RPC request.')
    }
  }

  return new http.Server(micro(handler))
}
