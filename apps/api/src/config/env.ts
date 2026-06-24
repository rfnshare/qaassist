export type ApiEnv = {
  host: string;
  port: number;
  extensionOrigin: string;
  nodeEnv: "development" | "test" | "production";
};

const DEFAULT_PORT = 4317;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  const port = Number(source.API_PORT ?? DEFAULT_PORT);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("API_PORT must be a valid TCP port.");
  }

  return {
    host: source.API_HOST ?? "127.0.0.1",
    port,
    extensionOrigin: source.EXTENSION_ORIGIN ?? "chrome-extension://replace-after-local-install",
    nodeEnv: parseNodeEnv(source.NODE_ENV)
  };
}

function parseNodeEnv(value: string | undefined): ApiEnv["nodeEnv"] {
  if (value === "production" || value === "test" || value === "development") {
    return value;
  }

  return "development";
}
