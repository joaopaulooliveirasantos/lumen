// Barra de leitura da Liturgia: voltar/tocar/avançar faixa (TTS), tamanho do texto, copiar,
// compartilhar e escolher a voz. Ao terminar uma faixa, passa para a próxima, como no RN.
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { copyText, shareText } from "../native/share";
import { speakText, stopSpeech, useSpeechVoice, type VoiceOption } from "../native/speech";
import { buildLiturgyTracks } from "../services/liturgyTracks";
import { useAppState } from "../state/AppState";
import type { DailyLiturgyPayload, ReadingTabKey } from "../types/liturgy";
import { Icon } from "./Icon";
import { FontScaleControls } from "./PageHeader";
import { Sheet } from "./Sheet";

type Props = {
  payload: DailyLiturgyPayload;
  activeTrack: ReadingTabKey;
  onTrackChange: (key: ReadingTabKey) => void;
};

export function LiturgyPlayer({ payload, activeTrack, onTrackChange }: Props) {
  const { notify } = useAppState();
  const tracks = useMemo(() => buildLiturgyTracks(payload), [payload]);
  const voice = useSpeechVoice();
  const [playing, setPlaying] = useState(false);
  const [voiceSheet, setVoiceSheet] = useState(false);
  const playingRef = useRef(false);

  // Para a fala ao trocar de dia e ao sair da tela.
  useEffect(() => {
    void stopSpeech();
    setPlaying(false);
    playingRef.current = false;
  }, [payload]);
  useEffect(() => () => void stopSpeech(), []);

  const index = Math.max(0, tracks.findIndex((t) => t.key === activeTrack));
  const current = tracks[index];

  async function playFrom(i: number) {
    playingRef.current = true;
    setPlaying(true);
    for (let k = i; k < tracks.length; k++) {
      onTrackChange(tracks[k].key);
      const outcome = await speakText(tracks[k].speech, voice.selected?.index);
      if (outcome !== "done" || !playingRef.current) {
        if (outcome === "error") notify("Não foi possível ler em voz alta.");
        if (outcome !== "stopped") setPlaying(false);
        return;
      }
    }
    playingRef.current = false;
    setPlaying(false);
  }

  function togglePlay() {
    if (playing) {
      playingRef.current = false;
      setPlaying(false);
      void stopSpeech();
    } else {
      void playFrom(index);
    }
  }

  function step(delta: 1 | -1) {
    const target = index + delta;
    if (target < 0 || target >= tracks.length) return;
    if (playing) void playFrom(target);
    else onTrackChange(tracks[target].key);
  }

  return (
    <div class="player">
      <div class="player-controls">
        <button type="button" class="player-btn" aria-label="Leitura anterior" disabled={index <= 0} onClick={() => step(-1)}>
          <Icon name="playSkipBack" size={16} />
        </button>
        <button type="button" class="player-btn player-main" aria-label={playing ? "Pausar leitura" : "Ouvir leitura"} onClick={togglePlay}>
          <Icon name={playing ? "pause" : "play"} size={18} />
        </button>
        <button type="button" class="player-btn" aria-label="Próxima leitura" disabled={index >= tracks.length - 1} onClick={() => step(1)}>
          <Icon name="playSkipForward" size={16} />
        </button>
        <span class="player-divider" />
        <FontScaleControls />
      </div>
      <div class="player-actions">
        <button
          type="button"
          class="player-btn"
          aria-label="Copiar texto"
          onClick={() => void copyText(current.share).then(() => notify("Texto copiado."), () => notify("Não foi possível copiar."))}
        >
          <Icon name="copy" size={17} />
        </button>
        <button
          type="button"
          class="player-btn"
          aria-label="Compartilhar"
          onClick={() => void shareText(current.label, current.share).then((r) => r === "copied" && notify("Texto copiado."), () => undefined)}
        >
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

export function VoiceSheet(props: { options: VoiceOption[]; selected: VoiceOption | null; onSelect: (o: VoiceOption) => void; onClose: () => void }) {
  return (
    <Sheet title={`Vozes de leitura (${props.options.length})`} onClose={props.onClose}>
      {props.options.length === 0 ? <p class="muted">Nenhuma voz encontrada. Instale vozes em português nas configurações de texto para fala do Android.</p> : null}
      <div class="list">
        {props.options.map((o) => {
          const isSelected = props.selected?.score.voice.identifier === o.score.voice.identifier;
          return (
            <button key={o.score.voice.identifier} type="button" class={`list-row${isSelected ? " list-row-selected" : ""}`} onClick={() => props.onSelect(o)}>
              <span class="list-row-body">
                <span class="list-row-title">{o.score.voice.name ?? o.score.voice.identifier}</span>
                <span class="list-row-subtitle">
                  {o.score.voice.language ?? "?"} · pontuação {o.score.eligible ? o.score.score : "—"}
                </span>
              </span>
              {isSelected ? <Icon name="checkmark" size={18} class="text-accent" /> : null}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
