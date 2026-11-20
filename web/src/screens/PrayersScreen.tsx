import { useState } from "preact/hooks";
import { FontScaleControls, PageHeader } from "../components/PageHeader";
import { Button, Card, ListRow, SectionTitle } from "../components/ui";
import { prayerCategories } from "../data/prayers";
import { copyText, shareText } from "../native/share";
import { useAppState } from "../state/AppState";
import type { Prayer } from "../types/prayers";

export function PrayersScreen() {
  const { notify } = useAppState();
  const [selected, setSelected] = useState<Prayer | null>(null);

  if (selected) {
    return (
      <section class="screen">
        <PageHeader title={selected.titulo} onBack={() => setSelected(null)} action={<FontScaleControls />} />
        <Card>
          <h2 class="reading-title">{selected.titulo}</h2>
          <p class="reading-text">{selected.texto}</p>
        </Card>
        <div class="row">
          <Button
            variant="secondary"
            icon="share"
            onClick={async () => {
              const result = await shareText(selected.titulo, `${selected.titulo}\n\n${selected.texto}`).catch(() => null);
              if (result === "copied") notify("Oração copiada.");
            }}
          >
            Compartilhar
          </Button>
          <Button
            variant="secondary"
            icon="copy"
            onClick={async () => {
              await copyText(selected.texto).then(
                () => notify("Oração copiada."),
                () => notify("Não foi possível copiar."),
              );
            }}
          >
            Copiar
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section class="screen">
      <PageHeader title="Orações" />
      {prayerCategories.map((category) => (
        <div key={category.id} class="stack">
          <SectionTitle>{category.nome}</SectionTitle>
          <div class="list">
            {category.oracoes.map((prayer) => (
              <ListRow key={prayer.id} title={prayer.titulo} onClick={() => setSelected(prayer)} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
