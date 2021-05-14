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

```ts
function createServer<IAPI extends object>(
  API: IAPI
, options: { loggerLevel: Level }
): http.Server
```
