import { shadeColor } from "../services/color";
import { Icon } from "./Icon";

export const BRAND_GREEN = "#1E5C35";

type Props = { message?: string; accent?: string };

/** Tela de carregamento da marca: gradiente na cor de destaque, cruz dourada pulsante e "LUMEN". */
export function LoadingScreen({ message = "Carregando...", accent = BRAND_GREEN }: Props) {
  const background = `linear-gradient(135deg, ${shadeColor(accent, 18)}, ${accent}, ${shadeColor(accent, -24)})`;
  return (
    <div class="loading-screen" style={{ background }} role="status" aria-live="polite">
      <Icon name="cross" size={44} class="loading-cross" />
      <span class="loading-divider" />
      <p class="loading-title">LUMEN</p>
      <span class="spinner spinner-gold" />
      <p class="loading-message">{message}</p>
    </div>
  );
}
