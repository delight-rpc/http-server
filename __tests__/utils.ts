import { createServer, Level } from '@src/http-server'
import { isObject } from '@blackglory/types'
import { AddressInfo } from 'net'
import { assert } from '@blackglory/errors'

let server: ReturnType<typeof createServer>
let address: string

export function getAddress() {
  return address
}

export async function startService(api: object): Promise<void> {
  server = createServer(api, { loggerLevel: Level.None })
  return new Promise<void>(resolve => {
    server.listen({ host: 'localhost', port: 0 }, () => {
      const addressInfo = server.address()
      assert(isObject(addressInfo))

      address = getAddressFromAddressInfo(addressInfo)
      console.log(address)
      resolve()
    })
  })
}

export function stopService(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close(err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function getAddressFromAddressInfo(address: AddressInfo): string {
  if (address.family === 'IPv4') {
    return `http://${address.address}:${address.port}`
  } else {
    return `http://[${address.address}]:${address.port}`
  }
}
