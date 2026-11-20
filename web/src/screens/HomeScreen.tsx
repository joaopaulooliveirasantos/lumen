import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { Icon } from "../components/Icon";
import { ReadingPlanCard } from "../components/ReadingPlanCard";
import { DatePickerSheet } from "../components/Sheet";
import { Alert, Button, Card, SectionTitle, Spinner } from "../components/ui";
import { readingPlans } from "../data/readingPlans";
import { formatIsoDate, getDateParts, getWeekDays } from "../services/date";
import { getPlanStatus } from "../services/readingPlans";
import { useAppState } from "../state/AppState";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function Hero({ onOpenCalendar }: { onOpenCalendar: () => void }) {
  const { selectedDate, liturgy, liturgyOffline } = useAppState();
  const { day, monthAbbr, year } = getDateParts(selectedDate);
  return (
    <div class="hero home-hero">
      <div class="home-hero-top">
        <div class="home-hero-date">
          <span class="home-hero-day">{day}</span>
          <span class="home-hero-month-year">
            <span>{monthAbbr}</span>
            <span>{year}</span>
          </span>
        </div>
        <div class="home-hero-brand">
          <Icon name="cross" size={14} class="loading-cross" />
          <span>LUMEN</span>
        </div>
        <button type="button" class="icon-btn hero-calendar" aria-label="Escolher outra data" onClick={onOpenCalendar}>
          <Icon name="calendar" size={18} />
        </button>
      </div>
      {liturgy ? <p class="home-hero-liturgy">{liturgy.liturgia}</p> : null}
      {liturgyOffline ? <p class="home-hero-offline">Exibindo conteúdo salvo offline</p> : null}
    </div>
  );
}

function WeekProgress() {
  const { readDays, rosaryDays } = useAppState();
  const today = formatIsoDate(new Date());
  const week = getWeekDays(today);
  const read = new Set(readDays);
  const rosary = new Set(rosaryDays);
  return (
    <Card>
      <div class="week-head">
        <span class="week-title">Progresso da semana</span>
        <span class="week-stats">
          <Icon name="book" size={12} /> {week.filter((d) => read.has(d)).length}/7
          <Icon name="flower" size={12} /> {week.filter((d) => rosary.has(d)).length}/7
        </span>
      </div>
      <div class="week-strip">
        {week.map((d, i) => (
          <span key={d} class="week-day">
            <span class="week-label">{WEEKDAYS[i]}</span>
            <span
              class={`week-dot${read.has(d) ? " week-read" : ""}${d === today ? " week-today" : ""}`}
              title={`${d}${read.has(d) ? " · liturgia lida" : ""}${rosary.has(d) ? " · terço rezado" : ""}`}
            >
              {rosary.has(d) ? <span class="week-rosary" /> : null}
            </span>
          </span>
        ))}
      </div>
      <p class="week-legend">
        <span class="week-dot week-read week-mini" /> Liturgia lida <span class="week-dot week-mini">
          <span class="week-rosary" />
        </span>{" "}
        Terço rezado
      </p>
    </Card>
  );
}

function EntryCard(props: { icon: "star" | "book" | "flower"; label?: string; title: string; children?: ComponentChildren; onClick: () => void }) {
  return (
    <Card onClick={props.onClick} class="entry-card">
      <span class="entry-icon">
        <Icon name={props.icon} size={20} />
      </span>
      <span class="entry-body">
        {props.label ? <span class="entry-label">{props.label}</span> : null}
        <span class="entry-title">{props.title}</span>
        {props.children}
      </span>
      <Icon name="chevronRight" size={18} class="list-row-chevron" />
    </Card>
  );
}

export function HomeScreen() {
  const app = useAppState();
  const [calendar, setCalendar] = useState(false);
  const featured = readingPlans.filter((p) => p.destaque);
  const liturgy = app.liturgy;
  const excerpt = liturgy ? (liturgy.evangelho.texto.length > 140 ? `${liturgy.evangelho.texto.slice(0, 140).trim()}…` : liturgy.evangelho.texto) : "";

  return (
    <section class="screen">
      <Hero onOpenCalendar={() => setCalendar(true)} />

      <SectionTitle action={<Button variant="ghost" onClick={() => app.openOverlay({ kind: "plans", planId: null })}>Ver todos</Button>}>Planos de leitura</SectionTitle>
      <div class="h-scroll">
        {featured.map((plan) => (
          <ReadingPlanCard key={plan.id} plan={plan} size="carrossel" statusInfo={getPlanStatus(plan, app.planProgress[plan.id])} onPress={() => app.openOverlay({ kind: "plans", planId: plan.id })} />
        ))}
      </div>

      <WeekProgress />

      {!app.saintLoading && app.saint?.santos?.length ? (
        <EntryCard icon="star" label="Santo do dia" title={app.saint.santos.join(" · ")} onClick={() => app.openOverlay({ kind: "saintStory" })} />
      ) : null}

      {liturgy && !app.liturgyLoading ? (
        <EntryCard icon="book" label={app.selectedDate === app.today ? "Liturgia de hoje" : "Liturgia do dia"} title={liturgy.liturgia} onClick={() => app.setActiveTab("liturgia")}>
          <span class="entry-ref">Evangelho: {liturgy.evangelho.referencia}</span>
          <span class="entry-excerpt">{excerpt}</span>
        </EntryCard>
      ) : null}

      <EntryCard icon="flower" title="Rezar o Terço" onClick={() => app.openOverlay({ kind: "rosary" })}>
        <span class="entry-excerpt">Contemple os mistérios com Nossa Senhora</span>
      </EntryCard>

      {app.liturgyLoading ? (
        <div class="row" style={{ justifyContent: "center", padding: "12px" }}>
          <Spinner label="Atualizando dados do dia" />
        </div>
      ) : null}

      {!app.liturgyLoading && app.liturgyError ? (
        <Alert tone="error" title="Não foi possível carregar a liturgia." action={<Button variant="secondary" onClick={app.retryLiturgy}>Tentar novamente</Button>}>
          {app.liturgyError}
        </Alert>
      ) : null}

      {calendar ? <DatePickerSheet selectedDate={app.selectedDate} onSelect={app.setSelectedDate} onClose={() => setCalendar(false)} /> : null}
    </section>
  );
}
