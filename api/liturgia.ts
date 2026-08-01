import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDailyLiturgy } from "../src/serverless/getDailyLiturgy";
import { getSaintOfDay } from "../src/serverless/getSaintOfDay";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const response =
    type === "saint" ? await getSaintOfDay({ query: { date } }) : await getDailyLiturgy({ query: { date } });

  Object.entries(response.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.status(response.statusCode).send(response.body);
}
