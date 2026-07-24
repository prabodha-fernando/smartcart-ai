/**
 * Central prompt / system-instruction assembly.
 *
 * All of SmartCart's AI system instructions live here on the backend and are
 * assembled dynamically from runtime data (the conversation transcript, the
 * catalog facts, the available categories, etc.). Nothing in this file is ever
 * shipped to the client — the frontend only sends user messages and receives
 * finished replies. Keeping every instruction string in one module makes the
 * behavior auditable and prevents prompts from drifting across the service.
 */

/** Emphasis angle for the "why buy this" explanation, keyed by variation. */
const WHY_BUY_EMPHASIS = [
  "overall value",
  "practical ownership details",
  "the product's strongest verified features",
] as const;

/**
 * Structured shopping-intent decision. Asks the model to classify the latest
 * message and extract only explicitly stated search constraints as JSON.
 */
export function buildShoppingDecisionPrompt(transcript: string): string {
  return (
    `Understand exactly what the shopper expects. Return only JSON: ` +
    `{"intent":"product_search|product_question|app_question|out_of_scope","requiresProducts":true,"reply":"short direct answer","search":{"query":null,"categories":[],"brand":null,"color":null,"purpose":null,"minPrice":null,"maxPrice":null,"minRating":null,"minDiscount":null,"inStock":null,"sort":null,"limit":4}}. ` +
    `Use only explicit constraints. sort is price_asc, price_desc, rating, best_selling, discount, newest, or null. ` +
    `Use rating only when the shopper asks for top/highest/best rated. Use best_selling only for best-selling or most-popular requests. ` +
    `limit is 1-4. Keep reply concise and do not add information the customer did not request.\n${transcript}`
  );
}

/**
 * Grounded "why buy this" explanation built strictly from verified product
 * facts, with the emphasis angle chosen by `variation`.
 */
export function buildWhyBuyPrompt(facts: string, variation: number): string {
  const emphasis =
    WHY_BUY_EMPHASIS[variation] ?? WHY_BUY_EMPHASIS[0];
  return (
    `Using only these facts, write a fresh explanation in 2-3 short, honest sentences ` +
    `about why this product may be a good buy. Emphasize ${emphasis}. ` +
    `Use different wording from a generic product summary. No markdown or invented claims.\n${facts}`
  );
}

/**
 * Category resolver. Constrains the model to exact catalog slugs so it can
 * never invent a category that does not exist in our database.
 */
export function buildCategorySelectionPrompt(
  request: string,
  availableCategories: string[]
): string {
  return (
    `Choose up to 3 categories that best match the shopper's request. ` +
    `Use only exact slugs from AVAILABLE_CATEGORIES. Return an empty array if none fit. ` +
    `Return only {"categories":["slug"]}.\nREQUEST\n${request}\nAVAILABLE_CATEGORIES\n${availableCategories.join(", ")}`
  );
}

/**
 * Product selector. Given a shortlisted, pre-filtered catalog, asks the model
 * to pick the most relevant product ids (bounded by `limit`).
 */
export function buildProductSelectionPrompt(
  limit: number,
  request: string,
  catalog: string
): string {
  return (
    `Choose up to ${limit} relevant product IDs from this real catalog. ` +
    `Respect product type, budget, rating, occasion, and use case. ` +
    `Return only {"productIds":[1,2]}.\nREQUEST\n${request}\nCATALOG\n${catalog}`
  );
}

/**
 * Conversational (non-product) reply. Defines the assistant persona and the
 * hard boundaries: stay in shopping/SmartCart scope and never fabricate.
 */
export function buildConversationalReplyPrompt(
  intent: string,
  transcript: string
): string {
  return (
    `You are SmartCart's friendly shopping assistant having a real conversation with a customer. ` +
    `Answer the latest message directly and naturally in 1-3 short sentences. Use earlier messages for context. ` +
    `Stay within shopping and SmartCart. SmartCart can browse products, filter and sort the catalog, manage cart and favorites through the UI, and explain products. ` +
    `For out-of-scope requests, politely redirect to shopping. Do not invent products, policies, orders, or completed actions. No markdown.\n` +
    `INTENT: ${intent}\nCONVERSATION\n${transcript}`
  );
}

/**
 * Grounded product reply. The model may only reference the listed catalog
 * products and their facts, and must name at least one exactly.
 */
export function buildGroundedReplyPrompt(
  transcript: string,
  facts: string
): string {
  return (
    `Continue this customer conversation naturally in 1-3 short sentences. Answer the latest question directly using only the listed catalog products and their facts. ` +
    `Use earlier messages for context. Name at least one listed product exactly. Do not invent features or products. No markdown.\n` +
    `CONVERSATION\n${transcript}\nCATALOG PRODUCTS\n${facts}`
  );
}
