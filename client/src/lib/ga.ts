// Tiny GA helper that no-ops if GA isn't loaded yet
export function gaPageview(path: string) {
  // @ts-ignore
  if (typeof window.gtag !== "function") return;
  // @ts-ignore
  window.gtag('event', 'page_view', { page_path: path });
}

export function gaEvent(name: string, params: Record<string, any> = {}) {
  // @ts-ignore
  if (typeof window.gtag !== "function") return;
  // @ts-ignore
  window.gtag('event', name, params);
}