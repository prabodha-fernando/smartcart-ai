import type { AIProductQuery } from "@/types/product";

const categories = [
  "beauty",
  "fragrances",
  "furniture",
  "groceries",
  "home-decoration",
  "kitchen-accessories",
  "laptops",
  "mens-shirts",
  "mens-shoes",
  "mens-watches",
  "mobile-accessories",
  "motorcycle",
  "skin-care",
  "smartphones",
  "sports-accessories",
  "sunglasses",
  "tablets",
  "tops",
  "vehicle",
  "womens-bags",
  "womens-dresses",
  "womens-jewellery",
  "womens-shoes",
  "womens-watches",
];

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };

  if (!prompt?.trim()) {
    return Response.json({
      category: null,
      maxPrice: null,
      minRating: null,
      keywords: [],
    } satisfies AIProductQuery);
  }

  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return Response.json(getFallbackQuery(prompt));
  }

  try {
    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta/llama-3.3-70b-instruct",
          messages: [
            {
              role: "system",
              content:
                "Return only valid JSON with schema: {\"category\": string|null, \"maxPrice\": number|null, \"minRating\": number|null, \"keywords\": string[]}. Choose category only from this list: " +
                categories.join(", ") +
                ". Do not include markdown or explanation.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 160,
        }),
      }
    );

    if (!response.ok) {
      return Response.json(getFallbackQuery(prompt));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = normalizeAIQuery(JSON.parse(content));

    return Response.json(parsed);
  } catch {
    return Response.json(getFallbackQuery(prompt));
  }
}

function normalizeAIQuery(value: Partial<AIProductQuery>): AIProductQuery {
  return {
    category:
      value.category && categories.includes(value.category)
        ? value.category
        : null,
    maxPrice:
      typeof value.maxPrice === "number" && Number.isFinite(value.maxPrice)
        ? value.maxPrice
        : null,
    minRating:
      typeof value.minRating === "number" && Number.isFinite(value.minRating)
        ? value.minRating
        : null,
    keywords: Array.isArray(value.keywords)
      ? value.keywords.filter((keyword) => typeof keyword === "string")
      : [],
  };
}

function getFallbackQuery(prompt: string): AIProductQuery {
  const lowerPrompt = prompt.toLowerCase();

  const category =
    categories.find((item) => lowerPrompt.includes(item.replace("-", " "))) ||
    (lowerPrompt.includes("phone")
      ? "smartphones"
      : lowerPrompt.includes("laptop") || lowerPrompt.includes("programming")
      ? "laptops"
      : lowerPrompt.includes("gift") || lowerPrompt.includes("gamer")
      ? "sports-accessories"
      : null);

  const priceMatch = lowerPrompt.match(/\$?(\d{2,5})/);

  return {
    category,
    maxPrice: priceMatch ? Number(priceMatch[1]) : null,
    minRating: lowerPrompt.includes("best") || lowerPrompt.includes("top")
      ? 4
      : null,
    keywords: lowerPrompt
      .split(/\W+/)
      .filter((word) => word.length > 3)
      .slice(0, 5),
  };
}
