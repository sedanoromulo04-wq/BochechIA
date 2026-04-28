import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ModelId } from "@/types/model";

let _anthropic: Anthropic | null = null;
let _alibaba: OpenAI | null = null;

function anthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada em .env.local");
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

function alibabaClient(): OpenAI {
  if (!_alibaba) {
    const apiKey = process.env.ALIBABA_API_KEY;
    const baseURL =
      process.env.ALIBABA_BASE_URL ??
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    if (!apiKey) throw new Error("ALIBABA_API_KEY não configurada em .env.local");
    _alibaba = new OpenAI({ apiKey, baseURL });
  }
  return _alibaba;
}

export interface CompletionResult {
  output: string;
  inputTokens: number;
  outputTokens: number;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function callModel(
  modelId: ModelId,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<CompletionResult> {
  if (modelId.startsWith("claude-")) {
    return callAnthropic(modelId, systemPrompt, messages);
  }
  return callAlibaba(modelId, systemPrompt, messages);
}

async function callAnthropic(
  modelId: ModelId,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<CompletionResult> {
  const client = anthropicClient();
  const response = await client.messages.create({
    model: modelId,
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const output = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  return {
    output,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

async function callAlibaba(
  modelId: ModelId,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<CompletionResult> {
  const client = alibabaClient();

  const response = await client.chat.completions.create({
    model: modelId,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  });

  const choice = response.choices[0];
  return {
    output: choice.message.content ?? "",
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  };
}
