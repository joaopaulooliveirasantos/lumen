import { saintStorySchema } from "../schema";
import type { SaintStoryPayload } from "../types";
import type { CancaoNovaSaintClient } from "../integrations/cancaoNovaSaintClient";

export class SaintStoryService {
  constructor(private readonly client: Pick<CancaoNovaSaintClient, "getByDate">) {}

  async getSaintStoryPayload(isoDate: string): Promise<SaintStoryPayload> {
    const content = await this.client.getByDate(isoDate);

    const payload: SaintStoryPayload = {
      data: isoDate,
      nome: content.nome,
      imagemUrl: content.imagemUrl,
      fonteUrl: content.fonteUrl,
      paragrafos: content.paragrafos,
    };

    return saintStorySchema.parse(payload);
  }
}
