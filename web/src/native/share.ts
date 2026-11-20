import { Clipboard } from "@capacitor/clipboard";
import { Share } from "@capacitor/share";
import { isNative } from "./platform";

export async function copyText(text: string): Promise<void> {
  if (isNative()) {
    await Clipboard.write({ string: text });
    return;
  }
  await navigator.clipboard.writeText(text);
}

/** Abre a folha de compartilhamento; sem suporte (navegador de desktop), copia o texto. Devolve o que fez. */
export async function shareText(title: string, text: string): Promise<"shared" | "copied" | "cancelled"> {
  try {
    if (isNative()) {
      await Share.share({ title, text, dialogTitle: title });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return "shared";
    }
  } catch (error) {
    // Fechar a folha de compartilhamento chega como erro; não é falha.
    if (/cancel|abort/i.test(String((error as Error)?.message ?? error))) return "cancelled";
    throw error;
  }
  await copyText(text);
  return "copied";
}
