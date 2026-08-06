import { CancaoNovaSaintClient } from "../integrations/cancaoNovaSaintClient";
import { SaintStoryService } from "../services/saintStoryService";
import { isValidIsoDate } from "../utils/date";

export interface RequestLike {
  query?: {
    date?: string;
  };
}

export interface ServerlessResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const defaultHeaders = {
  "content-type": "application/json; charset=utf-8",
};

export async function getSaintStory(request: RequestLike): Promise<ServerlessResponse> {
  const date = request.query?.date;

  if (!date || !isValidIsoDate(date)) {
    return {
      statusCode: 400,
      headers: defaultHeaders,
      body: JSON.stringify({
        error: "Parametro 'date' invalido. Use o formato YYYY-MM-DD.",
      }),
    };
  }

  const service = new SaintStoryService(new CancaoNovaSaintClient());

  try {
    const payload = await service.getSaintStoryPayload(date);
    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify(payload),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return {
      statusCode: 502,
      headers: defaultHeaders,
      body: JSON.stringify({
        error: "Falha ao consultar a historia do santo do dia.",
        details: message,
      }),
    };
  }
}
