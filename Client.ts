import { Wrapper } from "https://raw.githubusercontent.com/timreichen/WebSocket/master/Wrapper.ts"

class Client extends Wrapper {
	path: string
	protocols: string | string[]
	constructor(path: string, protocols?: string | string[]) {
		super()
		this.path = path
		this.protocols = protocols
		this.newConnection(this.path, this.protocols)
	}
	private newConnection(path: string, protocols?: string | string[]) {
		const ws = new WebSocket(path, protocols)
		const options = {
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
		this.options = options
	}
	reconnect(timeout=1000) {
		setTimeout(() => {
			if (this.init.isClosed()) {
				this.reconnect(timeout)	
			}
		}, timeout)
		this.newConnection(this.path, this.protocols)
	}
}