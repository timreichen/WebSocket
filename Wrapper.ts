// needs custom emitter which listener values can return values
import Emitter from "./Emitter.ts"
import { coder, Coder } from "https://raw.githubusercontent.com/timreichen/Coder/master/mod.ts"

interface WrapperInit {
	send: Function
	close: Function
	isClosed: Function
}
interface WrapperOptions {
	callbackTimeout: number
}

// reserved name for event to send callback data
const ACK_NAME = "__ACK_NAME__"

// this.emit -> send to external client
// super.emit -> emit data to internal client
export class Wrapper extends Emitter {	
	init: WrapperInit
	options: WrapperOptions
	private callbacks: Map<number, Function>
	coder: Coder
	constructor(options: WrapperOptions={callbackTimeout: 60000}) {
		super()
		this.coder = coder
		this.options = options
		this.callbacks = new Map()
	}

	connect(init: WrapperInit) {
		this.init = init
	}

	// receive data from external client
	onmessage(pack) {
		const { name, id, pkg } = this.unpack(pack)
		const { data, error } = pkg
		if (name === ACK_NAME) {
			const callback = this.callbacks.get(id)
			if (!callback) { return console.error(`callback with id '${id}' not found`) }
			callback(error, data)
		} else {
			super.emit(name, { id, data })
		}
	}

	onopen() {
		super.emit("open", { id: null })
	}
	onclose(event) {
		super.emit("close", { id: null, data: event })
		this.close()
	}
	onerror(error) {
		super.emit("error", { id: null, data: error })
		this.close()
	}

	// unpack received data from external client
	unpack(pack: ArrayBuffer): { name: string, id: number, pkg: { data?: any, error?: any } } {
		try {
			return coder.decode(pack)
		} catch(error) {
			console.error(`error during unpack:`, error)
		}
	}

	// pack data for sending to external client
	pack(name: string, id: number, pkg: { data?: any, error?: any }): ArrayBuffer {
		try {
			return coder.encode({ name, id, pkg })
		} catch(error) {
			console.error(`error during pack:`, error)
		}
	}

	// process external data
	on(name: string, listener: Function) {
		super.on(name, async ({ id, data }) => {			
			if (id === null) { return listener(data) }
			let pack
			try {
				const result = await listener(data)
				pack = this.pack(ACK_NAME, id, { data: result })
			} catch (error) {
				pack = this.pack(ACK_NAME, id, { error })
			}
			if (!pack) {
				console.error(`callback message send failed`)
				return 
			}
			this.send(pack)
		})
	}

	private generateId() {
		return Math.max(0, ...this.callbacks.keys()) + 1
	}

	// send data to external client
	async emit(name: string, data?: any) {
		if (name === ACK_NAME) { return console.warn(`'${ACK_NAME}' can not be used as a name for emit`) }
		
		if (this.init.isClosed()) { throw Error(`emit failed: Wrapper conncetion is closed`) }
		return new Promise((resolve, reject) => {
			const id = this.generateId()
			const pack = this.pack(name, id, { data })
			this.send(pack)
			const callback = (error, data?) => {
				this.callbacks.delete(id)
				if (error) { return reject(error) }
				return resolve(data)
			}
			this.callbacks.set(id, callback)
			setTimeout(() => {
				callback(`emit '${name}' with id '${id}' timeout error`)
				this.callbacks.delete(id)
			}, this.options.callbackTimeout) // if callback is not called after 60s throw error and delete callback

		})
	}

	private send(pack) {
		try {
			this.init.send(pack)
		} catch (error) {
			console.error(error)
		}
	}

	close() {
		if (this.init.isClosed()) { return console.warn(`websocket is already closed`) }
		this.init.close()
	}

}