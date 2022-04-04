import * as DelightRPC from 'delight-rpc'
import { Logger, TerminalTransport, Level } from 'extra-logger'
import fastify, { FastifyInstance } from 'fastify'
import cors from 'fastify-cors'

export { Level } from 'extra-logger'

export function createServer<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, options: {
    loggerLevel: Level
  , cors?: boolean
  , healthCheckEndpoint?: boolean
  , parameterValidators?: DelightRPC.ParameterValidators<IAPI>
  , version?: `${number}.${number}.${number}`
  }
): FastifyInstance {
  const logger = new Logger({
    level: options.loggerLevel
  , transport: new TerminalTransport({})
  })

  const server = fastify()

  server.addHook('onRequest', async (req, reply) => {
    reply.headers({ 'Cache-Control': 'no-store' })
  })

  if (options.cors) {
    server.register(cors, { origin: true })
  }

  if (options.healthCheckEndpoint) {
    server.get('/health', async (req, reply) => 'OK')
  }

  server.post('/', async (req, reply) => {
    const request = req.body
    if (DelightRPC.isRequest(request) || DelightRPC.isBatchRequest(request)) {
      const response = await logger.infoTime(
        () => {
          if (DelightRPC.isRequest(request)) {
            return request.method.join('.')
          } else {
            return request.requests.map(x => x.method.join('.')).join(', ')
          }
        }
      , () => DelightRPC.createResponse(
          api
        , request
        , options.parameterValidators
        , options.version
        )
      )

      reply.status(200).send(response)
    } else {
      reply.status(400).send('The payload is not a valid Delight RPC request.')
    }
  })

  return server
}
