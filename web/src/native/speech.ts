// Leitura em voz alta com fila e cancelamento (Liturgia, Terço, Bíblia).
// O plugin resolve `speak()` quando a fala termina ou é interrompida; o contador `generation`
// distingue as duas coisas: qualquer stop() ou nova fala invalida a sequência em andamento.
import { useEffect, useState } from "preact/hooks";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { splitForSpeech } from "../services/liturgyTracks";
import { getDeviceLanguage, rankVoices, type VoiceScore } from "../services/ttsVoiceRanking";
import { loadSavedVoiceIdentifier, saveVoiceIdentifier } from "../storage/ttsVoice";
import { listVoices, type IndexedVoice } from "./tts";

// Mesmo timbre do RN (expo-speech com pitch 0.88 e rate 0.94).
const RATE = 0.94;
const PITCH = 0.88;

let generation = 0;

export type SpeakOutcome = "done" | "stopped" | "error";

export async function speakText(text: string, voiceIndex?: number): Promise<SpeakOutcome> {
  const mine = ++generation;
  await TextToSpeech.stop().catch(() => undefined);
  try {
    for (const chunk of splitForSpeech(text)) {
      if (mine !== generation) return "stopped";
      await TextToSpeech.speak({ text: chunk, lang: "pt-BR", rate: RATE, pitch: PITCH, voice: voiceIndex, category: "playback" });
    }
  } catch {
    return mine === generation ? "error" : "stopped";
  }
  return mine === generation ? "done" : "stopped";
}

export async function stopSpeech(): Promise<void> {
  generation++;
  await TextToSpeech.stop().catch(() => undefined);
}

// ---- Escolha da voz ------------------------------------------------------------------------------

export interface VoiceOption {
  index: number;
  score: VoiceScore;
}

/** Vozes do aparelho no idioma do sistema, ranqueadas, e a escolhida (salva ou a melhor). */
export function useSpeechVoice() {
  const [options, setOptions] = useState<VoiceOption[]>([]);
  const [selected, setSelected] = useState<VoiceOption | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([listVoices().catch((): IndexedVoice[] => []), loadSavedVoiceIdentifier()]).then(([voices, saved]) => {
      if (!active) return;
      const language = getDeviceLanguage();
      const ranked = rankVoices(voices.map((v) => v.voice));
      const byId = new Map(voices.map((v) => [v.voice.identifier, v.index]));
      const all = ranked.map((score) => ({ index: byId.get(score.voice.identifier) ?? 0, score }));
      const visible = all.filter((o) => (o.score.voice.language ?? "").toLowerCase().replace("_", "-").startsWith(language));
      setOptions(visible.length ? visible : all);
      const savedOption = saved ? all.find((o) => o.score.voice.identifier === saved) : undefined;
      setSelected(savedOption ?? all.find((o) => o.score.eligible) ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  return {
    options,
    selected,
    select: (option: VoiceOption) => {
      setSelected(option);
      void saveVoiceIdentifier(option.score.voice.identifier);
    },
  };
}
