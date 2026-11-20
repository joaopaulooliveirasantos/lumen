import termsSource from "../../../../doc/Termos-de-Uso.md?raw";
import privacySource from "../../../../doc/Politica-de-Privacidade.md?raw";
import { useEffect } from "preact/hooks";
import { Markdown } from "../../components/Markdown";
import { IconButton } from "../../components/ui";

export type LegalDoc = "termos" | "privacidade";

// Os textos vêm de doc/*.md e vão embutidos no app (disponíveis offline). Ao alterar os termos,
// atualizar a data de "Última atualização" no próprio arquivo.
const SOURCES: Record<LegalDoc, string> = { termos: termsSource, privacidade: privacySource };

export function LegalScreen({ doc, onClose }: { doc: LegalDoc; onClose: () => void }) {
  // Esc (e o botão "voltar" do Android, que o App traduz em Esc) fecha o texto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div class="overlay-screen" role="dialog" aria-modal="true">
      <div class="overlay-bar">
        <IconButton icon="arrowLeft" label="Voltar" onClick={onClose} />
        <span class="overlay-title">{doc === "termos" ? "Termos de Uso" : "Política de Privacidade"}</span>
      </div>
      <div class="overlay-body">
        <Markdown source={SOURCES[doc]} />
      </div>
    </div>
  );
}

/** Texto "Li e aceito os Termos de Uso e a Política de Privacidade" com links que abrem o LegalScreen. */
export function TermsLabel({ onOpen }: { onOpen: (doc: LegalDoc) => void }) {
  const link = (doc: LegalDoc, text: string) => (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onOpen(doc);
      }}
    >
      {text}
    </a>
  );
  return (
    <>
      Li e aceito os {link("termos", "Termos de Uso")} e a {link("privacidade", "Política de Privacidade")}.
    </>
  );
}
