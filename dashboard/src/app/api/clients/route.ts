import { NextRequest, NextResponse } from "next/server";
import type { Client } from "@/types/client";
import { addClient } from "@/lib/clients-store";
import { clearClientsCache } from "@/lib/clients";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string;
      company?: string;
      niche?: string;
      squads_active?: string[];
      primary_contact?: string;
    };

    if (!body.name || !body.company || !body.niche) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, company, niche" },
        { status: 400 },
      );
    }

    const id = `cliente-${slugify(body.company)}`;
    const now = new Date().toISOString().slice(0, 10);

    const client: Client = {
      id,
      name: body.name,
      company: body.company,
      niche: body.niche,
      status: "active",
      mem0_user_id: id,
      squads_active: body.squads_active ?? ["copy-squad", "brand-squad"],
      primary_contact: body.primary_contact ?? "",
      start_date: now,
      projects: [],
    };

    await addClient(client);
    clearClientsCache();

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
