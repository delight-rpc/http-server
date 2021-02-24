import * as http from 'http'
import { isJsonRpcRequest } from '@blackglory/types'
import { createResponse } from 'delight-rpc'
import { RequestHandler, json, createError } from 'micro'
import micro from 'micro'

export function createServer<IAPI extends object>(API: IAPI): http.Server {
  const handler: RequestHandler = async req => {
    const rpcReq = await json(req)
    if (isJsonRpcRequest(rpcReq)) {
      return await createResponse(API, rpcReq)
    } else {
      throw createError(400, 'The payload is not a valid JSON-RPC 2.0 object')
    }
  }

  return new http.Server(micro(handler))
}
