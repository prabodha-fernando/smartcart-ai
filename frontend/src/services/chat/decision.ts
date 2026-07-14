import type { LimitedProduct } from "@/types/product";
import type { AIApiAction, AIDecision, AIFilters } from "@/lib/ai/types";
import { CATEGORIES } from "@/lib/ai/types";
import { callNvidiaAI, NVIDIA_MODEL } from "@/lib/ai/nvidiaClient";
import {
  buildChatPrompt,
  buildReplyPrompt,
  formatConversation,
  formatProductContext,
} from "@/lib/ai/promptBuilder";
import { resolveCategory } from "@/services/chat/filters";
import { ChatMessage, latestUserTurn } from "@/services/chat/shared";

// Second AI call: writes a natural, grounded reply about the resolved products.
export async function generateGroundedReply(
  messages: ChatMessage[],
  products: LimitedProduct[]
): Promise<string | null> {
  const conversation = formatConversation(latestUserTurn(messages));
  const raw = await callNvidiaAI({
    model: NVIDIA_MODEL,
    prompt: buildReplyPrompt(conversation, products),
    temperature: 0.7,
    maxTokens: 200,
  });

  const reply =
    raw && raw.success !== false && typeof raw.reply === "string"
      ? raw.reply.trim()
      : "";
  return reply || null;
}

export async function getDecision(
  messages: ChatMessage[],
  lastProducts: LimitedProduct[]
): Promise<AIDecision> {
  const conversation = formatConversation(messages.slice(-8));
  const context = formatProductContext(lastProducts);
  const prompt = buildChatPrompt(conversation, context);

  const raw = await callNvidiaAI({
    model: NVIDIA_MODEL,
    prompt,
    temperature: 0.2,
    maxTokens: 500,
  });
  // callNvidiaAI returns { success:false, ... } on failure — fall back then.
  return !raw || raw.success === false
    ? fallbackDecision(messages)
    : normalizeDecision(raw);
}

function emptyFilters(): AIFilters {
  return {
    category: null,
    brand: null,
    query: null,
    minPrice: null,
    maxPrice: null,
    rating: null,
    purpose: null,
    color: null,
    sort: null,
  };
}

const SORTS = new Set(["price_asc", "price_desc", "rating", "newest"]);
const API_ACTIONS = new Set<AIApiAction>([
  "",
  "search_products",
  "recommended_products",
  "featured_products",
]);

// Coerces the model's JSON into a safe, fully-typed decision.
function normalizeDecision(value: Record<string, unknown>): AIDecision {
  const raw = (value.filters ?? {}) as Record<string, unknown>;

  // Accept an exact category, else recover one from a loose value the model
  // might emit ("laptop" -> "laptops", "phone" -> "smartphones").
  let category: string | null = null;
  if (typeof raw.category === "string" && raw.category.trim()) {
    category = CATEGORIES.includes(raw.category as (typeof CATEGORIES)[number])
      ? raw.category
      : resolveCategory(raw.category);
  }

  return {
    intent: typeof value.intent === "string" ? value.intent : "product_search",
    requiresApiCall: value.requiresApiCall === true,
    apiAction:
      typeof value.apiAction === "string" &&
      API_ACTIONS.has(value.apiAction as AIApiAction)
        ? (value.apiAction as AIApiAction)
        : "",
    needsMoreInformation: value.needsMoreInformation === true,
    missingInformation: Array.isArray(value.missingInformation)
      ? value.missingInformation.filter((x): x is string => typeof x === "string")
      : [],
    filters: {
      category,
      brand: asString(raw.brand),
      query: asString(raw.query),
      minPrice: asNumber(raw.minPrice),
      maxPrice: asNumber(raw.maxPrice),
      rating: asNumber(raw.rating),
      purpose: asString(raw.purpose),
      color: asString(raw.color),
      sort:
        typeof raw.sort === "string" && SORTS.has(raw.sort) ? raw.sort : null,
    },
    reply:
      typeof value.reply === "string" && value.reply.trim()
        ? value.reply.trim()
        : "Here's what I found for you.",
    confidenceScore: asNumber(value.confidenceScore) ?? 0,
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Used when the AI is unavailable or returns unusable output. Keeps the
// assistant working with a minimal intent guess.
function fallbackDecision(messages: ChatMessage[]): AIDecision {
  const text =
    [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
  const lower = text.toLowerCase();

  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(lower)) {
    return {
      intent: "greeting",
      requiresApiCall: false,
      apiAction: "",
      needsMoreInformation: false,
      missingInformation: [],
      filters: emptyFilters(),
      reply: "Hello! What are you shopping for today?",
      confidenceScore: 40,
    };
  }

  return {
    intent: "search",
    requiresApiCall: true,
    apiAction: "search_products",
    needsMoreInformation: false,
    missingInformation: [],
    filters: { ...emptyFilters(), query: text.slice(0, 60) || null },
    reply: "Here are a few options you might like.",
    confidenceScore: 30,
  };
}

