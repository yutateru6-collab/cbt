import baseWorker from "./cloudflare-worker.js";
import { handlePurchaserBenefitsRequest } from "./purchaser-benefits-access.js";

export default {
  async fetch(request, env, ctx) {
    const purchaserBenefitsResponse = await handlePurchaserBenefitsRequest(request, env);
    if (purchaserBenefitsResponse) return purchaserBenefitsResponse;
    return baseWorker.fetch(request, env, ctx);
  },
};
