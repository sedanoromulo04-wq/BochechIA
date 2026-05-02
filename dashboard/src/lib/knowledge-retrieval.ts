import "server-only";
import type { Citation, DecisionRecord, PolicyRule, RetrievalFilters, RetrievalResult } from "@/types/knowledge";
import { cosineSimilarity, embedText, lexicalOverlap } from "./knowledge-text";
import { getBrainStore, recordRetrievalMetric } from "./knowledge-store";

function makeCitation(input: {
  sourceId: string;
  title: string;
  excerpt: string;
  uri?: string;
  documentId?: string;
  versionId?: string;
  chunkId?: string;
  factId?: string;
  score?: number;
}): Citation {
  return {
    sourceId: input.sourceId,
    title: input.title,
    excerpt: input.excerpt,
    uri: input.uri,
    documentId: input.documentId,
    versionId: input.versionId,
    chunkId: input.chunkId,
    factId: input.factId,
    score: input.score,
  };
}

function limitConfidence(score: number): number {
  if (score < 0) return 0;
  if (score > 1) return 1;
  return Number(score.toFixed(3));
}

export async function searchKnowledge(
  query: string,
  filters: RetrievalFilters = {},
): Promise<RetrievalResult> {
  const store = await getBrainStore();
  const workspaceId = filters.workspaceId ?? store.workspaces[0]?.id;
  const queryEmbedding = embedText(query);

  const chunkMatches = store.documentChunks
    .filter((chunk) => {
      if (workspaceId && chunk.workspaceId !== workspaceId) return false;
      if (filters.clientId && chunk.clientId !== filters.clientId) return false;
      if (filters.projectId && chunk.projectId !== filters.projectId) return false;
      if (filters.domain && chunk.metadata.domain !== filters.domain) return false;
      return true;
    })
    .map((chunk) => {
      const lexical = lexicalOverlap(query, chunk.content);
      const semantic = cosineSimilarity(queryEmbedding, chunk.embedding);
      const score = lexical * 0.55 + semantic * 0.45;
      return { chunk, score: limitConfidence(score) };
    })
    .filter((entry) => entry.score > 0.08)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const factMatches = store.facts
    .filter((fact) => {
      if (workspaceId && fact.workspaceId !== workspaceId) return false;
      if (filters.clientId && fact.clientId !== filters.clientId) return false;
      if (filters.projectId && fact.projectId !== filters.projectId) return false;
      if (filters.statuses?.length && !filters.statuses.includes(fact.status)) return false;
      return fact.status === "approved";
    })
    .map((fact) => {
      const score = limitConfidence(
        lexicalOverlap(query, `${fact.subject} ${fact.claim}`) * 0.65 + fact.confidence * 0.35,
      );
      return { fact, score };
    })
    .filter((entry) => entry.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const policyMatches = store.policies
    .filter((policy) => policy.active)
    .map((policy) => ({
      policy,
      score: limitConfidence(
        lexicalOverlap(query, `${policy.name} ${policy.description}`) * 0.7 + 0.2,
      ),
    }))
    .filter((entry) => entry.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const decisionMatches = store.decisionRecords
    .map((decision) => ({
      decision,
      score: limitConfidence(
        lexicalOverlap(query, decision.rationale.join(" ")) * 0.75 + decision.knowledgeConfidence * 0.25,
      ),
    }))
    .filter((entry) => entry.score > 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const citations: Citation[] = [];
  for (const match of chunkMatches) {
    const source = store.knowledgeSources.find((item) => item.id === match.chunk.sourceId);
    citations.push(makeCitation({
      sourceId: match.chunk.sourceId,
      title: source?.title ?? "Fonte interna",
      excerpt: match.chunk.content.slice(0, 280),
      uri: source?.uri,
      documentId: match.chunk.documentId,
      versionId: match.chunk.documentVersionId,
      chunkId: match.chunk.id,
      score: match.score,
    }));
  }
  for (const match of factMatches) {
    const source = store.knowledgeSources.find((item) => item.id === match.fact.sourceId);
    citations.push(makeCitation({
      sourceId: match.fact.sourceId,
      title: source?.title ?? "Fato operacional",
      excerpt: match.fact.claim,
      uri: source?.uri,
      documentId: match.fact.documentId,
      versionId: match.fact.versionId,
      chunkId: match.fact.chunkId,
      factId: match.fact.id,
      score: match.score,
    }));
  }

  const topScores = citations.map((citation) => citation.score ?? 0).sort((a, b) => b - a);
  const confidence = limitConfidence(
    (topScores[0] ?? 0) * 0.65 + Math.min(citations.length, 4) * 0.08,
  );

  await recordRetrievalMetric({
    workspaceId: workspaceId ?? "unknown",
    query,
    confidence,
    citationsCount: citations.length,
  });

  return {
    query,
    confidence,
    citations: citations.slice(0, 10),
    chunks: chunkMatches.map((entry) => entry.chunk),
    facts: factMatches.map((entry) => entry.fact),
    policies: policyMatches.map((entry) => entry.policy),
    decisions: decisionMatches.map((entry) => entry.decision),
  };
}

export function summarizeCitations(citations: Citation[]): string {
  if (citations.length === 0) return "Nenhuma evidência operacional encontrada.";
  return citations
    .slice(0, 5)
    .map((citation, index) => `[${index + 1}] ${citation.title}: ${citation.excerpt}`)
    .join("\n");
}

export function extractPolicyIds(policies: PolicyRule[]): string[] {
  return policies.map((policy) => policy.id);
}

export function latestDecisionForProcess(
  decisions: DecisionRecord[],
  processId: string,
): DecisionRecord | null {
  return decisions.find((decision) => decision.processId === processId) ?? null;
}
