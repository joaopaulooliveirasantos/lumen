import type { AxiosInstance } from "axios";
import { PprClient } from "./pprClient";
import { parseTitle } from "./pprParsing";

export class PprSaintClient {
  private readonly client: Pick<PprClient, "getPageHtmlByDate">;

  constructor(httpClient?: AxiosInstance, client?: Pick<PprClient, "getPageHtmlByDate">) {
    this.client = client ?? new PprClient(httpClient);
  }

  async getByDate(isoDate: string): Promise<string[]> {
    const html = await this.client.getPageHtmlByDate(isoDate);
    const titleMatch = html.match(/liturgy-title"[^>]*>([^<]*)</);
    if (!titleMatch) {
      throw new Error("Titulo liturgico nao encontrado no conteudo do Padre Paulo Ricardo.");
    }

    const { santo } = parseTitle(titleMatch[1]);
    return santo ? [santo] : [];
  }
}
