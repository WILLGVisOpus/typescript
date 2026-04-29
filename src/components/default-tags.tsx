// Default <head> tags shared across the app. Next.js App Router auto-handles
// /icon.svg and /favicon.ico, so this component is mostly redundant — kept for
// any legacy callers and to surface the manifest link.
export function DefaultTags() {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link href="/icon-192.png" rel="apple-touch-icon" sizes="192x192" />
      <link href="/icon.svg" rel="icon" type="image/svg+xml" />
      <link href="/favicon.ico" rel="shortcut icon" />
      <link href="/favicon/site.webmanifest" rel="manifest" />
      <meta name="theme-color" content="#0a1628" />
    </>
  );
}
