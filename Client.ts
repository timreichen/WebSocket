import { Wrapper } from "./Wrapper.ts"

/// <reference lib="https://raw.githubusercontent.com/microsoft/TypeScript/master/lib/lib.dom.d.ts" />

declare var WebSocket: any

export class Client extends Wrapper {
	private path: string
	private protocols: string | string[]
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
		ws.addEventListener("message", event => super.onmessage(event.data))
		ws.addEventListener("open", () => super.onopen())
		ws.addEventListener("close", event => super.onclose(event))
		ws.addEventListener("error", error => super.onerror(error))
	}

	reconnect(timeout = 1000) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if (super.init.isClosed()) {
					this.reconnect(timeout)
				} else {
					// success
					resolve()
				}
			}, timeout)
			this.newConnection(this.path, this.protocols)
		})
	}

}