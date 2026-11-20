import { useState } from "preact/hooks";
import { App as CapApp } from "@capacitor/app";
import { Clipboard } from "@capacitor/clipboard";
import { Share } from "@capacitor/share";
import { fetchDailyLiturgy } from "../services/api";
import { formatIsoDate } from "../services/date";
import { getDailyCache, saveDailyCache } from "../storage/liturgyCache";
import { getBibleDownloadStatus, getBibleIndex, loadBibleBook } from "../services/bible";
import { kv } from "../storage/kv";
import { describeLegacyStorage } from "../storage/legacyMigration";
import { isNative, platform } from "../native/platform";
import { disableDailyReminder, scheduleDailyReminder, scheduleTestNotification } from "../native/notifications";
import { bestPortugueseVoice, listVoices, speak, stopSpeaking } from "../native/tts";
import { SecureStorage } from "../native/supabase";
import { currentUserEmail, signInWithGoogle, signOut } from "../native/oauth";

type Status = "idle" | "running" | "ok" | "fail";

function TestCard(props: { title: string; hint?: string; run: () => Promise<string>; label?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function execute() {
    setStatus("running");
    setMessage("");
    try {
      setMessage(await props.run());
      setStatus("ok");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
      setStatus("fail");
    }
  }

  return (
    <div class="card diag-card">
      <div class="diag-head">
        <h2 class="diag-title">{props.title}</h2>
        <span class={`diag-badge diag-${status}`}>{status === "idle" ? "—" : status === "running" ? "…" : status === "ok" ? "OK" : "FALHA"}</span>
      </div>
      {props.hint ? <p class="muted">{props.hint}</p> : null}
      <button type="button" class="primary-button" disabled={status === "running"} onClick={() => void execute()}>
        {props.label ?? "Testar"}
      </button>
      {message ? <pre class="diag-output">{message}</pre> : null}
    </div>
  );
}

const SAMPLE = "Palavra do Senhor. Graças a Deus.";

export function DiagnosticsScreen() {
  const [time, setTime] = useState("07:00");

  return (
    <section class="screen">
      <h1 class="title">Diagnóstico</h1>
      <p class="muted">Cada teste valida um recurso nativo no aparelho antes de migrar as telas.</p>

      <TestCard
        title="Ambiente"
        run={async () => {
          const base = `plataforma=${platform()} nativo=${isNative()} origem=${window.location.origin}`;
          if (!isNative()) return base;
          const info = await CapApp.getInfo();
          return `${base}\nversão=${info.version} build=${info.build} id=${info.id}`;
        }}
      />

      <TestCard
        title="Dados do app antigo (RN)"
        hint="Mostra o que o app React Native deixou no aparelho e quando foi copiado para o app novo."
        run={describeLegacyStorage}
      />

      <TestCard
        title="API da VPS (HTTP nativo, sem CORS)"
        hint="Busca a liturgia de hoje na API."
        run={async () => {
          const p = await fetchDailyLiturgy(formatIsoDate(new Date()));
          return `${p.liturgia}\ncor=${p.cor} evangelho=${p.evangelho.referencia}`;
        }}
      />

      <TestCard
        title="Cache em IndexedDB"
        run={async () => {
          const date = "diag-cache";
          const payload = await fetchDailyLiturgy(formatIsoDate(new Date()));
          await saveDailyCache(date, payload);
          const back = await getDailyCache(date);
          if (back?.payload.liturgia !== payload.liturgia) throw new Error("Leitura diferente da gravada.");
          return `Gravado e lido: ${back.payload.liturgia}`;
        }}
      />

      <TestCard
        title="Bíblia da VPS (livro + cache)"
        hint="Baixa São João (Pastoral) e lê de novo do IndexedDB. Rode de novo em modo avião: deve continuar OK."
        run={async () => {
          const started = performance.now();
          const index = await getBibleIndex("paulus");
          const book = await loadBibleBook("paulus", "São João");
          if (!book) throw new Error("Livro não encontrado no índice.");
          const ms = Math.round(performance.now() - started);
          const status = await getBibleDownloadStatus("paulus");
          return `versão=${index.versao} ${book.nome}: ${book.capitulos.length} capítulos em ${ms} ms\n${status.baixados}/${status.total} livros no aparelho`;
        }}
      />

      <TestCard
        title="Preferências (configurações)"
        run={async () => {
          const value = `ok-${Date.now()}`;
          await kv.setItem("lumen_diag", value);
          const back = await kv.getItem("lumen_diag");
          if (back !== value) throw new Error(`Esperado ${value}, veio ${back}`);
          return `Gravado e lido: ${back}`;
        }}
      />

      <TestCard
        title="Armazenamento seguro (Keystore)"
        run={async () => {
          const value = `segredo-${Date.now()}`;
          await SecureStorage.setItem("lumen_diag_secure", value);
          const back = await SecureStorage.getItem("lumen_diag_secure");
          await SecureStorage.removeItem("lumen_diag_secure");
          if (back !== value) throw new Error(`Esperado ${value}, veio ${back}`);
          return "Gravado, lido e removido com sucesso.";
        }}
      />

      <TestCard
        title="Notificação local (20 s)"
        hint="Aceite a permissão e feche o app; a notificação deve chegar em ~20 segundos."
        label="Agendar"
        run={async () => {
          if (!(await scheduleTestNotification(20))) throw new Error("Permissão de notificação negada.");
          return "Agendada para daqui a 20 segundos.";
        }}
      />

      <div class="card diag-card">
        <h2 class="diag-title">Lembrete diário</h2>
        <label class="diag-row">
          Horário
          <input type="time" value={time} onInput={(e) => setTime((e.target as HTMLInputElement).value)} />
        </label>
      </div>
      <TestCard
        title="Agendar lembrete diário"
        label="Agendar"
        run={async () => {
          if (!(await scheduleDailyReminder(time))) throw new Error("Horário inválido ou permissão negada.");
          return `Lembrete diário agendado para ${time}.`;
        }}
      />
      <TestCard
        title="Cancelar lembrete diário"
        label="Cancelar"
        run={async () => {
          await disableDailyReminder();
          return "Lembrete cancelado.";
        }}
      />

      <TestCard
        title="Vozes de TTS"
        run={async () => {
          const all = await listVoices();
          const best = await bestPortugueseVoice();
          const pt = all.filter((v) => v.voice.language.toLowerCase().startsWith("pt"));
          return `${all.length} vozes, ${pt.length} em português.\nMelhor: ${best ? `${best.voice.name} (${best.voice.language})` : "nenhuma"}`;
        }}
      />
      <TestCard
        title="Falar texto (TTS)"
        label="Falar"
        run={async () => {
          const best = await bestPortugueseVoice();
          await speak(SAMPLE, best?.index);
          return `Falando com ${best ? best.voice.name : "voz padrão"}.`;
        }}
      />
      <TestCard
        title="Parar fala"
        label="Parar"
        run={async () => {
          await stopSpeaking();
          return "Fala interrompida.";
        }}
      />

      <TestCard
        title="Copiar para a área de transferência"
        label="Copiar"
        run={async () => {
          await Clipboard.write({ string: SAMPLE });
          const { value } = await Clipboard.read();
          if (value !== SAMPLE) throw new Error("Texto lido diferente do copiado.");
          return "Copiado e lido de volta.";
        }}
      />
      <TestCard
        title="Compartilhar"
        label="Compartilhar"
        run={async () => {
          await Share.share({ text: SAMPLE });
          return "Folha de compartilhamento aberta.";
        }}
      />

      <TestCard
        title="Login com Google (Supabase, deep link)"
        hint="Abre o navegador, volta ao app por lumen://oauth-callback e troca o code por sessão."
        label="Entrar com Google"
        run={async () => `Logado como ${(await signInWithGoogle()) ?? "(sem e-mail)"}`}
      />
      <TestCard
        title="Sessão atual"
        run={async () => `Usuário: ${(await currentUserEmail()) ?? "nenhum"}`}
      />
      <TestCard
        title="Sair"
        label="Sair"
        run={async () => {
          await signOut();
          return "Sessão encerrada.";
        }}
      />
    </section>
  );
}
