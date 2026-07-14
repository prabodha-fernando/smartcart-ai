// Shopping-assistant service: builds the prompt, calls the central AI client,
// validates the JSON decision, and resolves the actual products.

import type { AIChatResponse, LimitedProduct } from "@/types/product";
import {
  applyLatestRequestOverrides,
  applyPriceBounds,
  applySort,
  isExplicitProductDiscovery,
  resolveCategory,
  resolveResultLimit,
} from "@/services/chat/filters";
import {
  generateGroundedReply,
  getDecision,
} from "@/services/chat/decision";
import { runApiAction } from "@/services/chat/products";
import type { ChatMessage } from "@/services/chat/shared";

// Entry point used by the route. Returns the reply plus any products the
// backend resolved from the model's decision.
export async function resolveChat(input: {
  messages: ChatMessage[];
  lastProducts: LimitedProduct[];
}): Promise<AIChatResponse> {
  const { messages, lastProducts } = input;

  let decision = await getDecision(messages, lastProducts);

  // The small model is unreliable at price direction ("above" vs "under"), so
  // parse the bounds from the text and let them win.
  const lastUserText =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (isExplicitProductDiscovery(lastUserText)) {
    decision = {
      ...decision,
      intent: "product_search",
      requiresApiCall: true,
      apiAction: "recommended_products",
      needsMoreInformation: false,
      missingInformation: [],
    };
  }

  let filters = applyPriceBounds(decision.filters, lastUserText);
  filters = applySort(filters, lastUserText);
  filters = applyLatestRequestOverrides(filters, lastUserText);
  const resultLimit = resolveResultLimit(lastUserText);
  // The model sometimes extracts only the price and drops the category
  // ("smartphones above 800"), so recover it from the raw text.
  if (!filters.category) {
    const recovered = resolveCategory(lastUserText);
    if (recovered) filters = { ...filters, category: recovered };
  }

  // AI chooses the path via apiAction; the backend validates and executes it.
  let products: LimitedProduct[] = [];
  if (decision.needsMoreInformation || !decision.requiresApiCall) {
    // Waiting on the shopper for more detail — ask, don't search.
  } else {
    products = await runApiAction(
      decision.apiAction,
      filters,
      messages,
      resultLimit
    );
  }

  // Once we have the actual products, generate a real, grounded reply that
  // talks about them — instead of the generic pre-fetch reply.
  let reply = decision.reply;
  if (products.length > 0) {
    reply = (await generateGroundedReply(messages, products)) ?? decision.reply;
  } else if (
    lastProducts.length > 0 &&
    !decision.needsMoreInformation &&
    isAboutShownProducts(messages)
  ) {
    // A follow-up/opinion about products already on screen (e.g. "is this
    // worth it?" on a product page). The small model often mis-classifies
    // these, so answer about the shown products directly.
    reply =
      (await generateGroundedReply(messages, lastProducts)) ?? decision.reply;
  } else if (decision.requiresApiCall && !decision.needsMoreInformation) {
    // Wanted products but the search came back empty — be honest instead of
    // using the misleading pre-fetch reply.
    reply =
      "I couldn't find anything matching that in our store right now. Try a different style, category, or price range and I'll take another look.";
  }

  return {
    reply,
    products,
    intent: decision.intent,
    isNewSearch: products.length > 0,
  };
}

// True when the latest message reads like an opinion/value/comparison question
// about products already on screen ("is that worth it?", "which is better?").
function isAboutShownProducts(messages: ChatMessage[]): boolean {
  const text =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (isExplicitProductDiscovery(text)) return false;
  return /\b(worth|good|great|better|best|value|quality|reliable|recommend|is (it|this|that)|should i|tell me about|how (is|are) (it|this|that|these))\b/i.test(
    text
  );
}

