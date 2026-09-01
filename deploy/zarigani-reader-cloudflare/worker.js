const COOKIE_NAME = 'zarigani_reader';

function cookieValue(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return '';
}

function denied() {
  return new Response(`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private Reader</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#efe6d1;color:#29251f;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;box-sizing:border-box}.card{max-width:460px;background:#f9f4e7;border:1px solid #d8cbb3;border-radius:20px;padding:28px;line-height:1.8}h1{font-family:serif;font-size:24px}</style><div class="card"><h1>非公開プレビュー</h1><p>この読書アプリは作者確認用です。専用のアクセスリンクから開いてください。</p></div></html>`, {
    status: 403,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow, noarchive'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const supplied = url.searchParams.get('key') || '';
    const saved = cookieValue(request, COOKIE_NAME);
    const token = env.READER_ACCESS_TOKEN || '';

    if (token && supplied === token) {
      url.searchParams.delete('key');
      const headers = new Headers({
        Location: url.toString(),
        'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      });
      return new Response(null, { status: 302, headers });
    }

    if (!token || saved !== token) return denied();

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
};
