export function getBundledBackgroundImageReference(): string {
  const nodeProcess = globalThis as typeof globalThis & {
    process?: {
      env?: {
        VITE_BASE_PATH?: string;
      };
    };
  };
  const basePath = normalizeBasePath(nodeProcess.process?.env?.VITE_BASE_PATH || import.meta.env.BASE_URL) ?? "/";
  return `${basePath}bakgrund.png`;
}

function normalizeBasePath(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.endsWith("/") ? value : `${value}/`;
}
