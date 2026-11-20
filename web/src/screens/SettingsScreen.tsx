import { useEffect, useState } from "preact/hooks";
import { Icon } from "../components/Icon";
import { FontScaleControls, PageHeader } from "../components/PageHeader";
import { Alert, Button, Card, Chip, SectionTitle, Spinner, Switch } from "../components/ui";
import { bibleTranslations } from "../data/bibleTranslations";
import {
  BibleUnavailableError,
  clearBibleTranslation,
  downloadBibleTranslation,
  getBibleDownloadStatus,
  type BibleDownloadStatus,
} from "../services/bible";
import { useAppState } from "../state/AppState";
import type { BibleTranslationId, ReadingMode } from "../types/settings";

const MODES: { id: ReadingMode; label: string }[] = [
  { id: "claro", label: "Claro" },
  { id: "escuro", label: "Escuro" },
  { id: "sepia", label: "Sépia" },
];

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { settings, updateSettings } = useAppState();

  return (
    <section class="screen">
      <PageHeader title="Configurações" onBack={onBack} />

      <SectionTitle>Tema de leitura</SectionTitle>
      <div class="row">
        {MODES.map((mode) => (
          <Chip key={mode.id} active={settings.readingMode === mode.id} onClick={() => updateSettings({ readingMode: mode.id })}>
            {mode.label}
          </Chip>
        ))}
      </div>

      <SectionTitle action={<FontScaleControls />}>Tamanho do texto</SectionTitle>
      <Card>
        <p class="reading-text" style={{ margin: 0 }}>
          No princípio era o Verbo, e o Verbo estava junto de Deus, e o Verbo era Deus.
        </p>
        <p class="muted" style={{ marginBottom: 0 }}>
          {Math.round(settings.fontScale * 100)}% — vale para liturgia, Bíblia, orações e terço.
        </p>
      </Card>

      <SectionTitle>Bíblia</SectionTitle>
      <div class="stack">
        {bibleTranslations.map((t) => (
          <TranslationCard
            key={t.id}
            id={t.id}
            nome={t.nome}
            editora={t.editora}
            selected={settings.bibleTranslation === t.id}
            onSelect={() => updateSettings({ bibleTranslation: t.id })}
          />
        ))}
      </div>

      <SectionTitle>Lembrete diário</SectionTitle>
      <ReminderCard />
    </section>
  );
}

// ---- Tradução da Bíblia (escolha e download offline) --------------------------------------------

function formatMb(bytes: number): string {
  return `${(bytes / 1e6).toFixed(1).replace(".", ",")} MB`;
}

function TranslationCard(props: { id: BibleTranslationId; nome: string; editora: string; selected: boolean; onSelect: () => void }) {
  const { notify } = useAppState();
  // undefined = verificando; null = não foi possível consultar (sem rede e nada em cache).
  const [status, setStatus] = useState<BibleDownloadStatus | null | undefined>(undefined);
  const [progress, setProgress] = useState<{ baixados: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () =>
    getBibleDownloadStatus(props.id)
      .then(setStatus)
      .catch(() => setStatus(null));

  useEffect(() => {
    void refresh();
  }, [props.id]);

  async function download() {
    setError(null);
    setProgress({ baixados: status?.baixados ?? 0, total: status?.total ?? 73 });
    try {
      await downloadBibleTranslation(props.id, setProgress);
      notify(`${props.nome} disponível offline.`);
    } catch (err) {
      setError(err instanceof BibleUnavailableError ? err.message : "Falha ao baixar. Tente de novo.");
    } finally {
      setProgress(null);
      void refresh();
    }
  }

  async function remove() {
    await clearBibleTranslation(props.id);
    notify(`${props.nome} removida do aparelho.`);
    void refresh();
  }

  const complete = status && status.baixados === status.total;
  return (
    <Card class={props.selected ? "card-selected" : undefined}>
      <button type="button" class="translation-head" aria-pressed={props.selected} onClick={props.onSelect}>
        <span class="list-row-body">
          <span class="list-row-title">{props.nome}</span>
          <span class="list-row-subtitle">{props.editora}</span>
        </span>
        {props.selected ? <Icon name="checkmark" size={20} class="text-accent" /> : <span class="radio-dot" />}
      </button>

      <div class="translation-offline">
        {progress ? (
          <>
            <Spinner size={16} />
            <span class="muted">
              Baixando {progress.baixados} de {progress.total} livros…
            </span>
          </>
        ) : complete ? (
          <>
            <Icon name="checkmark" size={16} class="text-accent" />
            <span class="muted">Disponível offline</span>
            <Button variant="ghost" onClick={remove}>
              Remover
            </Button>
          </>
        ) : (
          <>
            <span class="muted">
              {status === undefined ? "Verificando…" : status ? `${status.baixados} de ${status.total} livros no aparelho` : "Sem conexão. Os livros são baixados ao abrir."}
            </span>
            <Button variant="ghost" icon="download" onClick={download}>
              Baixar{status ? ` (${formatMb(status.bytesTotal)})` : ""}
            </Button>
          </>
        )}
      </div>
      {progress ? <progress class="progress" max={progress.total} value={progress.baixados} /> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
    </Card>
  );
}

// ---- Lembrete ------------------------------------------------------------------------------------

function ReminderCard() {
  const { settings, enableReminder, disableReminder, notify } = useAppState();
  const [time, setTime] = useState(settings.reminderTime);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(enabled: boolean, at = time) {
    setBusy(true);
    setError(null);
    if (enabled) {
      const problem = await enableReminder(at);
      if (problem) setError(problem);
      else notify(`Lembrete diário às ${at}.`);
    } else {
      await disableReminder();
      notify("Lembrete desativado.");
    }
    setBusy(false);
  }

  return (
    <Card>
      <Switch
        label="Lembrar da leitura diária"
        description={settings.reminderEnabled ? `Todos os dias às ${settings.reminderTime}` : "Desativado"}
        checked={settings.reminderEnabled}
        disabled={busy}
        onChange={(checked) => void apply(checked)}
      />
      <div class="reminder-time">
        <label for="reminder-time" class="field-label">
          Horário
        </label>
        <input
          id="reminder-time"
          class="time-input"
          type="time"
          value={time}
          onChange={(e) => {
            const value = (e.currentTarget as HTMLInputElement).value;
            setTime(value);
            // Com o lembrete ligado, reagenda no novo horário.
            if (settings.reminderEnabled && value) void apply(true, value);
          }}
        />
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </Card>
  );
}
