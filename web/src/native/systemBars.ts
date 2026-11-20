// Ícones da barra de status e da barra de navegação do Android conforme o fundo do app.
// O Capacitor 8 desenha o app atrás das barras (edge-to-edge) e, por padrão, escolhe a cor dos ícones
// pelo tema do *sistema*. Isso deixava ícones escuros sobre o fundo escuro quando o app estava no modo
// escuro com o celular no modo claro (e o contrário). Aqui a escolha segue o fundo do próprio app.
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";

let current: boolean | null = null;

/** `darkBackground`: o fundo atrás das barras é escuro (ícones claros). */
export function setSystemBarsForBackground(darkBackground: boolean, background: string): void {
  // theme-color: cor da barra no navegador (dev) e em WebViews antigos.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
  if (current === darkBackground || !Capacitor.isNativePlatform()) return;
  current = darkBackground;
  // Atenção à nomenclatura do Capacitor: Dark = ícones claros (para fundo escuro).
  void SystemBars.setStyle({ style: darkBackground ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {
    current = null;
  });
}
