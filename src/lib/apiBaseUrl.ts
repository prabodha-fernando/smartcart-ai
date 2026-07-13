const LOCAL_API_BASE_URL = "http://localhost:4000/api";
const DUMMYJSON_HOSTS = new Set(["dummyjson.com", "www.dummyjson.com"]);

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (!configuredUrl) {
    return LOCAL_API_BASE_URL;
  }

  try {
    const parsedUrl = new URL(configuredUrl, LOCAL_API_BASE_URL);

    if (DUMMYJSON_HOSTS.has(parsedUrl.hostname)) {
      return LOCAL_API_BASE_URL;
    }

    return configuredUrl.replace(/\/+$/, "");
  } catch {
    return LOCAL_API_BASE_URL;
  }
}

