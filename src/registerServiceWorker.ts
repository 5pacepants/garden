type RegisterOptions = {
  baseUrl?: string;
};

export async function registerServiceWorker(options: RegisterOptions = {}): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL ?? "/";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  try {
    await navigator.serviceWorker.register(`${normalizedBase}sw.js`, { scope: normalizedBase });
  } catch {
    // PWA support is progressive; the app must keep working if registration fails.
  }
}
