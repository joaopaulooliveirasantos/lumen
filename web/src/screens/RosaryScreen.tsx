// Terço (tela sobreposta): escolha do mistério (sugerido pelo dia da semana) e oração passo a passo.
import { useEffect, useState } from "preact/hooks";
import { Icon, type IconName } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { PrayerPlayer } from "../components/PrayerPlayer";
import { Button, IconButton } from "../components/ui";
import { mysteryGroups, suggestedMysteryGroupFor } from "../data/rosaryMysteries";
import { formatIsoDate, formatReadableDate } from "../services/date";
import { buildRosarySteps } from "../services/rosary";
import { useAppState } from "../state/AppState";
import type { MysteryGroup, MysteryGroupId, RosaryStep } from "../types/rosary";

/** Ícone, cor (RGB) e adjetivo no singular de cada grupo de mistérios. */
const GROUP_STYLE: Record<MysteryGroupId, { icon: IconName; tone: string; singular: string }> = {
  gozosos: { icon: "heart", tone: "201, 110, 40", singular: "Gozoso" },
  dolorosos: { icon: "cross", tone: "123, 63, 143", singular: "Doloroso" },
  gloriosos: { icon: "crown", tone: "176, 131, 20", singular: "Glorioso" },
  luminosos: { icon: "sun", tone: "47, 111, 176", singular: "Luminoso" },
};

function toneVars(id: MysteryGroupId): Record<string, string> {
  const { tone } = GROUP_STYLE[id];
  return { "--tone": `rgb(${tone})`, "--tone-soft": `rgba(${tone}, 0.14)`, "--tone-rgb": tone };
}

/** Contas da dezena (ou das 3 Ave-Marias iniciais): rezadas, a atual e as que faltam. */
export function beadsFor(steps: RosaryStep[], step: RosaryStep): { total: number; done: number; current: boolean } | null {
  // Sem mistério, só as 3 Ave-Marias iniciais têm repetição; as orações finais não têm contas.
  const sameSegment = (s: RosaryStep) => s.misterioIndex === step.misterioIndex;
  if (step.misterioIndex === undefined && !step.repeticaoTotal) return null; // início e fim, fora das Ave-Marias
  const aves = steps.filter((s) => s.repeticaoTotal && sameSegment(s));
  if (!aves.length) return null;
  return { total: aves.length, done: aves.filter((s) => s.ordem < step.ordem).length, current: !!step.repeticaoTotal };
}

function Beads({ total, done, current }: { total: number; done: number; current: boolean }) {
  return (
    <div class="beads" role="img" aria-label={`${done + (current ? 1 : 0)} de ${total} Ave-Marias`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} class={i < done ? "bead bead-done" : i === done && current ? "bead bead-current" : "bead"} />
      ))}
    </div>
  );
}

function segmentLabel(step: RosaryStep, steps: RosaryStep[], group: MysteryGroup): string {
  if (step.misterioIndex !== undefined) return `${step.misterioIndex + 1}º Mistério ${GROUP_STYLE[group.id].singular}`;
  const firstMystery = steps.find((s) => s.misterioIndex !== undefined)?.ordem ?? 0;
  return step.ordem < firstMystery ? "Orações iniciais" : "Orações finais";
}

function GroupTile({ group, selected, suggested, onSelect }: { group: MysteryGroup; selected: boolean; suggested: boolean; onSelect: () => void }) {
  const style = GROUP_STYLE[group.id];
  return (
    <button type="button" class={selected ? "mystery-tile mystery-tile-selected" : "mystery-tile"} style={toneVars(group.id)} aria-pressed={selected} onClick={onSelect}>
      {suggested ? <span class="mystery-tile-today">Hoje</span> : null}
      <span class="mystery-tile-icon">
        <Icon name={style.icon} size={20} />
      </span>
      <span class="mystery-tile-name">{group.nome}</span>
      <span class="mystery-tile-days">{group.dias}</span>
    </button>
  );
}

export function RosaryScreen({ onExit }: { onExit: () => void }) {
  const { markRosaryPrayedToday, rosaryDays } = useAppState();
  const suggested = suggestedMysteryGroupFor(new Date());
  const [groupId, setGroupId] = useState<MysteryGroupId>(suggested);
  const [steps, setSteps] = useState<RosaryStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const group = mysteryGroups.find((g) => g.id === groupId) ?? mysteryGroups[0];
  const style = GROUP_STYLE[group.id];

  useEffect(() => {
    document.querySelector(".app-content")?.scrollTo({ top: 0 });
  }, [steps === null]);

  if (!steps) {
    const today = formatIsoDate(new Date());
    const prayedToday = rosaryDays.includes(today);
    const label = formatReadableDate(today);
    return (
      <section class="screen rosary-screen" style={toneVars(group.id)}>
        <PageHeader title="Terço" onBack={onExit} />

        <div class="hero rosary-hero">
          <span class="rosary-hero-kicker">{label.charAt(0).toUpperCase() + label.slice(1)}</span>
          <span class="rosary-hero-icon">
            <Icon name={style.icon} size={26} />
          </span>
          <h2 class="rosary-hero-title">Mistérios {group.nome}</h2>
          <p class="rosary-hero-sub">{group.id === suggested ? "Os mistérios de hoje" : `Rezados na ${group.dias.toLowerCase()}`}</p>
          <div class="rosary-hero-meta">
            <span>5 mistérios</span>
            <span aria-hidden="true">•</span>
            <span>cerca de 20 min</span>
          </div>
          {prayedToday ? (
            <span class="rosary-done">
              <Icon name="checkmark" size={14} /> Terço rezado hoje
            </span>
          ) : null}
        </div>

        <h3 class="rosary-section-title">Escolha os mistérios</h3>
        <div class="mystery-grid">
          {mysteryGroups.map((g) => (
            <GroupTile key={g.id} group={g} selected={g.id === groupId} suggested={g.id === suggested} onSelect={() => setGroupId(g.id)} />
          ))}
        </div>

        <h3 class="rosary-section-title">O que você vai contemplar</h3>
        <ol class="card mystery-list">
          {group.misterios.map((m, i) => (
            <li key={m} class="mystery-item">
              <span class="mystery-num">{i + 1}</span>
              <span class="mystery-text">{m}</span>
            </li>
          ))}
        </ol>

        <div class="amen-bar">
          <Button
            block
            icon="flower"
            class="rosary-start"
            onClick={() => {
              setSteps(buildRosarySteps(group.id));
              setIndex(0);
            }}
          >
            Iniciar o Terço
          </Button>
        </div>
      </section>
    );
  }

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const beads = beadsFor(steps, step);
  const currentMystery = step.misterioIndex ?? (step.ordem < (steps.find((s) => s.misterioIndex !== undefined)?.ordem ?? 0) ? -1 : 5);
  const back = () => (index === 0 ? setSteps(null) : setIndex((i) => i - 1));

  async function next() {
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    setFinished(true);
    await markRosaryPrayedToday();
    setTimeout(onExit, 1500);
  }

  return (
    <section class="screen rosary-screen" style={toneVars(group.id)}>
      <PageHeader title={`Terço · ${group.nome}`} onBack={back} action={<IconButton icon="close" label="Sair do terço" onClick={onExit} />} />

      <div class="rosary-track">
        <div class="rosary-track-head">
          <span>{segmentLabel(step, steps, group)}</span>
          <span class="muted">
            {step.ordem}/{steps.length}
          </span>
        </div>
        <div class="rosary-track-bar">
          <span style={{ width: `${(step.ordem / steps.length) * 100}%` }} />
        </div>
        <div class="rosary-mysteries" aria-hidden="true">
          {group.misterios.map((_, i) => (
            <span key={i} class={i < currentMystery ? "rm rm-done" : i === currentMystery ? "rm rm-current" : "rm"}>
              {i < currentMystery ? <Icon name="checkmark" size={11} /> : i + 1}
            </span>
          ))}
        </div>
      </div>

      <PrayerPlayer key={step.ordem} text={`${step.titulo}. ${step.texto}`} shareText={`${step.titulo}\n\n${step.texto}`} title={step.titulo} resetKey={step.ordem} />

      {step.kind === "anuncio-misterio" ? (
        <article class="card mystery-announce">
          <span class="mystery-announce-icon">
            <Icon name={style.icon} size={24} />
          </span>
          <span class="mystery-announce-kicker">
            {step.titulo} {style.singular}
          </span>
          <p class="mystery-announce-text">{step.texto}</p>
          <p class="mystery-announce-hint">Contemple este mistério em silêncio e, quando quiser, siga para o Pai-Nosso.</p>
        </article>
      ) : (
        <article class="card rosary-card">
          <h2 class="rosary-card-title">{step.titulo}</h2>
          {beads ? <Beads {...beads} /> : null}
          {step.repeticaoTotal ? (
            <span class="repeat-badge">
              {step.repeticaoAtual}ª de {step.repeticaoTotal}
            </span>
          ) : null}
          <p class="reading-text">{step.texto}</p>
        </article>
      )}

      <div class="amen-bar amen-row">
        <Button variant="secondary" icon="chevronLeft" onClick={back}>
          Voltar
        </Button>
        <Button class="flex-1 rosary-start" icon={isLast ? "flower" : undefined} onClick={() => void next()}>
          {isLast ? "Finalizar terço" : "Próxima"}
        </Button>
      </div>
      {finished ? (
        <div class="amen-burst" aria-hidden="true">
          <Icon name="flower" size={120} />
        </div>
      ) : null}
    </section>
  );
}
