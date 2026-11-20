import { useEffect, useState } from "preact/hooks";
import { Icon } from "../components/Icon";
import { LiturgyPlayer } from "../components/LiturgyPlayer";
import { DatePickerSheet } from "../components/Sheet";
import { Alert, Button, Card, EmptyState, IconButton, Spinner } from "../components/ui";
import { EVANGELHO_RESPONSE, LEITURA_RESPONSE } from "../data/liturgyResponses";
import { formatReadableDate, getDateParts } from "../services/date";
import { useAppState } from "../state/AppState";
import type { ReadingBlock, ReadingTabKey } from "../types/liturgy";

function DateHeader({ date, onOpenCalendar }: { date: string; onOpenCalendar: () => void }) {
  const { day, monthAbbr, year } = getDateParts(date);
  return (
    <header class="page-header">
      <span class="date-block">
        <span class="date-day">{day}</span>
        <span class="date-month-year">
          <span class="date-month">{monthAbbr}</span>
          <span class="date-year">{year}</span>
        </span>
      </span>
      <h1 class="page-header-title">Liturgia Diária</h1>
      <IconButton icon="calendar" label="Escolher outra data" onClick={onOpenCalendar} />
    </header>
  );
}

function Reading({ title, reading, call, response }: { title: string; reading: ReadingBlock; call: string; response: string }) {
  return (
    <Card>
      <p class="reading-kicker">{title}</p>
      <p class="reading-ref">{reading.referencia}</p>
      <h2 class="reading-title">{reading.titulo}</h2>
      <p class="reading-text">{reading.texto}</p>
      <div class="reading-closing">
        <p class="reading-call">{call}</p>
        <p class="reading-response">{response}</p>
      </div>
    </Card>
  );
}

export function LiturgyScreen() {
  const { selectedDate, setSelectedDate, liturgy, liturgyLoading, liturgyError, liturgyOffline, retryLiturgy, readDays, markSelectedDayAsRead } = useAppState();
  const [tab, setTab] = useState<ReadingTabKey>("leitura1");
  const [calendar, setCalendar] = useState(false);
  const [amenBurst, setAmenBurst] = useState(0);

  useEffect(() => setTab("leitura1"), [selectedDate]);

  const calendarSheet = calendar ? <DatePickerSheet selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setCalendar(false)} /> : null;

  if (liturgyLoading) {
    return (
      <section class="screen">
        <DateHeader date={selectedDate} onOpenCalendar={() => setCalendar(true)} />
        <div class="row" style={{ justifyContent: "center", padding: "40px 0" }}>
          <Spinner label="Carregando as leituras do dia" />
        </div>
        {calendarSheet}
      </section>
    );
  }

  if (!liturgy) {
    return (
      <section class="screen">
        <DateHeader date={selectedDate} onOpenCalendar={() => setCalendar(true)} />
        <Card>
          <EmptyState icon="book" title={`Nenhuma leitura disponível para ${formatReadableDate(selectedDate)}.`} action={<Button variant="secondary" onClick={retryLiturgy}>Tentar novamente</Button>}>
            {liturgyError ?? "Escolha outro dia no calendário."}
          </EmptyState>
        </Card>
        {calendarSheet}
      </section>
    );
  }

  const tabs: { key: ReadingTabKey; label: string }[] = [
    { key: "leitura1", label: "1ª Leitura" },
    { key: "salmo", label: "Salmo" },
    ...(liturgy.segundaLeitura ? [{ key: "leitura2" as const, label: "2ª Leitura" }] : []),
    { key: "evangelho", label: "Evangelho" },
    { key: "homilia", label: "Homilia" },
  ];
  const current = tabs.some((t) => t.key === tab) ? tab : "leitura1";
  const isRead = readDays.includes(selectedDate);

  return (
    <section class="screen liturgy-screen">
      <DateHeader date={selectedDate} onOpenCalendar={() => setCalendar(true)} />
      <p class="liturgy-name">{liturgy.liturgia}</p>

      <div class="segmented" role="tablist" aria-label="Leituras do dia">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={t.key === current} class={t.key === current ? "segmented-item segmented-active" : "segmented-item"} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <LiturgyPlayer payload={liturgy} activeTrack={current} onTrackChange={setTab} />

      {liturgyOffline ? <Alert tone="info">Exibindo versão salva no aparelho.</Alert> : null}

      {current === "leitura1" ? <Reading title="Primeira Leitura" reading={liturgy.primeiraLeitura} call={LEITURA_RESPONSE.call} response={LEITURA_RESPONSE.response} /> : null}
      {current === "salmo" ? (
        <Card>
          <p class="reading-kicker">Salmo Responsorial</p>
          <p class="reading-ref">{liturgy.salmo.referencia}</p>
          <p class="psalm-refrain">{liturgy.salmo.refrao}</p>
          <p class="reading-text">{liturgy.salmo.texto}</p>
        </Card>
      ) : null}
      {current === "leitura2" && liturgy.segundaLeitura ? (
        <Reading title="Segunda Leitura" reading={liturgy.segundaLeitura} call={LEITURA_RESPONSE.call} response={LEITURA_RESPONSE.response} />
      ) : null}
      {current === "evangelho" ? <Reading title="Evangelho" reading={liturgy.evangelho} call={EVANGELHO_RESPONSE.call} response={EVANGELHO_RESPONSE.response} /> : null}
      {current === "homilia" ? (
        <Card>
          <p class="reading-kicker">Homilia</p>
          <h2 class="reading-title">{liturgy.reflexao.titulo}</h2>
          {liturgy.reflexao.autor ? <p class="reading-ref">{liturgy.reflexao.autor}</p> : null}
          <p class="reading-text">{liturgy.reflexao.texto}</p>
          {liturgy.reflexao.fonte ? <p class="muted" style={{ marginTop: "12px" }}>{liturgy.reflexao.fonte}</p> : null}
          {liturgy.reflexao.audioUrl ? <audio class="audio" controls preload="none" src={liturgy.reflexao.audioUrl} /> : null}
        </Card>
      ) : null}

      <div class="amen-bar">
        <Button
          block
          variant={isRead ? "secondary" : "primary"}
          icon={isRead ? "checkmark" : "prayingHands"}
          onClick={() => {
            setAmenBurst((n) => n + 1);
            void markSelectedDayAsRead();
          }}
        >
          Amém
        </Button>
      </div>

      {amenBurst ? (
        <div key={amenBurst} class="amen-burst" aria-hidden="true">
          <Icon name="prayingHands" size={120} />
        </div>
      ) : null}
      {calendarSheet}
    </section>
  );
}
