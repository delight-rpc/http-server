import { beforeEach, afterEach, describe, test, expect } from 'vitest'
import { startService, stopService, getAddress } from '@test/utils.js'
import { fetch } from 'extra-fetch'
import { get, post } from 'extra-request'
import { url, pathname, json } from 'extra-request/transformers'
import { ClientProxy, createAbort, createClient, ImplementationOf, MethodNotAvailable } from 'delight-rpc'
import { getErrorPromise } from 'return-style'
import { assert, JSONValue } from '@blackglory/prelude'
import { delay } from 'extra-promise'
import { AbortError } from 'extra-abort'
import { setTimeout } from 'extra-timers'

interface IAPI {
  echo(message: string): string
  error(message: string): never
  loop(): never
}

const api: ImplementationOf<IAPI> = {
  echo(message) {
    return message
  }
, error(message) {
    throw new Error(message)
  }
, async loop(signal) {
    assert(signal)

    while (!signal.aborted) {
      await delay(100)
    }

    throw signal.reason
  }
}

beforeEach(() => startService(api))
afterEach(stopService)

describe('server', () => {
  describe('invoke method', () => {
    test('result', async () => {
      const client = createHTTPClient()

      const result = await client.echo('foo')

      expect(result).toBe('foo')
    })

    test('error', async () => {
      const client = createHTTPClient()

      const err = await getErrorPromise(client.error('foo'))

      expect(err).toBeInstanceOf(Error)
      expect(err?.message).toBe('foo')
    })

    test('abort', async () => {
      const client = createHTTPClient()
      const controller = new AbortController()

      const promise = getErrorPromise(client.loop(controller.signal))
      setTimeout(1000, () => controller.abort())
      const err = await promise

      expect(err).toBeInstanceOf(AbortError)
    })

    test('edge: non-existent method', async () => {
      const client = createHTTPClient()

      // @ts-expect-error typo
      const err = await getErrorPromise(client.typo('foo'))

      expect(err).toBeInstanceOf(MethodNotAvailable)
    })
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

function createHTTPClient(): ClientProxy<IAPI> {
  return createClient<IAPI>(async (request, signal) => {
    signal?.addEventListener('abort', async () => {
      const abort = createAbort(request.id, request.channel)

      const res = await fetch(post(
        url(getAddress())
      , json(abort as JSONValue)
      ))

      await res.text()
    })

    const res = await fetch(post(
      url(getAddress())
    , json(request as JSONValue)
    ))

    return await res.json()
  })
}
