import { Wrapper } from "https://raw.githubusercontent.com/timreichen/WebSocket/master/Wrapper.ts"

/// <reference lib="https://raw.githubusercontent.com/microsoft/TypeScript/master/lib/lib.dom.d.ts" />

export class Client extends Wrapper {
	path: string
	protocols: string | string[]
	constructor(path: string, protocols?: string | string[]) {
		super({
			send: () => {},
			close: () => {},
			isClosed: () => { return true },
		})
		this.path = path
		this.protocols = protocols
		this.newConnection(this.path, this.protocols)
	}
	private newConnection(path: string, protocols?: string | string[]) {
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
		ws.binaryType = "arraybuffer"
		ws.addEventListener("message", event => this.onmessage(event.data))
		ws.addEventListener("open", () => this.onopen())
		ws.addEventListener("close", event => this.onclose(event))
		ws.addEventListener("error", error => this.onerror(error))
	}
	reconnect(timeout = 1000) {
		setTimeout(() => {
			if (this.init.isClosed()) {
				this.reconnect(timeout)
			}
		}, timeout)
		this.newConnection(this.path, this.protocols)
	}
}