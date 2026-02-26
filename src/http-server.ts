import * as DelightRPC from 'delight-rpc'
import { Logger, TerminalTransport, Level } from 'extra-logger'
import fastify, { FastifyInstance } from 'fastify'
import fastifyCORS from '@fastify/cors'
import { isNull } from '@blackglory/prelude'
import { SyncDestructor } from 'extra-defer'
import { HashMap } from '@blackglory/structures'
import { AbortController } from 'extra-abort'

export { Level } from 'extra-logger'

export function createServer<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, {
    loggerLevel = Level.None
  , healthCheckEndpoint = false
  , cors = false
  , parameterValidators
  , version
  , ownPropsOnly
  , channel
  }: {
    loggerLevel?: Level
    cors?: boolean
    healthCheckEndpoint?: boolean
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
    version?: `${number}.${number}.${number}`
    ownPropsOnly?: boolean
    channel?: string | RegExp | typeof DelightRPC.AnyChannel
  } = {}
): [server: FastifyInstance, close: () => void] {
  const destructor = new SyncDestructor()

  const channelIdToController: HashMap<
    {
      channel?: string
    , id: string
    }
  , AbortController
  > = new HashMap(({ channel, id }) => JSON.stringify([channel, id]))
  destructor.defer(abortAllPendings)

  const logger = new Logger({
    level: loggerLevel
  , transport: new TerminalTransport({})
  })

  const server = fastify({ forceCloseConnections: true })

  // 移除默认的`text/plain`解析器.
  server.removeContentTypeParser('text/plain')

  server.addHook('onRequest', async (req, reply) => {
    reply.headers({ 'Cache-Control': 'no-store' })
  })

  if (cors) {
    server.register(fastifyCORS, { origin: true })
  }

  if (healthCheckEndpoint) {
    server.get('/health', async (req, reply) => 'OK')
  }

  server.post('/', async (req, reply) => {
    const message = req.body
    if (DelightRPC.isRequest(message) || DelightRPC.isBatchRequest(message)) {
      const destructor = new SyncDestructor()

      const controller = new AbortController()
      channelIdToController.set(message, controller)
      destructor.defer(() => channelIdToController.delete(message))

      try {
        const response = await logger.infoTime(
          () => {
            if (DelightRPC.isRequest(message)) {
              return message.method.join('.')
            } else {
              return message.requests.map(x => x.method.join('.')).join(', ')
            }
          }
        , () => DelightRPC.createResponse(
            api
          , message
          , {
              parameterValidators
            , version
            , ownPropsOnly
            , channel
            , signal: controller.signal
            }
          )
        )

        if (isNull(response)) {
          return reply
            .status(400)
            .send(`The server does not support this channel.`)
        } else {
          return reply
            .status(200)
            .send(response)
        }
      } finally {
        destructor.execute()
      }
    } else if (DelightRPC.isAbort(message)) {
      if (DelightRPC.matchChannel(message, channel)) {
        channelIdToController.get(message)?.abort()
        channelIdToController.delete(message)

        return reply
          .status(204)
          .send()
      } else {
        return reply
          .status(400)
          .send(`The server does not support this channel.`)
      }
    } else {
      return reply
        .status(400)
        .send('The payload is not a valid Delight RPC request.')
    }
  })

  return [server, close]

  function close(): void {
    destructor.execute()
  }

  function abortAllPendings(): void {
    for (const controller of channelIdToController.values()) {
      controller.abort()
    }

    channelIdToController.clear()
  }
}
