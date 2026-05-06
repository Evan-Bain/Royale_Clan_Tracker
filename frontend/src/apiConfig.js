const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const APP_API_BASE_URL = (
  configuredApiBaseUrl || (import.meta.env.DEV ? "http://localhost:8080/api" : "/api")
).replace(/\/$/, "");
