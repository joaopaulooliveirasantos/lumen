import { useEffect, useState } from "preact/hooks";
import { formatReadableDate } from "../services/date";
import { loadLiturgy } from "../services/liturgy";
import type { DailyLiturgyPayload } from "../types/liturgy";

type Props = {
  date: string;
  onLiturgyLoaded: (payload: DailyLiturgyPayload | null) => void;
};

export function HomeScreen({ date, onLiturgyLoaded }: Props) {
  const [payload, setPayload] = useState<DailyLiturgyPayload | null>(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadLiturgy(date)
      .then((result) => {
        if (cancelled) return;
        setPayload(result.payload);
        setOffline(result.offline);
        onLiturgyLoaded(result.payload);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setPayload(null);
        setError(e instanceof Error ? e.message : "Falha ao carregar a liturgia.");
        onLiturgyLoaded(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, attempt]);

  return (
    <section class="screen">
      <p class="muted">{formatReadableDate(date)}</p>
      {loading ? <p class="muted">Carregando liturgia…</p> : null}
      {error ? (
        <div class="card">
          <p>{error}</p>
          <button type="button" class="primary-button" onClick={() => setAttempt((n) => n + 1)}>
            Tentar novamente
          </button>
        </div>
      ) : null}
      {payload ? (
        <div class="card">
          <h1 class="title">{payload.liturgia}</h1>
          <p class="muted">Cor litúrgica: {payload.cor}</p>
          <p class="muted">Evangelho: {payload.evangelho.referencia}</p>
          {offline ? <p class="muted">Exibindo versão salva no aparelho.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
