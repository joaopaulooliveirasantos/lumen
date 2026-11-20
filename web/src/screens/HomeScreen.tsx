import { useEffect, useState } from "preact/hooks";
import { Icon } from "../components/Icon";
import { Alert, Button, Card, HeroCard, Spinner } from "../components/ui";
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
      <HeroCard>
        <Icon name="cross" size={26} class="loading-cross" />
        <p style={{ margin: "8px 0 2px", fontSize: "1.2rem", fontWeight: 900, letterSpacing: "0.2em" }}>LUMEN</p>
        <p class="muted">{formatReadableDate(date)}</p>
        {payload ? <p style={{ margin: "6px 0 0", fontWeight: 700 }}>{payload.liturgia}</p> : null}
      </HeroCard>

      {loading ? (
        <div class="row" style={{ justifyContent: "center", padding: "16px" }}>
          <Spinner label="Carregando liturgia" />
        </div>
      ) : null}

      {error ? (
        <Alert
          tone="error"
          title="Não foi possível carregar a liturgia"
          action={
            <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      {payload ? (
        <Card>
          <p class="muted">Cor litúrgica: {payload.cor}</p>
          <p class="muted">Evangelho: {payload.evangelho.referencia}</p>
        </Card>
      ) : null}

      {payload && offline ? <Alert tone="info">Exibindo versão salva no aparelho.</Alert> : null}
    </section>
  );
}
