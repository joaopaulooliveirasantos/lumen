import { Clipboard } from "@capacitor/clipboard";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { isNative } from "./platform";

const isCancel = (error: unknown) => /cancel|abort/i.test(String((error as Error)?.message ?? error));

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Compartilha uma imagem. No app, grava no cache (exposto pelo FileProvider do AndroidManifest) e abre a
 * folha de compartilhamento; no navegador usa a Web Share API com arquivo ou, sem ela, baixa a imagem.
 */
export async function shareImage(blob: Blob, fileName: string, title: string): Promise<"shared" | "downloaded" | "cancelled"> {
  try {
    if (isNative()) {
      const { uri } = await Filesystem.writeFile({ path: fileName, data: await blobToBase64(blob), directory: Directory.Cache });
      await Share.share({ title, files: [uri], dialogTitle: title });
      return "shared";
    }
    const file = new File([blob], fileName, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return "shared";
    }
  } catch (error) {
    if (isCancel(error)) return "cancelled";
    throw error;
  }
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}

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
    if (isCancel(error)) return "cancelled";
    throw error;
  }
  await copyText(text);
  return "copied";
}
