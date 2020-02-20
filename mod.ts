import { serve as httpServe, Server as HTTPServer, HTTPOptions } from "https://deno.land/std/http/server.ts"
import { Server } from "./Server.ts"

export { Wrapper } from "./Wrapper.ts"
export { Server } from "./Server.ts"

export function serve(addr: string | HTTPOptions): Server {
	const server = httpServe(addr)
	const wss = new Server(server)
	return wss
}