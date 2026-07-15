const LOCAL_API_BASE_URL = "http://localhost:4000/api";
const DUMMYJSON_HOSTS = new Set(["dummyjson.com", "www.dummyjson.com"]);

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function normalizeApiUrl(url: string | undefined) {
  const configuredUrl = url?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(configuredUrl, LOCAL_API_BASE_URL);

    if (DUMMYJSON_HOSTS.has(parsedUrl.hostname)) {
      return null;
    }

    return configuredUrl.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function getBackendApiBaseUrl() {
  return (
    normalizeApiUrl(process.env.BACKEND_API_URL) ??
    normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL) ??
    normalizeApiUrl(process.env.NEXT_PUBLIC_BASE_URL) ??
    LOCAL_API_BASE_URL
  );
}

export function getApiBaseUrl() {
  if (
    typeof window !== "undefined" &&
    !isLoopbackHost(window.location.hostname)
  ) {
    return "/api";
  }

  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() ??
    process.env.NEXT_PUBLIC_BASE_URL?.trim();

  return normalizeApiUrl(configuredUrl) ?? LOCAL_API_BASE_URL;
}
