import { useEffect, useState } from "preact/hooks";
import { Browser } from "@capacitor/browser";
import { PageHeader } from "../components/PageHeader";
import { Button, Card, EmptyState, Spinner } from "../components/ui";
import { isNative } from "../native/platform";
import { fetchSaintStory } from "../services/api";
import { useAppState } from "../state/AppState";
import type { SaintStoryPayload } from "../types/liturgy";

async function openExternal(url: string) {
  if (isNative()) await Browser.open({ url });
  else window.open(url, "_blank", "noopener");
}

export function SaintStoryScreen({ onExit }: { onExit: () => void }) {
  const { selectedDate } = useAppState();
  const [story, setStory] = useState<SaintStoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchSaintStory(selectedDate)
      .then((s) => active && setStory(s))
      .catch((e: unknown) => {
        if (!active) return;
        setStory(null);
        setError(e instanceof Error ? e.message : "Falha ao carregar a história do santo do dia.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [selectedDate, attempt]);

  return (
    <section class="screen">
      <PageHeader title="Santo do Dia" onBack={onExit} />
      {loading ? (
        <div class="row" style={{ justifyContent: "center", padding: "40px 0" }}>
          <Spinner label="Carregando a história do santo do dia" />
        </div>
      ) : !story ? (
        <Card>
          <EmptyState icon="wifiOff" title="Não foi possível carregar a história." action={<Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>Tentar novamente</Button>}>
            {error}
          </EmptyState>
        </Card>
      ) : (
        <Card class="saint-story">
          {story.imagemUrl ? <img class="saint-image" src={story.imagemUrl} alt={story.nome} loading="lazy" referrerpolicy="no-referrer" /> : null}
          <h2 class="reading-title">{story.nome}</h2>
          {story.paragrafos.map((block, i) =>
            block.tipo === "titulo" ? (
              <h3 key={i} class="saint-subtitle">
                {block.texto}
              </h3>
            ) : (
              <p key={i} class="reading-text saint-paragraph">
                {block.texto}
              </p>
            ),
          )}
          <Button variant="ghost" icon="externalLink" onClick={() => void openExternal(story.fonteUrl)}>
            Fonte: Canção Nova
          </Button>
        </Card>
      )}
    </section>
  );
}
