// Home provisória (a versão completa vem no fim da Fase 6): usa a liturgia do estado global.
import { Icon } from "../components/Icon";
import { Alert, Button, Card, HeroCard, Spinner } from "../components/ui";
import { formatReadableDate } from "../services/date";
import { useAppState } from "../state/AppState";

export function HomeScreen() {
  const { selectedDate, liturgy, liturgyLoading, liturgyError, liturgyOffline, retryLiturgy } = useAppState();

  return (
    <section class="screen">
      <HeroCard>
        <Icon name="cross" size={26} class="loading-cross" />
        <p style={{ margin: "8px 0 2px", fontSize: "1.2rem", fontWeight: 900, letterSpacing: "0.2em" }}>LUMEN</p>
        <p class="muted">{formatReadableDate(selectedDate)}</p>
        {liturgy ? <p style={{ margin: "6px 0 0", fontWeight: 700 }}>{liturgy.liturgia}</p> : null}
      </HeroCard>

      {liturgyLoading ? (
        <div class="row" style={{ justifyContent: "center", padding: "16px" }}>
          <Spinner label="Carregando liturgia" />
        </div>
      ) : null}

      {liturgyError ? (
        <Alert
          tone="error"
          title="Não foi possível carregar a liturgia"
          action={
            <Button variant="secondary" onClick={retryLiturgy}>
              Tentar novamente
            </Button>
          }
        >
          {liturgyError}
        </Alert>
      ) : null}

      {liturgy ? (
        <Card>
          <p class="muted">Cor litúrgica: {liturgy.cor}</p>
          <p class="muted">Evangelho: {liturgy.evangelho.referencia}</p>
        </Card>
      ) : null}

      {liturgy && liturgyOffline ? <Alert tone="info">Exibindo versão salva no aparelho.</Alert> : null}
    </section>
  );
}
