// Scraper da Bíblia Pastoral (Paulus) via API pública do site biblia.paulus.com.br,
// gerando um JSON no mesmo formato de biblias/ave maria/bibliaAveMaria.json.
//
// Uso: node scrape-paulus.js

const fs = require("fs");
const path = require("path");

const OUT_FILE = path.join(__dirname, "bibliaPastoralPaulus.json");
const PROGRESS_FILE = path.join(__dirname, ".scrape-progress.json");
const CONCURRENCY = 5;
const RETRIES = 4;
const TIMEOUT_MS = 15000;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LumenApp-BibleSync/1.0";

// nome (mesmo padrão/ordem de bibliaAveMaria.json) -> slug real do site paulus
const ANTIGO_TESTAMENTO = [
  ["Gênesis", "genesis"],
  ["Êxodo", "exodo"],
  ["Levítico", "levitico"],
  ["Números", "numeros"],
  ["Deuteronômio", "deuteronomio"],
  ["Josué", "livro-de-josue"],
  ["Juízes", "livro-dos-juizes"],
  ["Rute", "rute"],
  ["I Samuel", "primeiro-livro-de-samuel"],
  ["II Samuel", "segundo-livro-de-samuel"],
  ["I Reis", "primeiro-livro-dos-reis"],
  ["II Reis", "segundo-livro-dos-reis"],
  ["I Crônicas", "primeiro-livro-das-cronicas"],
  ["II Crônicas", "segundo-livro-das-cronicas"],
  ["Esdras", "esdras"],
  ["Neemias", "neemias"],
  ["Tobias", "tobias"],
  ["Judite", "judite"],
  ["Ester", "ester"],
  ["Jó", "jo"],
  ["Salmos", "salmos"],
  ["I Macabeus", "primeiro-livro-dos-macabeus"],
  ["II Macabeus", "segundo-livro-dos-macabeus"],
  ["Provérbios", "proverbios"],
  ["Eclesiastes", "eclesiastes"],
  ["Cântico dos Cânticos", "cantico-dos-canticos"],
  ["Sabedoria", "sabedoria"],
  ["Eclesiástico", "eclesiastico"],
  ["Isaías", "isaias"],
  ["Jeremias", "jeremias"],
  ["Lamentações", "lamentacoes"],
  ["Baruc", "baruc"],
  ["Ezequiel", "ezequiel"],
  ["Daniel", "daniel"],
  ["Oséias", "oseias"],
  ["Joel", "joel"],
  ["Amós", "amos"],
  ["Abdias", "abdias"],
  ["Jonas", "jonas"],
  ["Miquéias", "miqueias"],
  ["Naum", "naum"],
  ["Habacuc", "habacuc"],
  ["Sofonias", "sofonias"],
  ["Ageu", "ageu"],
  ["Zacarias", "zacarias"],
  ["Malaquias", "malaquias"],
];

const NOVO_TESTAMENTO = [
  ["São Mateus", "evangelho-segundo-sao-mateus"],
  ["São Marcos", "evangelho-segundo-sao-marcos"],
  ["São Lucas", "evangelho-segundo-sao-lucas"],
  ["São João", "evangelho-segundo-sao-joao"],
  ["Atos dos Apóstolos", "atos-dos-apostolos"],
  ["Romanos", "carta-aos-romanos"],
  ["I Coríntios", "primeira-carta-aos-corintios"],
  ["II Coríntios", "segunda-carta-aos-corintios"],
  ["Gálatas", "carta-aos-galatas"],
  ["Efésios", "carta-aos-efesios"],
  ["Filipenses", "carta-aos-filipenses"],
  ["Colossenses", "carta-aos-colossenses"],
  ["I Tessalonicenses", "primeira-carta-aos-tessalonicenses"],
  ["II Tessalonicenses", "segunda-carta-aos-tessalonicenses"],
  ["I Timóteo", "primeira-carta-a-timoteo"],
  ["II Timóteo", "segunda-carta-a-timoteo"],
  ["Tito", "carta-a-tito"],
  ["Filêmon", "carta-a-filemon"],
  ["Hebreus", "carta-aos-hebreus"],
  ["São Tiago", "carta-de-sao-tiago"],
  ["I São Pedro", "primeira-carta-de-sao-pedro"],
  ["II São Pedro", "segunda-carta-de-sao-pedro"],
  ["I São João", "primeira-carta-de-sao-joao"],
  ["II São João", "segunda-carta-de-sao-joao"],
  ["III São João", "terceira-carta-de-sao-joao"],
  ["São Judas", "carta-de-sao-judas"],
  ["Apocalipse", "apocalipse-de-sao-joao"],
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      if (attempt === RETRIES) throw err;
      await sleep(500 * attempt);
    }
  }
}

function cleanVerseText(text) {
  return text
    .replace(/­/g, "") // soft hyphen usado para quebra de linha no site
    .replace(/[ \t]+/g, " ")
    .trim();
}

async function getChapterCount(slug) {
  const json = await fetchJson(`https://biblia.paulus.com.br/api/v1/chapters/list?book=${slug}`);
  return json.data.length;
}

async function getChapterVerses(slug, chapter) {
  const json = await fetchJson(
    `https://biblia.paulus.com.br/api/v1/chapters?book=${slug}&chapter=${chapter}`,
  );
  const data = json.data && json.data[0];
  if (!data || !Array.isArray(data.versicles)) {
    throw new Error(`Resposta inesperada para ${slug} cap. ${chapter}`);
  }
  return data.versicles.map((v) => ({
    versiculo: parseInt(v.value, 10),
    texto: cleanVerseText(v.text),
  }));
}

// fila com concorrência limitada
async function runQueue(items, worker, concurrency) {
  let index = 0;
  let done = 0;
  const results = new Array(items.length);
  async function runOne() {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i], i);
      done++;
      if (done % 25 === 0 || done === items.length) {
        process.stdout.write(`  ...${done}/${items.length}\n`);
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, runOne);
  await Promise.all(workers);
  return results;
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
}

async function buildTestament(bookDefs, progress) {
  const livros = [];
  for (const [nome, slug] of bookDefs) {
    console.log(`\n[LIVRO] ${nome} (${slug})`);
    const totalCapitulos = await getChapterCount(slug);
    console.log(`  capítulos: ${totalCapitulos}`);

    const chapterNumbers = Array.from({ length: totalCapitulos }, (_, i) => i + 1);
    const capitulos = await runQueue(
      chapterNumbers,
      async (capNum) => {
        const key = `${slug}:${capNum}`;
        if (progress[key]) return progress[key];
        const versiculos = await getChapterVerses(slug, capNum);
        const result = { capitulo: capNum, versiculos };
        progress[key] = result;
        return result;
      },
      CONCURRENCY,
    );
    saveProgress(progress);

    livros.push({ nome, capitulos });
  }
  return livros;
}

async function main() {
  const progress = loadProgress();
  console.log("=== Antigo Testamento ===");
  const antigoTestamento = await buildTestament(ANTIGO_TESTAMENTO, progress);
  console.log("\n=== Novo Testamento ===");
  const novoTestamento = await buildTestament(NOVO_TESTAMENTO, progress);

  const output = { antigoTestamento, novoTestamento };
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), "utf8");
  console.log(`\nConcluído! Salvo em ${OUT_FILE}`);

  const totalCap =
    antigoTestamento.reduce((s, l) => s + l.capitulos.length, 0) +
    novoTestamento.reduce((s, l) => s + l.capitulos.length, 0);
  const totalVers =
    antigoTestamento.reduce((s, l) => s + l.capitulos.reduce((a, c) => a + c.versiculos.length, 0), 0) +
    novoTestamento.reduce((s, l) => s + l.capitulos.reduce((a, c) => a + c.versiculos.length, 0), 0);
  console.log(`Livros: ${antigoTestamento.length + novoTestamento.length}, capítulos: ${totalCap}, versículos: ${totalVers}`);
}

main().catch((err) => {
  console.error("Falhou:", err);
  process.exit(1);
});
