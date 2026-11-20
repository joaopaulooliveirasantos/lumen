// Terço (tela sobreposta): escolha do mistério (sugerido pelo dia da semana) e oração passo a passo.
import { useState } from "preact/hooks";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { PrayerPlayer } from "../components/PrayerPlayer";
import { Button, Card, IconButton, SectionTitle } from "../components/ui";
import { mysteryGroups, suggestedMysteryGroupFor } from "../data/rosaryMysteries";
import { formatIsoDate, formatReadableDate } from "../services/date";
import { buildRosarySteps } from "../services/rosary";
import { useAppState } from "../state/AppState";
import type { MysteryGroupId, RosaryStep } from "../types/rosary";

export function RosaryScreen({ onExit }: { onExit: () => void }) {
  const { markRosaryPrayedToday, rosaryDays } = useAppState();
  const [group, setGroup] = useState<MysteryGroupId>(() => suggestedMysteryGroupFor(new Date()));
  const [steps, setSteps] = useState<RosaryStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const close = <IconButton icon="close" label="Sair do terço" onClick={onExit} />;

  if (!steps) {
    const today = formatIsoDate(new Date());
    const prayedToday = rosaryDays.includes(today);
    const label = formatReadableDate(today);
    return (
      <section class="screen">
        <PageHeader title="Terço" onBack={onExit} />
        <div class="hero rosary-hero">
          <span class="rosary-ornament">
            <span />
            <Icon name="flower" size={18} />
            <span />
          </span>
          <p class="rosary-title">TERÇO</p>
          <p class="muted">{label.charAt(0).toUpperCase() + label.slice(1)}</p>
          {prayedToday ? <p class="rosary-done">✓ Terço rezado hoje</p> : null}
        </div>
        <SectionTitle>Escolher mistério</SectionTitle>
        <div class="stack">
          {mysteryGroups.map((g) => (
            <Card key={g.id} class={g.id === group ? "card-selected" : undefined}>
              <button type="button" class="translation-head" aria-pressed={g.id === group} onClick={() => setGroup(g.id)}>
                <span class="list-row-body">
                  <span class="list-row-title">Mistérios {g.nome}</span>
                  <span class="list-row-subtitle">{g.dias}</span>
                </span>
                {g.id === group ? <Icon name="checkmark" size={20} class="text-accent" /> : <span class="radio-dot" />}
              </button>
            </Card>
          ))}
        </div>
        <div class="amen-bar">
          <Button
            block
            onClick={() => {
              setSteps(buildRosarySteps(group));
              setIndex(0);
            }}
          >
            Iniciar oração
          </Button>
        </div>
      </section>
    );
  }

  const step = steps[index];
  const isLast = index === steps.length - 1;

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
    <section class="screen">
      <PageHeader title={step.titulo} onBack={() => (index === 0 ? setSteps(null) : setIndex((i) => i - 1))} action={close} />
      <PrayerPlayer key={step.ordem} text={`${step.titulo}. ${step.texto}`} shareText={`${step.titulo}\n\n${step.texto}`} title={step.titulo} resetKey={step.ordem} />
      <div class="rosary-progress">
        <span class="muted">
          Passo {step.ordem} de {steps.length}
        </span>
        <progress class="progress" max={steps.length} value={step.ordem} />
      </div>
      <Card>
        {step.misterioIndex !== undefined ? <p class="reading-kicker">Mistério {step.misterioIndex + 1} de 5</p> : null}
        <h2 class="reading-title">{step.titulo}</h2>
        {step.repeticaoTotal ? (
          <span class="repeat-badge">
            {step.repeticaoAtual}ª de {step.repeticaoTotal}
          </span>
        ) : null}
        <p class="reading-text">{step.texto}</p>
      </Card>
      <div class="amen-bar amen-row">
        <Button variant="secondary" icon="chevronLeft" onClick={() => (index === 0 ? setSteps(null) : setIndex((i) => i - 1))}>
          Voltar
        </Button>
        <Button class="flex-1" icon={isLast ? "flower" : undefined} onClick={() => void next()}>
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
