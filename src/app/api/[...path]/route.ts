import { getBackendApiBaseUrl } from "@/lib/apiBaseUrl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

type ProxyContext = {
  params: Promise<{
    path: string[];
  }>;
};

type ProxyRequestInit = RequestInit & {
  duplex?: "half";
};

async function proxyToBackend(request: Request, context: ProxyContext) {
  const { path } = await context.params;
  const requestUrl = new URL(request.url);
  const backendUrl = new URL(`${getBackendApiBaseUrl()}/${path.join("/")}`);
  backendUrl.search = requestUrl.search;

  const requestHeaders = filterHeaders(request.headers);
  requestHeaders.set("x-forwarded-host", requestUrl.host);
  requestHeaders.set("x-forwarded-proto", requestUrl.protocol.replace(":", ""));

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const init: ProxyRequestInit = {
    method: request.method,
    headers: requestHeaders,
    redirect: "manual",
  };

  if (hasBody) {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const response = await fetch(backendUrl, init);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: filterHeaders(response.headers),
    });
  } catch {
    return Response.json(
      {
        success: false,
        message:
          "Backend API is not reachable. Set BACKEND_API_URL to your deployed backend URL.",
      },
      { status: 502 }
    );
  }
}

function filterHeaders(headers: Headers) {
  const filtered = new Headers(headers);

  for (const header of HOP_BY_HOP_HEADERS) {
    filtered.delete(header);
  }

  return filtered;
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;

