# @delight-rpc/http-server

## Install

```sh
npm install --save @delight-rpc/http-server
# or
yarn add @delight-rpc/http-server
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
  api: IAPI
, options: { loggerLevel: Level }
): http.Server
```
