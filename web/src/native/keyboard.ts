// Teclado virtual. No Android o Capacitor 8 encolhe o WebView quando o teclado abre (adjustResize +
// SystemBars). Isso trazia dois incômodos: a barra inferior subia junto e ficava colada no teclado,
// ocupando espaço, e o campo focado podia ficar atrás dele. Aqui:
// - `html.keyboard-open` enquanto o teclado está visível (o CSS esconde a barra inferior);
// - o campo focado é rolado para o centro da área visível.
// Detecção sem plugin: há um campo editável focado e a altura da janela caiu bem abaixo da referência.
import { useEffect } from "preact/hooks";

const NON_TEXT_INPUTS = new Set(["checkbox", "radio", "button", "submit", "range", "color", "file", "reset"]);

export function isEditable(el: Element | null): el is HTMLElement {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  if (el instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(el.type) && !el.readOnly;
  return el instanceof HTMLElement && el.isContentEditable === true;
}

/** O teclado está aberto se a janela encolheu mais de 20% em relação à altura de referência. */
export function keyboardLikelyOpen(currentHeight: number, baselineHeight: number): boolean {
  return currentHeight < baselineHeight * 0.8;
}

export function useKeyboardAwareness(): void {
  useEffect(() => {
    const root = document.documentElement;
    let baseline = window.innerHeight;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;

    const update = () => {
      const focused = document.activeElement;
      if (!isEditable(focused)) {
        // Sem campo focado, a altura atual é a referência (cobre rotação da tela).
        baseline = window.innerHeight;
        root.classList.remove("keyboard-open");
        return;
      }
      const open = keyboardLikelyOpen(window.innerHeight, baseline);
      root.classList.toggle("keyboard-open", open);
      if (open) {
        clearTimeout(scrollTimer);
        // Espera o layout assentar (a barra inferior some e a área visível muda).
        scrollTimer = setTimeout(() => focused.scrollIntoView({ block: "center", behavior: "smooth" }), 80);
      }
    };
    // focusout dispara antes de o próximo campo receber o foco: adia para não piscar a barra.
    const onFocusOut = () => setTimeout(update, 50);

    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", onFocusOut);
      root.classList.remove("keyboard-open");
    };
  }, []);
}
