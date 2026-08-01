import { saintOfDaySchema } from "../schema";
import type { SaintOfDayPayload } from "../types";
import type { SaintClient } from "../integrations/saintClient";

export class SaintOfDayService {
  constructor(private readonly saintClient: Pick<SaintClient, "getByDate">) {}

  async getSaintOfDayPayload(isoDate: string): Promise<SaintOfDayPayload> {
    const santos = await this.saintClient.getByDate(isoDate);

    const payload: SaintOfDayPayload = {
      data: isoDate,
      santos,
    };

    return saintOfDaySchema.parse(payload);
  }
}
