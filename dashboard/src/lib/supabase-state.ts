import "server-only";
import { getSupabaseAdmin, isSupabaseRuntimeEnabled } from "./db";

type JsonValue = unknown;

const BUCKET = "bochechia-state";
let disabled = false;

async function ensureBucket(): Promise<void> {
  if (!isSupabaseRuntimeEnabled() || disabled) return;

  const supabase = getSupabaseAdmin();
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET);
    if (error && !String(error.message).toLowerCase().includes("not found")) {
      throw error;
    }
    if (!data) {
      const created = await supabase.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 10485760,
      });
      if (created.error) throw created.error;
    }
  } catch (error) {
    disabled = true;
    console.error("[supabase-state] Falha ao inicializar bucket do Supabase; usando fallback local.", error);
    return;
  }
}

export async function readState<T>(key: string): Promise<T | null> {
  if (!isSupabaseRuntimeEnabled() || disabled) return null;

  await ensureBucket();
  if (disabled) return null;

  const supabase = getSupabaseAdmin();
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(`${key}.json`);

    if (error) {
      if (String(error.message).toLowerCase().includes("not found")) {
        return null;
      }
      throw error;
    }

    const raw = await data.text();
    return JSON.parse(raw) as T;
  } catch (error) {
    disabled = true;
    console.error(`[supabase-state] Falha ao ler "${key}"; usando fallback local.`, error);
    return null;
  }
}

export async function writeState(key: string, value: JsonValue): Promise<void> {
  if (!isSupabaseRuntimeEnabled() || disabled) return;

  await ensureBucket();
  if (disabled) return;

  const supabase = getSupabaseAdmin();
  try {
    const body = JSON.stringify(value, null, 2);
    const uploaded = await supabase.storage
      .from(BUCKET)
      .upload(`${key}.json`, body, {
        upsert: true,
        contentType: "application/json",
      });

    if (uploaded.error) throw uploaded.error;
  } catch (error) {
    disabled = true;
    console.error(`[supabase-state] Falha ao gravar "${key}"; usando fallback local.`, error);
  }
}
