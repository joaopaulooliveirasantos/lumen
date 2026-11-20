// Barra de leitura de um único texto (passo do Terço, oração): ouvir/pausar, tamanho do texto,
// copiar, compartilhar e escolher a voz. A fala para quando o texto muda (resetKey) ou a tela fecha.
import { useEffect, useState } from "preact/hooks";
import { copyText, shareText as shareNative } from "../native/share";
import { speakText, stopSpeech, useSpeechVoice } from "../native/speech";
import { useAppState } from "../state/AppState";
import { Icon } from "./Icon";
import { VoiceSheet } from "./LiturgyPlayer";
import { FontScaleControls } from "./PageHeader";

type Props = { text: string; shareText: string; title: string; resetKey: string | number };

export function PrayerPlayer({ text, shareText, title, resetKey }: Props) {
  const { notify } = useAppState();
  const voice = useSpeechVoice();
  const [playing, setPlaying] = useState(false);
  const [voiceSheet, setVoiceSheet] = useState(false);

  useEffect(() => {
    void stopSpeech();
    setPlaying(false);
  }, [resetKey]);
  useEffect(() => () => void stopSpeech(), []);

  async function toggle() {
    if (playing) {
      setPlaying(false);
      await stopSpeech();
      return;
    }
    setPlaying(true);
    const outcome = await speakText(text, voice.selected?.index);
    if (outcome === "error") notify("Não foi possível ler em voz alta.");
    if (outcome !== "stopped") setPlaying(false);
  }

  return (
    <div class="player">
      <div class="player-controls">
        <button type="button" class="player-btn player-main" aria-label={playing ? "Pausar" : "Ouvir"} onClick={() => void toggle()}>
          <Icon name={playing ? "pause" : "play"} size={18} />
        </button>
        <span class="player-divider" />
        <FontScaleControls />
      </div>
      <div class="player-actions">
        <button type="button" class="player-btn" aria-label="Copiar texto" onClick={() => void copyText(shareText).then(() => notify("Texto copiado."), () => notify("Não foi possível copiar."))}>
          <Icon name="copy" size={17} />
        </button>
        <button type="button" class="player-btn" aria-label="Compartilhar" onClick={() => void shareNative(title, shareText).then((r) => r === "copied" && notify("Texto copiado."), () => undefined)}>
          <Icon name="share" size={17} />
        </button>
        <button type="button" class="player-btn" aria-label="Escolher voz de leitura" onClick={() => setVoiceSheet(true)}>
          <Icon name="voice" size={17} />
        </button>
      </div>
      {voiceSheet ? (
        <VoiceSheet
          options={voice.options}
          selected={voice.selected}
          onSelect={(o) => {
            voice.select(o);
            setVoiceSheet(false);
          }}
          onClose={() => setVoiceSheet(false)}
        />
      ) : null}
    </div>
  );
}
