export const config = {
  liturgyApiUrlTemplate:
    process.env.LITURGY_API_URL_TEMPLATE ??
    "https://feed.evangelizo.org/v2/reader.php",
  evangelizoLang: process.env.EVANGELIZO_LANG ?? "PT",
  evangelizoContent: process.env.EVANGELIZO_CONTENT,
  reflectionRssUrl:
    process.env.REFLECTION_RSS_URL ??
    "https://sua-fonte.exemplo/reflexoes.rss",
};
