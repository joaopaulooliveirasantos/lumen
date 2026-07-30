export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const source = new Date(`${isoDate}T00:00:00`);
  source.setDate(source.getDate() + days);
  return formatIsoDate(source);
}

export function formatReadableDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function getWeekDays(isoDate: string): string[] {
  const date = new Date(`${isoDate}T00:00:00`);
  const dayOfWeek = date.getDay(); // 0 = domingo
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return formatIsoDate(d);
  });
}

export function getMonthCalendarDays(year: number, month: number): (string | null)[] {
  // month é 1-indexed
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDow = firstDay.getDay(); // 0 = domingo

  const cells: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(formatIsoDate(new Date(year, month - 1, d)));
  }
  return cells;
}

export const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
