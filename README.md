
# WebSocket

Use Websockets without thinking about the network.

## Why do I need WebSocket?

WebSocket wraps the native ECMAScript WebSocket so it can be used like an Emitter.
It is build like a Promise so return values can be awaited.

It Also includes a Server for Deno that does the same.

### WebSocket uses [Coder](https://github.com/timreichen/Coder)
Because the data gets encoded and decoded Coder, you can send any kind of data you like (see https://github.com/timreichen/Coder)

## Usage

```typescript
// Client

import { Client } from "https://raw.githubusercontent.com/timreichen/Coder/master/Client.ts"

const client = new Client("ws://localhost:1234")

client.on("open", async () => {
    const data = await client.emit("hello", "hello server") // sends hello event with data and waits for the return value
    console.log(data) // "hello client"
})

```

```typescript
// Server

import { serve } from "https://deno.land/std/http/server.ts"

const port = Deno.args[0] || "1234"
console.log(`server running on port ${port}`)
const server = serve(`:${port}`)

const wss = new WebSocketServer(server)

wss.on("open", client => {

	client.on("hello", data => {
    // sync
    return "hello client"
    // or async
    return Promise((resolve, reject) => setTimeout(() => resolve("hello client"), 1000))
	})

})


```