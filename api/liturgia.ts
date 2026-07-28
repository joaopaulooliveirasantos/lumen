import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDailyLiturgy } from "../src/serverless/getDailyLiturgy";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await getDailyLiturgy({
    query: {
      date: typeof req.query.date === "string" ? req.query.date : undefined,
    },
  });

  Object.entries(response.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.status(response.statusCode).send(response.body);
}
