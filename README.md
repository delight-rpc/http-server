# @delight-rpc/http-server
The HTTP server implementation of [delight-rpc],
it needs to be used with the client library [@delight-rpc/http-client].

[delight-rpc]: https://www.npmjs.com/package/delight-rpc
[@delight-rpc/http-client]: https://www.npmjs.com/package/@delight-rpc/http-client

## Install
```sh
npm install --save @delight-rpc/http-server
# or
yarn add @delight-rpc/http-server
```

## Usage
```ts
// api.d.ts
interface IAPI {
  echo(message: string): string
}

// server.ts
const api: IAPI = {
  echo(message) {
    return message
  }
}

const server = createServer(api, {
  loggerLevel: Level.None
, healthCheckEndpoint: true
})

server.listen(8080, address => console.log(address))
```

## API
```ts
enum Level {
  Trace
, Debug
, Info
, Warn
, Error
, Fatal
, None
}
```

### createServer
```ts
function createServer<IAPI extends object>(
  api: DelightRPC.ImplementationOf<IAPI>
, options?: {
    loggerLevel?: Level = Level.None
    cors?: boolean = false
    healthCheckEndpoint?: boolean = false
    parameterValidators?: DelightRPC.ParameterValidators<IAPI>
    version?: `${number}.${number}.${number}`
    ownPropsOnly?: boolean
    channel?: string | RegExp | AnyChannel
  }
): FastifyInstance
```
