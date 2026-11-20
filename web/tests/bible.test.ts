import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTranslationAssets,
  slugify,
  validateBible,
  type RawBibleData,
} from "../../scripts/bible/build-bible-assets.mjs";
import {
  BibleUnavailableError,
  clearBibleTranslation,
  downloadBibleTranslation,
  getBibleDownloadStatus,
  getBibleIndex,
  listBibleBooks,
  loadBibleBook,
  resetBibleSession,
} from "../src/services/bible";
import { resolveReference } from "../src/services/readingPlans";
import { resetDbConnection } from "../src/storage/idb";

const verse = (versiculo: number, texto = `v${versiculo}`) => ({ versiculo, texto });

function fixture(genesisText = "No princípio"): RawBibleData {
  return {
    antigoTestamento: [
      { nome: "Gênesis", capitulos: [{ capitulo: 1, versiculos: [verse(1, genesisText), verse(2)] }] },
      { nome: "Êxodo", capitulos: [{ capitulo: 1, versiculos: [verse(1)] }, { capitulo: 2, versiculos: [verse(1)] }] },
    ],
    novoTestamento: [
      { nome: "São João", capitulos: [{ capitulo: 1, versiculos: [verse(1, "No princípio era o Verbo"), verse(2), verse(3)] }] },
    ],
  };
}

/** Servidor falso: mapeia as URLs geradas para os JSONs, e registra cada pedido. */
function serve(data: RawBibleData, id = "paulus") {
  const { versao, index, books } = buildTranslationAssets({ id }, data, {});
  const files = new Map<string, string>([
    [
      "/biblias/manifest.json",
      JSON.stringify({ schema: 1, geradoEm: "", traducoes: [{ id, nome: "x", editora: "y", versao, livros: books.length }] }),
    ],
    [`/biblias/${id}/${versao}/index.json`, JSON.stringify(index)],
    ...books.map(({ slug, json }) => [`/biblias/${id}/${versao}/${slug}.json`, json] as [string, string]),
  ]);
  const requests: string[] = [];
  let online = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      requests.push(url);
      if (!online) throw new TypeError("Failed to fetch");
      const body = files.get(url);
      return body ? new Response(body, { status: 200 }) : new Response("", { status: 404 });
    }),
  );
  return {
    versao,
    requests,
    setOnline: (value: boolean) => {
      online = value;
    },
  };
}

beforeEach(async () => {
  window.localStorage.clear();
  resetBibleSession();
  await resetDbConnection();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("lumen");
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("gerador das Bíblias", () => {
  it("gera slugs ASCII com a posição", () => {
    expect(slugify("Gênesis", 1)).toBe("01-genesis");
    expect(slugify("I São Pedro", 67)).toBe("67-i-sao-pedro");
    expect(slugify("Cântico dos Cânticos", 26)).toBe("26-cantico-dos-canticos");
  });

  it("versão depende só do conteúdo", () => {
    const a = buildTranslationAssets({ id: "paulus" }, fixture(), {});
    const b = buildTranslationAssets({ id: "paulus" }, fixture(), {});
    const c = buildTranslationAssets({ id: "paulus" }, fixture("Texto revisado"), {});
    expect(a.versao).toBe(b.versao);
    expect(a.versao).not.toBe(c.versao);
    expect(a.index.livros.map((l) => l.versiculosPorCapitulo)).toEqual([[2], [1, 1], [3]]);
  });

  it("rejeita capítulo fora de sequência, versículo vazio e contagem de livros errada", () => {
    const broken = fixture();
    broken.antigoTestamento[1].capitulos[1].capitulo = 3;
    broken.novoTestamento[0].capitulos[0].versiculos[1].texto = " ";
    expect(() => validateBible(broken, "teste", {})).toThrow(/fora de sequência[\s\S]*versículo inválido/);
    expect(() => validateBible(fixture(), "teste")).toThrow(/esperado 46/);
  });
});

describe("carregador das Bíblias", () => {
  it("baixa o livro sob demanda e depois lê do cache, mesmo offline", async () => {
    const server = serve(fixture());
    const book = await loadBibleBook("paulus", "São João");
    expect(book?.capitulos[0].versiculos[0].texto).toBe("No princípio era o Verbo");
    expect(server.requests.filter((u) => u.endsWith(".json") && u.includes("sao-joao"))).toHaveLength(1);

    server.setOnline(false);
    resetBibleSession();
    expect((await loadBibleBook("paulus", "São João"))?.nome).toBe("São João");
    await expect(loadBibleBook("paulus", "Gênesis")).rejects.toBeInstanceOf(BibleUnavailableError);
  });

  it("retorna undefined para livro inexistente e lista por testamento", async () => {
    serve(fixture());
    expect(await loadBibleBook("paulus", "Nada")).toBeUndefined();
    expect((await listBibleBooks("paulus", "novoTestamento")).map((b) => b.nome)).toEqual(["São João"]);
  });

  it("sem rede e sem nada em cache, falha com BibleUnavailableError", async () => {
    const server = serve(fixture());
    server.setOnline(false);
    await expect(getBibleIndex("paulus")).rejects.toBeInstanceOf(BibleUnavailableError);
  });

  it("baixa a tradução inteira, informa o progresso e o status", async () => {
    const server = serve(fixture());
    await loadBibleBook("paulus", "Gênesis");
    const progress: number[] = [];
    await downloadBibleTranslation("paulus", (s) => progress.push(s.baixados));
    expect(progress[0]).toBe(1);
    expect(progress.at(-1)).toBe(3);
    expect(await getBibleDownloadStatus("paulus")).toMatchObject({ baixados: 3, total: 3 });

    server.setOnline(false);
    resetBibleSession();
    expect((await loadBibleBook("paulus", "Êxodo"))?.capitulos).toHaveLength(2);

    await clearBibleTranslation("paulus");
    expect(await getBibleDownloadStatus("paulus").catch((e) => e)).toBeInstanceOf(BibleUnavailableError);
  });

  it("quando a versão muda, rebaixa o livro; offline usa a versão anterior", async () => {
    const v1 = serve(fixture("Texto antigo"));
    expect((await loadBibleBook("paulus", "Gênesis"))?.capitulos[0].versiculos[0].texto).toBe("Texto antigo");
    await loadBibleBook("paulus", "São João");

    resetBibleSession();
    const v2 = serve(fixture("Texto novo"));
    expect(v2.versao).not.toBe(v1.versao);
    expect((await loadBibleBook("paulus", "Gênesis"))?.capitulos[0].versiculos[0].texto).toBe("Texto novo");

    // São João ainda não foi baixado na versão nova: sem rede, usa o da versão anterior.
    v2.setOnline(false);
    expect((await loadBibleBook("paulus", "São João"))?.nome).toBe("São João");
  });

  it("serve de loader para resolveReference", async () => {
    serve(fixture());
    const passages = await resolveReference({ livro: "São João", capituloInicio: 1, versiculoFim: 2 }, "paulus", loadBibleBook);
    expect(passages).toEqual([{ livro: "São João", capitulo: 1, versiculos: [verse(1, "No princípio era o Verbo"), verse(2)] }]);
  });
});
