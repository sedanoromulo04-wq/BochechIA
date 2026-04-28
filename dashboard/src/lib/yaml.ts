import fs from "node:fs/promises";
import yaml from "js-yaml";

// Lê e parseia um YAML. Lança se o arquivo não existir ou for inválido —
// o consumidor decide como tratar (UI mostra estado de erro).
export async function readYaml<T = unknown>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return yaml.load(raw) as T;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
