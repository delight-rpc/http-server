import * as http from 'http'
import { isJsonRpcRequest } from '@blackglory/types'
import { createResponse } from 'delight-rpc'
import { RequestHandler, json, createError } from 'micro'
import micro from 'micro'
import { Counter } from '@utils/counter'
import { Level, createCustomLogger } from './logger'
export { Level } from './logger'

export function createServer<IAPI extends object>(
  API: IAPI
, options: { loggerLevel: Level }
): http.Server {
  const counter = new Counter()
  const logger = createCustomLogger(options.loggerLevel)

  const handler: RequestHandler = async req => {
    const rpcReq = await json(req)
    if (isJsonRpcRequest(rpcReq)) {
      const id = counter.next()
      const startTime = Date.now()
      const result = await createResponse(API, rpcReq)
      const endTime = Date.now()

      logger.info(() => ({
        id
      , message: rpcReq.method
      , timestamp: endTime
      , elapsed: endTime - startTime
      }))

      return result
    } else {
      throw createError(400, 'The payload is not a valid JSON-RPC 2.0 object')
    }
  }

  return new http.Server(micro(handler))
}
