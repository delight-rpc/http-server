import { createServer, Level } from '@src/http-server.js'

let server: ReturnType<typeof createServer>[0]
let close: ReturnType<typeof createServer>[1]
let address: string

export function getAddress() {
  return address
}

export async function startService(api: object): Promise<void> {
  [server, close] = createServer(api, {
    loggerLevel: Level.None
  , healthCheckEndpoint: true
  })
  address = await server.listen()
}

export async function stopService(): Promise<void> {
  close()
  await server.close()
}
