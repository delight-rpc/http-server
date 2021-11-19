import { startService, stopService, getAddress } from '@test/utils'
import { fetch } from 'extra-fetch'
import { get, post } from 'extra-request'
import { url, pathname, json } from 'extra-request/lib/es2018/transformers'
import { createClient, MethodNotAvailable } from 'delight-rpc'
import { getErrorPromise } from 'return-style'

interface API {
  echo(message: string): string
}

const api: API = {
  echo(message) {
    return message
  }
}

beforeEach(() => startService(api))
afterEach(stopService)

describe('server', () => {
  test('invoke method', async () => {
    const client = createClient<API>(async jsonRpc => {
      const res = await fetch(post(
        url(getAddress())
      , json(jsonRpc)
      ))

      return await res.json()
    })

    const result = await client.echo('hello')

    expect(result).toBe('hello')
  })

  test('invoke non-existent method', async () => {
    const client = createClient<API>(async jsonRpc => {
      const res = await fetch(post(
        url(getAddress())
      , json(jsonRpc)
      ))

      return await res.json()
    })

    // @ts-ignore
    const err = await getErrorPromise(client.typo('hello'))

    expect(err).toBeInstanceOf(MethodNotAvailable)
  })

  test('health check endpoint', async () => {
    const result = await fetch(get(
      url(getAddress())
    , pathname('/health')
    ))

    expect(result.status).toBe(200)
    expect(await result.text()).toBe('OK')
  })
})
