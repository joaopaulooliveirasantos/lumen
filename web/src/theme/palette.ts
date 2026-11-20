import type { ReadingMode } from "../types/settings";
import type { ThemePalette } from "../types/theme";
import { shadeColor } from "../services/color";

export function liturgicColorHex(color: string): string {
  const normalized = color.toLowerCase();
  if (normalized.includes("roxo")) return "#6A1B9A";
  if (normalized.includes("vermelho")) return "#C62828";
  if (normalized.includes("branco")) return "#D97706";
  if (normalized.includes("rosa")) return "#AD1457";
  return "#2E7D32";
}

export function getThemePalette(mode: ReadingMode, accent: string): ThemePalette {
  if (mode === "escuro") {
    return {
      appBackground: "#0B1117",
      cardBackground: "#111827",
      border: "#1F2937",
      titleText: "#F9FAFB",
      bodyText: "#E5E7EB",
      mutedText: "#9CA3AF",
      buttonText: "#F9FAFB",
      buttonBackground: "#1F2937",
      accent,
    };
  }

  if (mode === "sepia") {
    return {
      appBackground: "#F6EFE3",
      cardBackground: "#FFF9EF",
      border: "#E7D6B8",
      titleText: "#5B4636",
      bodyText: "#6C5745",
      mutedText: "#8C775F",
      buttonText: "#FFFFFF",
      buttonBackground: "#7A614A",
      accent,
    };
  }

  return {
    appBackground: "#F4F8F5",
    cardBackground: "#FFFFFF",
    border: "#DDE7DF",
    titleText: "#1F2937",
    bodyText: "#111827",
    mutedText: "#4B5563",
    buttonText: "#FFFFFF",
    buttonBackground: "#1E5C35",
    accent,
  };
}

// Expõe a paleta como variáveis CSS (--app-bg, --accent, ...) no elemento raiz.
export function applyTheme(palette: ThemePalette, fontScale: number, root: HTMLElement = document.documentElement): void {
  const vars: Record<string, string> = {
    "--app-bg": palette.appBackground,
    "--card-bg": palette.cardBackground,
    "--border": palette.border,
    "--title": palette.titleText,
    "--body": palette.bodyText,
    "--muted": palette.mutedText,
    "--button-text": palette.buttonText,
    "--button-bg": palette.buttonBackground,
    "--accent": palette.accent,
    "--accent-soft": `${palette.accent}33`,
    "--accent-light": shadeColor(palette.accent, 18),
    "--accent-dark": shadeColor(palette.accent, -24),
    "--font-scale": String(fontScale),
  };
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}
