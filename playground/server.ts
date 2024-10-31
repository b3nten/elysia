import * as std_http from "jsr:@std/http";

const fetch = (request: Request) =>
	std_http.serveDir(request, { showIndex: true, fsRoot: "./playground/dist" })

export default { fetch }
