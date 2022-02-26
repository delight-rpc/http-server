import * as DelightRPC from 'delight-rpc'
import { Level, createCustomLogger } from './logger'
import { countup } from 'extra-generator'
export { Level } from './logger'
import fastify, { FastifyInstance } from 'fastify'

export function createServer<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, options: {
    loggerLevel: Level
  , healthCheckEndpoint?: boolean
  , parameterValidators?: DelightRPC.ParameterValidators<IAPI>
  , version?: `${number}.${number}.${number}`
  }
): FastifyInstance {
  const counter = countup(1, Infinity)
  const logger = createCustomLogger(options.loggerLevel)

  const server = fastify()

  server.addHook('onRequest', async (req, reply) => {
    reply.headers({ 'Cache-Control': 'no-store' })
  })

  if (options.healthCheckEndpoint) {
    server.get('/health', async (req, reply) => {
      return 'OK'
    })
  }

  server.post('/', async (req, reply) => {
    const request = req.body
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

      reply.status(200).send(result)
    } else {
      reply.status(400).send('The payload is not a valid Delight RPC request.')
    }
  })

  return server
}
