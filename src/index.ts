interface Env {
	CORS_ALLOW_ORIGIN: string;
	QUICK_NODE_API_ROUTE: string;
}

export default {
	async fetch(request: Request, env: Env) {
		const supportedDomains = env.CORS_ALLOW_ORIGIN ? env.CORS_ALLOW_ORIGIN.split(',') : undefined;
		const corsHeaders: Record<string, string> = {
			'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
			'Access-Control-Allow-Headers': '*',
		};
		if (supportedDomains) {
			const origin = request.headers.get('Origin');
			if (origin && supportedDomains.includes(origin)) {
				corsHeaders['Access-Control-Allow-Origin'] = origin;
			}
		} else {
			corsHeaders['Access-Control-Allow-Origin'] = 'https://dogwithcap.xyz/';
		}

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: corsHeaders,
			});
		}

		const upgradeHeader = request.headers.get('Upgrade');

		if (upgradeHeader || upgradeHeader === 'websocket') {
			return await fetch(env.QUICK_NODE_API_ROUTE, request);
		}

		const { pathname, search } = new URL(request.url);
		const payload = await request.text();
		const proxyRequest = new Request(`${env.QUICK_NODE_API_ROUTE}${pathname}${search || ''}`, {
			method: request.method,
			body: payload || null,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		return await fetch(proxyRequest).then(res => {
			return new Response(res.body, {
				status: res.status,
				headers: corsHeaders,
			});
		});
	},
};
