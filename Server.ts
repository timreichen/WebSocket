import { green, blue, yellow, red } from "https://deno.land/std/fmt/colors.ts"
import { serve as httpServe, Server as HTTPServer, HTTPOptions } from "https://deno.land/std/http/server.ts"

import { acceptWebSocket, isWebSocketCloseEvent } from "https://deno.land/std/ws/mod.ts"
import { Wrapper } from "./Wrapper.ts"
import Emitter from "./Emitter.ts"

export class Server extends Emitter {
	constructor(server: HTTPServer) {
		super()
		this.connect(server)
	}
	private async connect(server) {
		for await (const req of server) {
			const ws = await this.connectWebSocket(req)
			const init = {
				close: (code, reason?) => {
					try {
						if (ws.isClosed) { return }
						ws.close(code, reason)
					} catch (error) {
						console.error(red(error))
					}
				},
				send: data => {
					if (ws.isClosed) { return }
					ws.send(new Uint8Array(data))
				},
				isClosed: () => ws.isClosed
			}
			const websocket = new Wrapper()
			websocket.connect(init)
			this.emit("open", websocket)
			for await (const event of ws.receive()) {
				if (event instanceof Uint8Array) {
					websocket.onmessage(event.buffer)
				} else if (isWebSocketCloseEvent(event)) {
					websocket.onclose(event)
				} else {
					websocket.onerror(event)
				}
			}
		}
	}

	async connectWebSocket(req) {
		try {
			const ws = await acceptWebSocket({
				conn: req.conn,
				headers: req.headers,
				bufReader: req.r,
				bufWriter: req.w
			})
			return ws
		} catch (error) {
			console.error(red("failed to accept websocket"), error)
		}
	}
}