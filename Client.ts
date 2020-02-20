import { Wrapper } from "https://raw.githubusercontent.com/timreichen/WebSocket/master/Wrapper.ts"

declare type WebSocket = any

export class Client extends Wrapper {
	path: string
	protocols: string | string[]
	constructor(path: string, protocols?: string | string[]) {
		const { ws, init } = Client.newConnection(path, protocols)
		super(init)
		this.path = path
		this.protocols = protocols
	}
	private static newConnection(path: string, protocols?: string | string[]) {
		const ws = new WebSocket(path, protocols)
		const init = {
			send: data => {
				if (ws.readyState === WebSocket.CLOSED) { return }
				ws.send(data)
			},
			close: () => {
				if (ws.readyState === WebSocket.CLOSED) { return }
				ws.close()
			},
			isClosed: () => ws.readyState === WebSocket.CLOSED
		}
		ws.addEventListener("message", event => this.onmessage(event.data))
		ws.addEventListener("open", () => this.onopen())
		ws.addEventListener("close", event => this.onclose(event))
		ws.addEventListener("error", error => this.onerror(error))
		ws.binaryType = "arraybuffer"
		return { ws, init }
	}
	reconnect(timeout = 1000) {
		setTimeout(() => {
			if (this.init.isClosed()) {
				this.reconnect(timeout)
			}
		}, timeout)
		Client.newConnection(this.path, this.protocols)
	}
}