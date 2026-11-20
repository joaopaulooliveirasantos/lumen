import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { useState } from "preact/hooks";
import { formatIsoDate, getMonthCalendarDays, MONTH_NAMES_PT } from "../services/date";
import { Button, IconButton } from "./ui";

/** Folha modal que sobe de baixo (equivalente ao Modal do RN). Fecha no fundo, no X e no Esc. */
export function Sheet(props: { title: string; onClose: () => void; children: ComponentChildren }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && props.onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.onClose]);

  return (
    <div class="sheet-backdrop" onClick={props.onClose}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={props.title} onClick={(e) => e.stopPropagation()}>
        <div class="sheet-head">
          <h2>{props.title}</h2>
          <IconButton icon="close" label="Fechar" onClick={props.onClose} />
        </div>
        <div class="sheet-body">{props.children}</div>
      </div>
    </div>
  );
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Calendário mensal para escolher a data da liturgia. */
export function DatePickerSheet(props: { selectedDate: string; onSelect: (date: string) => void; onClose: () => void }) {
  const [cursor, setCursor] = useState(() => {
    const [year, month] = props.selectedDate.split("-").map(Number);
    return { year, month };
  });
  const today = formatIsoDate(new Date());
  const days = getMonthCalendarDays(cursor.year, cursor.month);

  const move = (delta: number) =>
    setCursor(({ year, month }) => {
      const m = month + delta;
      return m > 12 ? { year: year + 1, month: 1 } : m < 1 ? { year: year - 1, month: 12 } : { year, month: m };
    });
  const pick = (date: string) => {
    props.onSelect(date);
    props.onClose();
  };

  return (
    <Sheet title="Escolher data" onClose={props.onClose}>
      <div class="cal-head">
        <IconButton icon="chevronLeft" label="Mês anterior" onClick={() => move(-1)} />
        <span class="cal-month">
          {MONTH_NAMES_PT[cursor.month - 1]} {cursor.year}
        </span>
        <IconButton icon="chevronRight" label="Próximo mês" onClick={() => move(1)} />
      </div>
      <div class="cal-grid" role="grid">
        {WEEKDAYS.map((d, i) => (
          <span key={`w${i}`} class="cal-weekday">
            {d}
          </span>
        ))}
        {days.map((day, i) =>
          day ? (
            <button
              key={day}
              type="button"
              class={`cal-day${day === props.selectedDate ? " cal-selected" : ""}${day === today ? " cal-today" : ""}`}
              aria-label={day}
              aria-pressed={day === props.selectedDate}
              onClick={() => pick(day)}
            >
              {Number(day.slice(8))}
            </button>
          ) : (
            <span key={`e${i}`} />
          ),
        )}
      </div>
      <Button block variant="secondary" onClick={() => pick(today)}>
        Hoje
      </Button>
    </Sheet>
  );
}
