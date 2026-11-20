import { useEffect, useMemo, useState } from "preact/hooks";
import { Icon, type IconName } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { PrayerPlayer } from "../components/PrayerPlayer";
import { Button, Card, Chip } from "../components/ui";
import { prayerCategories } from "../data/prayers";
import { useAppState } from "../state/AppState";
import type { Prayer, PrayerCategory } from "../types/prayers";

/** Rótulo curto, ícone e cor de cada categoria (a cor vai em CSS vars, então vale nos três modos de leitura). */
const CATEGORY_STYLE: Record<string, { short: string; icon: IconName; tone: string }> = {
  fundamentais: { short: "Fundamentais", icon: "cross", tone: "46, 125, 50" },
  marianas: { short: "Marianas", icon: "star", tone: "52, 104, 178" },
  protecao: { short: "Proteção", icon: "shield", tone: "176, 84, 45" },
  santos: { short: "Santos", icon: "person", tone: "168, 128, 18" },
  devocao: { short: "Devoção", icon: "church", tone: "176, 58, 91" },
  misericordia: { short: "Misericórdia", icon: "heart", tone: "196, 52, 52" },
  penitencia: { short: "Arrependimento", icon: "prayingHands", tone: "108, 84, 160" },
  terco: { short: "Terço", icon: "flower", tone: "38, 128, 112" },
};
const FALLBACK_STYLE = { short: "", icon: "prayingHands" as IconName, tone: "46, 125, 50" };

function styleOf(category: PrayerCategory) {
  return CATEGORY_STYLE[category.id] ?? { ...FALLBACK_STYLE, short: category.nome };
}

function toneVars(category: PrayerCategory): Record<string, string> {
  return { "--tone": `rgb(${styleOf(category).tone})`, "--tone-soft": `rgba(${styleOf(category).tone}, 0.14)` } as Record<string, string>;
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function excerpt(text: string, max = 90): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max).trim()}…` : line;
}

type Entry = { prayer: Prayer; category: PrayerCategory };
const ALL: Entry[] = prayerCategories.flatMap((category) => category.oracoes.map((prayer) => ({ prayer, category })));

/** Oração do dia: muda à meia-noite e é a mesma para todos no mesmo dia. */
export function prayerOfTheDay(date = new Date()): Entry {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return ALL[dayOfYear % ALL.length];
}

function PrayerRow({ entry, showCategory, onOpen }: { entry: Entry; showCategory?: boolean; onOpen: (e: Entry) => void }) {
  const style = styleOf(entry.category);
  return (
    <button type="button" class="list-row prayer-row" style={toneVars(entry.category)} onClick={() => onOpen(entry)}>
      <span class="prayer-row-icon">
        <Icon name={style.icon} size={16} />
      </span>
      <span class="list-row-body">
        {showCategory ? <span class="prayer-row-kicker">{style.short}</span> : null}
        <span class="list-row-title">{entry.prayer.titulo}</span>
        <span class="prayer-row-excerpt">{excerpt(entry.prayer.texto, 70)}</span>
      </span>
      <Icon name="chevronRight" size={18} class="list-row-chevron" />
    </button>
  );
}

function PrayerDetail({ entry, onOpen, onBack }: { entry: Entry; onOpen: (e: Entry) => void; onBack: () => void }) {
  const { prayer, category } = entry;
  const style = styleOf(category);
  const siblings = category.oracoes.filter((p) => p.id !== prayer.id).map((p) => ({ prayer: p, category }));
  return (
    <section class="screen" style={toneVars(category)}>
      <PageHeader title="Oração" onBack={onBack} />
      <PrayerPlayer text={`${prayer.titulo}. ${prayer.texto}`} shareText={`${prayer.titulo}\n\n${prayer.texto}`} title={prayer.titulo} resetKey={prayer.id} />
      <article class="card prayer-sheet">
        <span class="prayer-sheet-kicker">
          <Icon name={style.icon} size={14} /> {category.nome}
        </span>
        <h2 class="prayer-sheet-title">{prayer.titulo}</h2>
        <div class="prayer-ornament" aria-hidden="true">
          <span />
          <Icon name="cross" size={14} />
          <span />
        </div>
        <p class="reading-text prayer-sheet-text">{prayer.texto}</p>
      </article>
      {siblings.length ? (
        <div class="stack">
          <h3 class="prayer-more-title">Mais em {style.short || category.nome}</h3>
          <div class="list">
            {siblings.map((s) => (
              <PrayerRow key={s.prayer.id} entry={s} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function PrayersScreen() {
  const { openOverlay } = useAppState();
  const [selected, setSelected] = useState<Entry | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const daily = useMemo(() => prayerOfTheDay(), []);

  // Ao abrir ou voltar de uma oração, começa do topo.
  useEffect(() => {
    document.querySelector(".app-content")?.scrollTo({ top: 0 });
  }, [selected]);

  if (selected) return <PrayerDetail entry={selected} onOpen={setSelected} onBack={() => setSelected(null)} />;

  const q = normalize(query.trim());
  const results = q ? ALL.filter(({ prayer }) => normalize(prayer.titulo).includes(q) || normalize(prayer.texto).includes(q)) : [];
  const categories = filter ? prayerCategories.filter((c) => c.id === filter) : prayerCategories;

  return (
    <section class="screen">
      <PageHeader title="Orações" />

      <div class="prayer-search">
        <Icon name="search" size={18} class="prayer-search-icon" />
        <input
          type="search"
          class="prayer-search-input"
          placeholder="Buscar oração"
          aria-label="Buscar oração"
          value={query}
          onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
        />
        {query ? (
          <button type="button" class="prayer-search-clear" aria-label="Limpar busca" onClick={() => setQuery("")}>
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>

      {q ? (
        results.length ? (
          <div class="list">
            {results.map((entry) => (
              <PrayerRow key={entry.prayer.id} entry={entry} showCategory onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <p class="muted prayer-empty">Nenhuma oração encontrada para “{query.trim()}”.</p>
        )
      ) : (
        <>
          <div class="hero prayer-hero">
            <span class="prayer-hero-kicker">
              <Icon name="star" size={12} /> Oração do dia
            </span>
            <h2 class="prayer-hero-title">{daily.prayer.titulo}</h2>
            <p class="prayer-hero-excerpt">{excerpt(daily.prayer.texto, 120)}</p>
            <Button variant="secondary" icon="prayingHands" onClick={() => setSelected(daily)}>
              Rezar agora
            </Button>
          </div>

          <Card onClick={() => openOverlay({ kind: "rosary" })} class="entry-card">
            <span class="entry-icon">
              <Icon name="flower" size={20} />
            </span>
            <span class="entry-body">
              <span class="entry-title">Rezar o Terço</span>
              <span class="entry-excerpt">Mistérios do dia, passo a passo</span>
            </span>
            <Icon name="chevronRight" size={18} class="list-row-chevron" />
          </Card>

          <div class="h-scroll prayer-chips" role="group" aria-label="Filtrar por categoria">
            <Chip active={filter === null} onClick={() => setFilter(null)}>
              Todas
            </Chip>
            {prayerCategories.map((c) => (
              <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(filter === c.id ? null : c.id)}>
                {styleOf(c).short}
              </Chip>
            ))}
          </div>

          {categories.map((category) => {
            const style = styleOf(category);
            return (
              <div key={category.id} class="stack" style={toneVars(category)}>
                <div class="prayer-section-head">
                  <span class="prayer-section-icon">
                    <Icon name={style.icon} size={16} />
                  </span>
                  <h2 class="prayer-section-title">{category.nome}</h2>
                  <span class="prayer-section-count">{category.oracoes.length}</span>
                </div>
                <div class="list">
                  {category.oracoes.map((prayer) => (
                    <PrayerRow key={prayer.id} entry={{ prayer, category }} onOpen={setSelected} />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}
