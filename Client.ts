import { Wrapper } from "./Wrapper.ts"

/// <reference lib="https://raw.githubusercontent.com/microsoft/TypeScript/master/lib/lib.dom.d.ts" />

declare var WebSocket: any

export class Client extends Wrapper {
	private path: string
	private protocols: string | string[] | undefined
	private first: boolean
	constructor(path: string, protocols?: string | string[]) {
		super()
		this.path = path
		this.protocols = protocols
		this.first = true
		this.newConnection(this.path, this.protocols)
	}

	private async newConnection(path: string, protocols?: string | string[]) {
		return new Promise((resolve, reject) => {
			const ws = new WebSocket(path, protocols)
			
			const init = {
				send: (data: any) => {
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
			
			const onmessage = (event: any) => this.onmessage(event.data)
			const onopen = () => {
				ws.addEventListener("message", onmessage)
				ws.addEventListener("close", onclose)
				ws.addEventListener("error", onerror)
				// only fire open event first time
				if (this.first) {
					this.onopen()
				} else {
					this._emit("reopen", { id: null })
				}
				this.first = false
				return resolve()
			}
			const onclose = (event: Event) => {
				ws.removeEventListener("message", onmessage)
				ws.removeEventListener("open", onopen)
				ws.removeEventListener("close", onclose)
				ws.removeEventListener("error", (error: Error) => {
					reject()
					onerror(error)
				})
				this.onclose(event)
				reject()
			}
			const onerror = (error: Error) => this.onerror(error)

			ws.binaryType = "arraybuffer"
			ws.addEventListener("open", onopen)
		})
	}

	reconnect(timeout = 1000) {
		return new Promise(async (resolve, reject) => {
			if (this.init.isOpen()) { return resolve() }
			const interval = setInterval(async () => {
				if (this.init.isOpen()) {
					clearInterval(interval)
					return resolve()
				}
				this.newConnection(this.path, this.protocols)
		}, timeout)
		})
	}

}