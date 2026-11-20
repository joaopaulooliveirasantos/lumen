export interface TtsVoice {
  identifier: string;
  name: string;
  language: string;
  quality?: "default" | "enhanced";
}

const MALE_NAME_HINTS = [
  "male", "homem", "masculin",
  "ricardo", "daniel", "diego", "felipe", "thiago", "tiago", "marco", "marcos",
  "paulo", "rodrigo", "bruno", "carlos", "pedro", "joao", "joão", "antonio", "antônio",
];
const FEMALE_NAME_HINTS = [
  "female", "mulher", "feminin",
  "luciana", "joana", "camila", "fernanda", "vitoria", "vitória", "raquel", "ines", "inês",
];

export interface VoiceScore {
  voice: TtsVoice;
  eligible: boolean;
  score: number | null;
}

// Pontua uma voz: elegível apenas se for português; prioriza pt-BR, qualidade
// "Enhanced" (soa bem menos robótica que a voz padrão) e nomes que sugerem
// timbre masculino.
export function scoreVoice(voice: TtsVoice): VoiceScore {
  const lang = (voice.language ?? "").toLowerCase();
  if (!lang.startsWith("pt")) {
    return { voice, eligible: false, score: null };
  }

  let score = lang === "pt-br" ? 100 : 60;
  if (voice.quality === "enhanced") score += 40;

  const haystack = `${voice.name ?? ""} ${voice.identifier ?? ""}`.toLowerCase();
  if (MALE_NAME_HINTS.some((hint) => haystack.includes(hint))) score += 25;
  if (FEMALE_NAME_HINTS.some((hint) => haystack.includes(hint))) score -= 25;

  return { voice, eligible: true, score };
}

export function rankVoices(voices: TtsVoice[]): VoiceScore[] {
  return [...voices]
    .map(scoreVoice)
    .sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
}

// Idioma padrão configurado no aparelho (ex: "pt"), usado para filtrar a
// lista de vozes exibida na tela de depuração.
export function getDeviceLanguage(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale.split("-")[0].toLowerCase();
  } catch {
    return "pt";
  }
}

// Escolhe a melhor voz pt-BR disponível no aparelho a partir do ranking.
export function pickBestVoice(ranked: VoiceScore[]): TtsVoice | null {
  const best = ranked.find((entry) => entry.eligible);
  return best ? best.voice : null;
}
