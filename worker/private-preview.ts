/** Fail closed until private-repository member authentication is configured. */
export function isPrivatePreview(pathname: string): boolean {
  let path = pathname;
  try {
    for (let i = 0; i < 4; i++) {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    }
  } catch {
    // An invalid path must not bypass the guard and reach the asset resolver.
    return true;
  }
  path = new URL('https://preview.invalid' + path.replaceAll('\\', '/')).pathname.replace(/\/+/g, '/').toLowerCase();
  return path === '/preview' || path.startsWith('/preview/') || path.includes('tasklooppreview') || path.startsWith('/private-preview/');
}
export function closedPreview(request: Request, production: boolean): Response {
  return new Response(request.method === 'HEAD' ? null : production ? 'Not found.' : 'Private preview is temporarily closed. Member authentication is not configured.', {
    status: production ? 404 : 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Cloudflare-CDN-Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, nosnippet',
    },
  });
}
