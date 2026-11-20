// Faixas da Liturgia (1ª leitura, salmo, 2ª leitura, evangelho, homilia): texto para leitura em voz
// alta e texto para copiar/compartilhar. Mesma montagem do LiturgyPlayer do RN.
import { EVANGELHO_RESPONSE, LEITURA_RESPONSE } from "../data/liturgyResponses";
import type { DailyLiturgyPayload, ReadingTabKey } from "../types/liturgy";

export interface LiturgyTrack {
  key: ReadingTabKey;
  label: string;
  /** Texto lido pelo TTS. */
  speech: string;
  /** Texto para copiar e compartilhar. */
  share: string;
}

export function buildLiturgyTracks(p: DailyLiturgyPayload): LiturgyTrack[] {
  const tracks: LiturgyTrack[] = [
    {
      key: "leitura1",
      label: "1ª Leitura",
      speech: `Primeira leitura. ${p.primeiraLeitura.titulo}. ${p.primeiraLeitura.texto} ${LEITURA_RESPONSE.call}. ${LEITURA_RESPONSE.response}.`,
      share: `Primeira Leitura\n${p.primeiraLeitura.titulo}\n${p.primeiraLeitura.referencia}\n\n${p.primeiraLeitura.texto}\n\n${LEITURA_RESPONSE.call}\n${LEITURA_RESPONSE.response}`,
    },
    {
      key: "salmo",
      label: "Salmo",
      speech: `Salmo responsorial. ${p.salmo.refrao}. ${p.salmo.texto}`,
      share: `Salmo Responsorial\n${p.salmo.referencia}\n\n${p.salmo.refrao}\n\n${p.salmo.texto}`,
    },
  ];
  if (p.segundaLeitura) {
    tracks.push({
      key: "leitura2",
      label: "2ª Leitura",
      speech: `Segunda leitura. ${p.segundaLeitura.titulo}. ${p.segundaLeitura.texto} ${LEITURA_RESPONSE.call}. ${LEITURA_RESPONSE.response}.`,
      share: `Segunda Leitura\n${p.segundaLeitura.titulo}\n${p.segundaLeitura.referencia}\n\n${p.segundaLeitura.texto}\n\n${LEITURA_RESPONSE.call}\n${LEITURA_RESPONSE.response}`,
    });
  }
  tracks.push(
    {
      key: "evangelho",
      label: "Evangelho",
      speech: `Evangelho. ${p.evangelho.titulo}. ${p.evangelho.texto} ${EVANGELHO_RESPONSE.call}. ${EVANGELHO_RESPONSE.response}`,
      share: `Evangelho\n${p.evangelho.titulo}\n${p.evangelho.referencia}\n\n${p.evangelho.texto}\n\n${EVANGELHO_RESPONSE.call}\n${EVANGELHO_RESPONSE.response}`,
    },
    {
      key: "homilia",
      label: "Homilia",
      speech: `Homilia. ${p.reflexao.titulo}. ${p.reflexao.texto}`,
      share: `Homilia\n${p.reflexao.titulo}\n${p.reflexao.autor}\n\n${p.reflexao.texto}${p.reflexao.fonte ? `\n\n${p.reflexao.fonte}` : ""}`,
    },
  );
  return tracks;
}

/**
 * O TextToSpeech do Android recusa textos acima de 4000 caracteres (getMaxSpeechInputLength), e
 * homilias passam disso. Divide em blocos de até `max`, preferindo fim de frase, depois espaço.
 */
export function splitForSpeech(text: string, max = 3500): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let rest = clean;
  while (rest.length > max) {
    const window = rest.slice(0, max + 1);
    let cut = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "), window.lastIndexOf("? "), window.lastIndexOf("; "));
    if (cut < max * 0.5) cut = window.lastIndexOf(" ");
    if (cut <= 0) cut = max;
    else cut += 1; // mantém a pontuação no bloco anterior
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}
