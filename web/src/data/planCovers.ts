const covers = import.meta.glob<string>("../assets/reading-plans/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

export function planCover(fileName: string): string {
  const url = covers[`../assets/reading-plans/${fileName}`];
  if (!url) throw new Error(`Capa de plano não encontrada: ${fileName}`);
  return url;
}
