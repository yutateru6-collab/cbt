const BONUS_PATH = "/bonus.html";
const BONUS_PRESENTATION_QUERY = "purchase=three";
const PDF_PATH = "/output/pdf/eiken-grade2-final-check-writing-template.pdf";
const COOKIE_NAME = "__Host-cbt-purchaser-benefits";
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const encoder = new TextEncoder();

function lockedPage() {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#263b4d" />
    <meta name="robots" content="noindex,nofollow" />
    <title>購入者限定特典 | S-CBT直前リハーサル</title>
    <link rel="icon" href="./assets/app-icon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="./bonus.css?v=grade2-purchaser-benefits-v82" />
  </head>
  <body>
    <main class="bonus-shell">
      <section class="locked-card">
        <span class="eyebrow">3回プレミアム購入者限定</span>
        <h1>購入後のご案内から開いてください。</h1>
        <p>このページは、3回プレミアムの購入確認後に利用できます。購入完了後の案内リンクから開いてください。</p>
        <a class="bonus-button primary" href="./">商品ページへ戻る</a>
      </section>
    </main>
  </body>
</html>`;
}

function noStoreHeaders(contentType = "text/html; charset=utf-8") {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Type": contentType,
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
  };
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) return rawValue.join("=");
  }
  return "";
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

async function signGrant(secret, expiresAt) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(String(expiresAt)));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function createGrant(secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  const expiresAt = nowSeconds + COOKIE_MAX_AGE_SECONDS;
  const signature = await signGrant(secret, expiresAt);
  return `${expiresAt}.${signature}`;
}

async function hasValidGrant(request, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret) return false;
  const token = getCookie(request, COOKIE_NAME);
  const match = /^(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const expiresAt = Number(match[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowSeconds) return false;
  const expected = await signGrant(secret, expiresAt);
  return expected === match[2];
}

function validCheckoutSessionId(value) {
  return typeof value === "string" && value.length <= 255 && /^cs_(?:(?:test|live)_)?[A-Za-z0-9]+$/.test(value);
}

async function stripeGetJson(path, secretKey) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

async function verifyThreePackPurchase(sessionId, env) {
  const secretKey = String(env.STRIPE_SECRET_KEY || "").trim();
  const expectedPriceId = String(env.STRIPE_THREE_PRICE_ID || "").trim();
  if (!secretKey || !expectedPriceId || !validCheckoutSessionId(sessionId)) return false;

  const session = await stripeGetJson(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, secretKey);
  if (
    !session ||
    session.object !== "checkout.session" ||
    session.mode !== "payment" ||
    session.status !== "complete" ||
    session.payment_status !== "paid"
  ) {
    return false;
  }

  const lineItems = await stripeGetJson(
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=100`,
    secretKey,
  );
  return Array.isArray(lineItems?.data) && lineItems.data.some((item) => item?.price?.id === expectedPriceId);
}

function cleanAssetResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Vary", "Cookie");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function lockedResponse(status = 403) {
  return new Response(lockedPage(), { status, headers: noStoreHeaders() });
}

function bonusLocation(url) {
  const destination = new URL(BONUS_PATH, url.origin);
  destination.search = BONUS_PRESENTATION_QUERY;
  return destination.toString();
}

function pdfDeniedLocation(url) {
  return new URL(BONUS_PATH, url.origin).toString();
}

function grantCookie(token) {
  return `${COOKIE_NAME}=${token}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; Secure; HttpOnly; SameSite=Lax`;
}

export async function handlePurchaserBenefitsRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== BONUS_PATH && url.pathname !== PDF_PATH) return null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed.", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const signingSecret = String(env.PURCHASER_BENEFITS_SIGNING_SECRET || "").trim();

  if (url.pathname === BONUS_PATH) {
    const sessionId = String(url.searchParams.get("session_id") || "").trim();
    if (sessionId) {
      let verified = false;
      try {
        verified = await verifyThreePackPurchase(sessionId, env);
      } catch {
        verified = false;
      }
      if (!verified || !signingSecret) return lockedResponse();

      const token = await createGrant(signingSecret);
      return new Response(null, {
        status: 303,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          Location: bonusLocation(url),
          "Set-Cookie": grantCookie(token),
        },
      });
    }

    if (!(await hasValidGrant(request, signingSecret))) return lockedResponse();
    if (url.searchParams.get("purchase") !== "three") {
      return new Response(null, {
        status: 303,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          Location: bonusLocation(url),
        },
      });
    }

    return cleanAssetResponse(await env.ASSETS.fetch(request));
  }

  if (!(await hasValidGrant(request, signingSecret))) {
    return new Response(null, {
      status: 303,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Location: pdfDeniedLocation(url),
      },
    });
  }
  return cleanAssetResponse(await env.ASSETS.fetch(request));
}
