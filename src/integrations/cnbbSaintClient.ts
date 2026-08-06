import type { AxiosInstance } from "axios";
import { CnbbClient } from "./cnbbClient";
import { parseDetails } from "./cnbbParsing";

export class CnbbSaintClient {
  private readonly client: Pick<CnbbClient, "getContentByDate">;

  constructor(httpClient?: AxiosInstance, client?: Pick<CnbbClient, "getContentByDate">) {
    this.client = client ?? new CnbbClient(httpClient);
  }

  async getByDate(isoDate: string): Promise<string[]> {
    const content = await this.client.getContentByDate(isoDate);
    const { santo } = parseDetails(content.details);
    return santo ? [santo] : [];
  }
}
