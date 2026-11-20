import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { pickBestVoice, rankVoices, type TtsVoice } from "../services/ttsVoiceRanking";

export interface IndexedVoice {
  index: number;
  voice: TtsVoice;
}

interface RawVoice {
  voiceURI: string;
  name: string;
  lang: string;
}

// O plugin seleciona a voz pelo índice na lista de getSupportedVoices().
export function mapVoices(raw: RawVoice[]): IndexedVoice[] {
  return raw.map((v, index) => ({ index, voice: { identifier: v.voiceURI, name: v.name, language: v.lang } }));
}

export async function listVoices(): Promise<IndexedVoice[]> {
  const { voices } = await TextToSpeech.getSupportedVoices();
  return mapVoices(voices);
}

export async function bestPortugueseVoice(): Promise<IndexedVoice | null> {
  const all = await listVoices();
  const best = pickBestVoice(rankVoices(all.map((v) => v.voice)));
  return best ? (all.find((v) => v.voice.identifier === best.identifier) ?? null) : null;
}

export async function speak(text: string, voiceIndex?: number): Promise<void> {
  await TextToSpeech.speak({ text, lang: "pt-BR", rate: 1, voice: voiceIndex });
}

export async function stopSpeaking(): Promise<void> {
  await TextToSpeech.stop();
}
