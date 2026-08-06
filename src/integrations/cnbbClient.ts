import axios, { type AxiosInstance } from "axios";

const CNBB_API_BASE = "https://api-liturgia.edicoescnbb.com.br";
const CNBB_SITE_ORIGIN = "https://liturgiadiaria.edicoescnbb.com.br";

export interface CnbbContent {
  date: string;
  filename: string;
  title: string;
  color: string;
  details: string;
  leituras: string;
  body: string;
}

export class CnbbClient {
  private readonly http: AxiosInstance;

  constructor(httpClient?: AxiosInstance) {
    this.http = httpClient ?? axios.create({ timeout: 8000 });
  }

  async getContentByDate(isoDate: string): Promise<CnbbContent> {
    const response = await this.http.get(`${CNBB_API_BASE}/contents/in/date/${isoDate}`, {
      headers: {
        Accept: "application/json",
        Origin: CNBB_SITE_ORIGIN,
        Referer: `${CNBB_SITE_ORIGIN}/`,
      },
    });

    const content = response.data?.content;
    if (!content || typeof content !== "object") {
      throw new Error("Resposta da API da CNBB sem o campo 'content'.");
    }

    return normalizeContent(content as CnbbContent);
  }
}

// O texto retornado pela CNBB as vezes vem em NFD (ex.: "ç" como "c" + acento
// combinavel) e as vezes em NFC, aparentemente dependendo de quando/quem
// cadastrou o conteudo. Normalizar para NFC logo na entrada evita que
// comparacoes literais (marcadores, formulas de encerramento) falhem
// silenciosamente so por causa da representacao Unicode do dia.
function normalizeContent(content: CnbbContent): CnbbContent {
  return {
    ...content,
    title: content.title?.normalize("NFC"),
    color: content.color?.normalize("NFC"),
    details: content.details?.normalize("NFC"),
    leituras: content.leituras?.normalize("NFC"),
    body: content.body?.normalize("NFC"),
  };
}
