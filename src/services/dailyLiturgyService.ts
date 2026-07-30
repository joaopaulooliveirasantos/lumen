import { dailyLiturgySchema } from "../schema";
import type { DailyLiturgyPayload, ReadingBlock } from "../types";
import type { LiturgyClient } from "../integrations/liturgyClient";
import type { EvangelizoCommentClient } from "../integrations/evangelizoCommentClient";

function pickString(source: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
}

function normalizeReading(raw: unknown): ReadingBlock | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const referencia = pickString(source, ["referencia", "ref"]);
  const titulo = pickString(source, ["titulo", "title"]);
  const texto = pickString(source, ["texto", "text"]);

  if (!referencia || !titulo || !texto) {
    return null;
  }

  return { referencia, titulo, texto };
}

function normalizeRoot(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object") {
    const root = input as Record<string, unknown>;
    if (root.data && typeof root.data === "object") {
      return root.data as Record<string, unknown>;
    }
    return root;
  }

  return {};
}

function safeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export class DailyLiturgyService {
  constructor(
    private readonly liturgyClient: Pick<LiturgyClient, "getByDate">,
    private readonly reflectionClient: Pick<EvangelizoCommentClient, "getByDate">,
  ) {}

  async getDailyPayload(isoDate: string): Promise<DailyLiturgyPayload> {
    const [liturgyRaw, reflectionCandidate] = await Promise.all([
      this.liturgyClient.getByDate(isoDate),
      this.reflectionClient.getByDate(isoDate).catch(() => null),
    ]);

    const root = normalizeRoot(liturgyRaw);
    const primeiraLeitura =
      normalizeReading(root.primeiraLeitura) ??
      normalizeReading({
        referencia: root.primeira_leitura_ref,
        titulo: root.primeira_leitura_titulo,
        texto: root.primeira_leitura_texto,
      });

    const salmoRaw = safeRecord(root.salmo);
    const evangelho = normalizeReading(root.evangelho);
    const segundaLeitura =
      normalizeReading(root.segundaLeitura) ??
      normalizeReading({
        referencia: root.segunda_leitura_ref,
        titulo: root.segunda_leitura_titulo,
        texto: root.segunda_leitura_texto,
      });

    if (!primeiraLeitura || !evangelho) {
      throw new Error("Dados de liturgia incompletos para a data solicitada.");
    }

    const payload: DailyLiturgyPayload = {
      data: pickString(root, ["data", "date", "dia"], isoDate),
      liturgia: pickString(root, ["liturgia", "nome_liturgia"]),
      cor: pickString(root, ["cor", "cor_liturgica"]),
      primeiraLeitura,
      salmo: {
        referencia: pickString(salmoRaw, ["referencia", "ref"], pickString(root, ["salmo_ref"])),
        refrao: pickString(salmoRaw, ["refrao"], pickString(root, ["salmo_refrao"])),
        texto: pickString(salmoRaw, ["texto", "text"], pickString(root, ["salmo_texto"])),
      },
      segundaLeitura,
      evangelho,
      reflexao: {
        titulo: pickString(
          safeRecord(root.reflexao),
          ["titulo"],
          reflectionCandidate?.titulo || "Homilia do dia",
        ),
        autor: pickString(
          safeRecord(root.reflexao),
          ["autor"],
          reflectionCandidate?.autor || "Fonte externa",
        ),
        fonte: pickString(safeRecord(root.reflexao), ["fonte"], reflectionCandidate?.fonte || ""),
        texto: pickString(
          safeRecord(root.reflexao),
          ["texto"],
          reflectionCandidate?.texto || "Homilia indisponivel para esta data.",
        ),
        audioUrl: pickString(safeRecord(root.reflexao), ["audioUrl"]) || null,
      },
    };

    return dailyLiturgySchema.parse(payload);
  }
}
