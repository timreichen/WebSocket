import { Wrapper } from "./Wrapper.ts"

/// <reference lib="https://raw.githubusercontent.com/microsoft/TypeScript/master/lib/lib.dom.d.ts" />

declare var WebSocket: any

export class Client extends Wrapper {
	private path: string
	private protocols: string | string[]
	constructor(path: string, protocols?: string | string[]) {
		super()
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
			isOpen: () => ws.readyState === WebSocket.OPEN
		}
		this.connect(init)
		ws.binaryType = "arraybuffer"
		ws.addEventListener("message", event => this.onmessage(event.data))
		ws.addEventListener("open", () => this.onopen())
		ws.addEventListener("close", event => this.onclose(event))
		ws.addEventListener("error", error => this.onerror(error))
	}

	reconnect(timeout = 1000) {
		return new Promise((resolve, reject) => {
			this.newConnection(this.path, this.protocols)
			setTimeout(() => {
				if (this.init.isOpen()) {
					this.reconnect(timeout)
					.then(resolve)
				} else {
					// success
					resolve()
				}
			}, timeout)
		})
	}

}