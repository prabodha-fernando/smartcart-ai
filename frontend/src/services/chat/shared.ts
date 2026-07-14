export const MAX_PRODUCTS = 4;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function latestUserTurn(messages: ChatMessage[]): ChatMessage[] {
  const latest = [...messages].reverse().find((m) => m.role === "user");
  return latest ? [latest] : messages.slice(-1);
}

