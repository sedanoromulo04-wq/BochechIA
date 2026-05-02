import crypto from "node:crypto";

const STOPWORDS = new Set([
  "a", "o", "e", "de", "da", "do", "das", "dos", "um", "uma", "para", "com",
  "sem", "por", "em", "no", "na", "nos", "nas", "que", "como", "se", "ou",
  "ao", "aos", "as", "os", "the", "and", "for", "to", "of", "in",
]);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function checksum(text: string): string {
  return crypto.createHash("sha1").update(text).digest("hex");
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export function chunkText(text: string, maxChars = 750): string[] {
  const paragraphs = text
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > maxChars && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.trim()].filter(Boolean);
}

export function embedText(text: string, dimensions = 48): number[] {
  const vector = Array.from({ length: dimensions }, () => 0);
  for (const token of tokenize(text)) {
    let hash = 0;
    for (let i = 0; i < token.length; i += 1) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    vector[hash % dimensions] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / ((Math.sqrt(magA) || 1) * (Math.sqrt(magB) || 1));
}

export function lexicalOverlap(query: string, content: string): number {
  const q = new Set(tokenize(query));
  const c = new Set(tokenize(content));
  if (q.size === 0 || c.size === 0) return 0;
  let overlap = 0;
  for (const token of q) {
    if (c.has(token)) overlap += 1;
  }
  return overlap / Math.max(q.size, 1);
}

export function extractFacts(text: string): Array<{ subject: string; claim: string }> {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const facts: Array<{ subject: string; claim: string }> = [];
  for (const line of lines) {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      facts.push({
        subject: "operational-note",
        claim: line.replace(/^[-*]\s+/, ""),
      });
    } else if (/^[A-Za-zÀ-ÿ0-9 _-]+:/.test(line)) {
      const [subject, ...rest] = line.split(":");
      facts.push({
        subject: slugify(subject),
        claim: rest.join(":").trim(),
      });
    }
  }

  if (facts.length === 0 && text.trim()) {
    const firstSentence = text.trim().split(/[.!?]\s/)[0]?.trim();
    if (firstSentence) {
      facts.push({
        subject: "summary",
        claim: firstSentence,
      });
    }
  }

  return facts.slice(0, 12);
}
