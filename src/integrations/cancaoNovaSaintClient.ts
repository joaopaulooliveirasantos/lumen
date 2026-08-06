import axios, { type AxiosInstance } from "axios";
import { extractSaintUrlForDay, parseSaintStory, type SaintStoryBlock } from "./cancaoNovaParsing";

const AJAX_URL = "https://santo.cancaonova.com/wp-admin/admin-ajax.php";

export interface SaintStoryContent {
  nome: string;
  imagemUrl: string | null;
  fonteUrl: string;
  paragrafos: SaintStoryBlock[];
}

const BROWSER_HEADERS = {
  Accept: "text/html",
  "User-Agent": "Mozilla/5.0 (compatible; LumenLiturgiaBot/1.0)",
};

export class CancaoNovaSaintClient {
  private readonly http: AxiosInstance;

  constructor(httpClient?: AxiosInstance) {
    this.http = httpClient ?? axios.create({ timeout: 8000 });
  }

  async getByDate(isoDate: string): Promise<SaintStoryContent> {
    const [yearStr, monthStr, dayStr] = isoDate.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    const calendarResponse = await this.http.post(
      AJAX_URL,
      new URLSearchParams({
        action: "widget-ajax",
        sMes: String(month),
        sAno: String(year),
        title: "",
        type: "santo",
        ajax: "true",
      }).toString(),
      {
        responseType: "text",
        headers: {
          ...BROWSER_HEADERS,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const calendarHtml =
      typeof calendarResponse.data === "string" ? calendarResponse.data : String(calendarResponse.data ?? "");
    const fonteUrl = extractSaintUrlForDay(calendarHtml, day, month);
    if (!fonteUrl) {
      throw new Error("Historia do santo do dia nao disponivel na Cancao Nova para esta data.");
    }

    const detailResponse = await this.http.get(fonteUrl, {
      responseType: "text",
      headers: BROWSER_HEADERS,
    });

    const detailHtml =
      typeof detailResponse.data === "string" ? detailResponse.data : String(detailResponse.data ?? "");
    const { nome, imagemUrl, paragrafos } = parseSaintStory(detailHtml);

    return { nome, imagemUrl, fonteUrl, paragrafos };
  }
}
