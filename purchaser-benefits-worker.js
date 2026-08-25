import baseWorker from "./cloudflare-worker.js";
import { handlePurchaserBenefitsRequest } from "./purchaser-benefits-access.js";

const EXAM_PATH = "/exam.html";
const PUBLIC_SAMPLE_PLAN = "sample";

function isStagingEnvironment(env) {
  return String(env.CBT_ENVIRONMENT || "").trim().toLowerCase() === "staging";
}

function redirectToPricing(url) {
  const destination = new URL("/", url.origin);
  destination.hash = "pricing";
  return new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Location: destination.toString(),
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function handlePublicExamGate(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== EXAM_PATH) return null;
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (isStagingEnvironment(env)) return null;

  const plan = String(url.searchParams.get("plan") || "").trim().toLowerCase();
  if (plan === PUBLIC_SAMPLE_PLAN) return null;
  return redirectToPricing(url);
}

export default {
  async fetch(request, env, ctx) {
    const publicExamGateResponse = handlePublicExamGate(request, env);
    if (publicExamGateResponse) return publicExamGateResponse;

    const purchaserBenefitsResponse = await handlePurchaserBenefitsRequest(request, env);
    if (purchaserBenefitsResponse) return purchaserBenefitsResponse;
    return baseWorker.fetch(request, env, ctx);
  },
};
