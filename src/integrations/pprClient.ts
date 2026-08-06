import axios, { type AxiosInstance } from "axios";

const PPR_BASE = "https://padrepauloricardo.org/liturgia";

function toPprDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

export class PprClient {
  private readonly http: AxiosInstance;

  constructor(httpClient?: AxiosInstance) {
    this.http = httpClient ?? axios.create({ timeout: 8000 });
  }

  async getPageHtmlByDate(isoDate: string): Promise<string> {
    const response = await this.http.get(`${PPR_BASE}/${toPprDate(isoDate)}`, {
      responseType: "text",
      headers: {
        Accept: "text/html",
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 200,
    });

    const html = typeof response.data === "string" ? response.data : String(response.data ?? "");
    return html.normalize("NFC");
  }
}
