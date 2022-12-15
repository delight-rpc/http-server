import { createServer, Level } from '@src/http-server'

let server: ReturnType<typeof createServer>
let address: string

export function getAddress() {
  return address
}

export async function startService(api: object): Promise<void> {
  server = createServer(api, {
    loggerLevel: Level.None
  , healthCheckEndpoint: true
  })
  address = await server.listen()
}

export async function stopService(): Promise<void> {
  await server.close()
}
