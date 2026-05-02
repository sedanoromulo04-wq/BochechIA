export type ModelId =
  | "qwen3.5-flash"
  | "qwen3.5-plus"
  | "claude-sonnet-4-6"
  | "claude-opus-4-6";

export type ModelTier = "flash" | "pro" | "sonnet" | "opus";

export interface ModelSpec {
  id: ModelId;
  tier: ModelTier;
  provider: "anthropic" | "alibaba";
  cost_input: number;
  cost_output: number;
  context: number;
  use_for: string;
}
