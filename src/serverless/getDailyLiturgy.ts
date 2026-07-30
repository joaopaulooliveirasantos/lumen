import { LiturgyClient } from "../integrations/liturgyClient";
import { EvangelizoCommentClient } from "../integrations/evangelizoCommentClient";
import { DailyLiturgyService } from "../services/dailyLiturgyService";
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

export async function getDailyLiturgy(request: RequestLike): Promise<ServerlessResponse> {
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

  const service = new DailyLiturgyService(new LiturgyClient(), new EvangelizoCommentClient());

  try {
    const payload = await service.getDailyPayload(date);
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
        error: "Falha ao consolidar liturgia e reflexoes.",
        details: message,
      }),
    };
  }
}
