// Planos de leitura (tela sobreposta): destaques, todos (com busca), detalhe do plano e leitura do dia.
// Os trechos bíblicos vêm da VPS sob demanda (services/bible.ts), com cache para leitura offline.
import { useEffect, useState } from "preact/hooks";
import { Icon } from "../components/Icon";
import { FontScaleControls, PageHeader } from "../components/PageHeader";
import { ReadingPlanCard } from "../components/ReadingPlanCard";
import { Alert, Button, Card, EmptyState, IconButton, SectionTitle, Spinner, TextField } from "../components/ui";
import { readingPlans } from "../data/readingPlans";
import { BibleUnavailableError, loadBibleBook } from "../services/bible";
import { CATEGORY_LABELS, formatReference, getPlanStatus, resolveReference, type ResolvedPassage } from "../services/readingPlans";
import { useAppState } from "../state/AppState";
import type { ReadingPlan, ReadingPlanDay } from "../types/readingPlan";

type View = "destaques" | "todos" | "detalhe" | "leitura";

export function ReadingPlansScreen({ initialPlanId, onExit }: { initialPlanId: string | null; onExit: () => void }) {
  const { planProgress } = useAppState();
  const initialPlan = initialPlanId ? (readingPlans.find((p) => p.id === initialPlanId) ?? null) : null;
  const [view, setView] = useState<View>(initialPlan ? "detalhe" : "destaques");
  const [plan, setPlan] = useState<ReadingPlan | null>(initialPlan);
  const [dayNum, setDayNum] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const openPlan = (p: ReadingPlan) => {
    setPlan(p);
    setView("detalhe");
  };
  const back = () => {
    if (view === "leitura") setView("detalhe");
    else if (view === "detalhe") setView("destaques");
    else if (view === "todos") setView("destaques");
    else onExit();
  };
  const close = <IconButton icon="close" label="Fechar planos" onClick={onExit} />;

  if (view === "leitura" && plan && dayNum !== null) {
    return <DayReading plan={plan} dayNum={dayNum} setDayNum={setDayNum} onBack={back} onFinished={() => setView("detalhe")} />;
  }

  if (view === "detalhe" && plan) {
    const status = getPlanStatus(plan, planProgress[plan.id]);
    const done = new Set(planProgress[plan.id]?.diasConcluidos ?? []);
    const action = status.status === "nao-iniciado" ? "Iniciar plano" : status.status === "concluido" ? "Ler de novo" : `Continuar — Dia ${status.proximoDia}`;
    return (
      <section class="screen">
        <PageHeader title={plan.titulo} onBack={back} action={close} />
        <div class="plan-cover" style={{ backgroundColor: plan.capa.corBase }}>
          <img src={plan.capa.imagem} alt="" />
        </div>
        <div>
          <h2 class="plan-title">{plan.titulo}</h2>
          <p class="muted" style={{ margin: "2px 0" }}>
            {plan.subtitulo}
          </p>
          <p class="plan-meta">
            {plan.duracaoDias} dias · {CATEGORY_LABELS[plan.categoria] ?? plan.categoria}
            {status.status !== "nao-iniciado" ? ` · ${status.diasConcluidos}/${plan.duracaoDias} concluídos` : ""}
          </p>
        </div>
        <div class="list">
          {plan.dias.map((day) => (
            <button key={day.dia} type="button" class="list-row" aria-label={`Dia ${day.dia}: ${day.titulo}${done.has(day.dia) ? ", concluído" : ""}`} onClick={() => (setDayNum(day.dia), setView("leitura"))}>
              <span class={done.has(day.dia) ? "day-num day-done" : "day-num"}>{done.has(day.dia) ? <Icon name="checkmark" size={16} /> : day.dia}</span>
              <span class="list-row-body">
                <span class="list-row-title">{day.titulo}</span>
              </span>
              <Icon name="chevronRight" size={18} class="list-row-chevron" />
            </button>
          ))}
        </div>
        <div class="amen-bar">
          <Button block onClick={() => (setDayNum(status.status === "concluido" ? 1 : status.proximoDia), setView("leitura"))}>
            {action}
          </Button>
        </div>
      </section>
    );
  }

  if (view === "todos") {
    const q = query.trim().toLowerCase();
    const plans = q ? readingPlans.filter((p) => p.titulo.toLowerCase().includes(q) || p.subtitulo.toLowerCase().includes(q)) : readingPlans;
    return (
      <section class="screen">
        <PageHeader title="Todos os planos" onBack={back} action={close} />
        <TextField label="Pesquisar" icon="book" value={query} onInput={setQuery} placeholder="Pesquisar planos..." />
        {plans.length === 0 ? (
          <Card>
            <EmptyState icon="book" title={`Nenhum plano encontrado para "${query}".`} />
          </Card>
        ) : (
          <div class="list">
            {plans.map((p) => (
              <ReadingPlanCard key={p.id} plan={p} size="lista" statusInfo={getPlanStatus(p, planProgress[p.id])} onPress={() => openPlan(p)} />
            ))}
          </div>
        )}
      </section>
    );
  }

  const featured = readingPlans.filter((p) => p.destaque);
  return (
    <section class="screen">
      <PageHeader title="Planos de Leitura" onBack={onExit} />
      <SectionTitle>Em destaque</SectionTitle>
      <div class="list">
        {featured.map((p) => (
          <ReadingPlanCard key={p.id} plan={p} size="lista" statusInfo={getPlanStatus(p, planProgress[p.id])} onPress={() => openPlan(p)} />
        ))}
      </div>
      <Button block variant="secondary" onClick={() => setView("todos")}>
        Ver todos os planos ({readingPlans.length})
      </Button>
    </section>
  );
}

// ---- Leitura do dia ------------------------------------------------------------------------------

type PassageState = { status: "loading" } | { status: "ok"; passages: ResolvedPassage[][] } | { status: "error"; message: string };

function usePassages(day: ReadingPlanDay | undefined, translation: Parameters<typeof loadBibleBook>[0]): [PassageState, () => void] {
  const [state, setState] = useState<PassageState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!day) return;
    let active = true;
    setState({ status: "loading" });
    Promise.all(day.referencias.map((ref) => resolveReference(ref, translation, loadBibleBook)))
      .then((passages) => active && setState({ status: "ok", passages }))
      .catch((e: unknown) => active && setState({ status: "error", message: e instanceof BibleUnavailableError ? e.message : "Não foi possível carregar o texto bíblico." }));
    return () => {
      active = false;
    };
  }, [day, translation, attempt]);
  return [state, () => setAttempt((n) => n + 1)];
}

function DayReading(props: { plan: ReadingPlan; dayNum: number; setDayNum: (n: number) => void; onBack: () => void; onFinished: () => void }) {
  const { plan, dayNum } = props;
  const { settings, planProgress, completePlanDay, openBibleAt, notify } = useAppState();
  const day = plan.dias.find((d) => d.dia === dayNum);
  const [passages, retry] = usePassages(day, settings.bibleTranslation);
  const [burst, setBurst] = useState(0);
  if (!day) return null;

  const isDone = (planProgress[plan.id]?.diasConcluidos ?? []).includes(day.dia);
  const hasPrev = plan.dias.some((d) => d.dia === day.dia - 1);
  const hasNext = plan.dias.some((d) => d.dia === day.dia + 1);

  async function amen() {
    setBurst((n) => n + 1);
    await completePlanDay(plan.id, day!.dia, plan.duracaoDias);
    if (day!.dia >= plan.duracaoDias) {
      notify(`Você concluiu "${plan.titulo}". 🙏`);
      setTimeout(props.onFinished, 1400);
    }
  }

  return (
    <section class="screen">
      <PageHeader title={`Dia ${day.dia} de ${plan.duracaoDias}`} onBack={props.onBack} action={<FontScaleControls />} />
      <h2 class="reading-title" style={{ margin: "4px 4px 0" }}>
        {day.titulo}
      </h2>

      {passages.status === "error" ? (
        <Alert tone="error" title="Texto indisponível" action={<Button variant="secondary" onClick={retry}>Tentar novamente</Button>}>
          {passages.message} Em Configurações, você pode baixar a Bíblia para ler sem internet.
        </Alert>
      ) : null}

      {day.referencias.map((ref, i) => (
        <Card key={`${ref.livro}-${ref.capituloInicio}-${i}`}>
          <button type="button" class="ref-link" onClick={() => openBibleAt({ livro: ref.livro, capitulo: ref.capituloInicio, versiculoInicio: ref.versiculoInicio })}>
            <Icon name="bible" size={16} />
            <span>{formatReference(ref)}</span>
            <Icon name="chevronRight" size={16} class="list-row-chevron" />
          </button>
          {passages.status === "loading" ? (
            <div class="row" style={{ padding: "12px 0" }}>
              <Spinner size={18} /> <span class="muted">Carregando texto…</span>
            </div>
          ) : passages.status === "ok" ? (
            passages.passages[i].length === 0 ? (
              <p class="muted">Este trecho não existe na tradução escolhida. Toque na referência para abrir a Bíblia.</p>
            ) : (
              passages.passages[i].map((p) => (
                <div key={`${p.livro}-${p.capitulo}`} class="passage">
                  <p class="passage-ref">
                    {p.livro} {p.capitulo}
                  </p>
                  <p class="reading-text">
                    {p.versiculos.map((v) => (
                      <span key={v.versiculo}>
                        <sup class="verse-num">{v.versiculo}</sup>
                        {v.texto}{" "}
                      </span>
                    ))}
                  </p>
                </div>
              ))
            )
          ) : null}
        </Card>
      ))}

      {day.catecismo ? (
        <Card class="cic-card">
          <p class="reading-kicker">Catecismo da Igreja Católica, nº {day.catecismo.paragrafo}</p>
          <p class="cic-theme">{day.catecismo.tema}</p>
          <p class="reading-text cic-text">“{day.catecismo.trecho}”</p>
        </Card>
      ) : null}

      <div class="amen-bar amen-row">
        <Button variant="secondary" icon="chevronLeft" disabled={!hasPrev} onClick={() => props.setDayNum(day.dia - 1)}>
          Anterior
        </Button>
        {isDone ? (
          <Button disabled={!hasNext} onClick={() => props.setDayNum(day.dia + 1)} class="flex-1">
            Próximo dia
          </Button>
        ) : (
          <Button icon="prayingHands" onClick={() => void amen()} class="flex-1">
            Amém
          </Button>
        )}
      </div>
      {burst ? (
        <div key={burst} class="amen-burst" aria-hidden="true">
          <Icon name="prayingHands" size={120} />
        </div>
      ) : null}
    </section>
  );
}
