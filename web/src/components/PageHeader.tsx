import type { ComponentChildren } from "preact";
import logoUrl from "../assets/brand/logo.png";
import { useAppState, MAX_FONT_SCALE, MIN_FONT_SCALE } from "../state/AppState";
import { IconButton } from "./ui";

/** Barra do topo das abas: logotipo (ou voltar), título e ação opcional à direita. */
export function PageHeader(props: { title: string; onBack?: () => void; action?: ComponentChildren }) {
  return (
    <header class="page-header">
      {props.onBack ? (
        <IconButton icon="arrowLeft" label="Voltar" onClick={props.onBack} />
      ) : (
        <img class="page-header-logo" src={logoUrl} alt="" width={32} height={32} />
      )}
      <h1 class="page-header-title">{props.title}</h1>
      <div class="page-header-action">{props.action}</div>
    </header>
  );
}

/** Botões A− / A+ que mudam o tamanho do texto de leitura (salvo nas configurações). */
export function FontScaleControls() {
  const { settings, changeFontScale } = useAppState();
  return (
    <div class="font-controls" role="group" aria-label="Tamanho do texto">
      <button type="button" class="font-btn" aria-label="Diminuir texto" disabled={settings.fontScale <= MIN_FONT_SCALE} onClick={() => changeFontScale(-0.1)}>
        A−
      </button>
      <button type="button" class="font-btn font-btn-lg" aria-label="Aumentar texto" disabled={settings.fontScale >= MAX_FONT_SCALE} onClick={() => changeFontScale(0.1)}>
        A+
      </button>
    </div>
  );
}
