import type { ComponentChildren } from "preact";
import logoUrl from "../../assets/brand/logo.png";

/** Moldura das telas de entrada: fundo creme da marca, logotipo e conteúdo num cartão. */
export function AuthLayout(props: { title?: string; subtitle?: string; children: ComponentChildren; compactBrand?: boolean }) {
  return (
    <div class="auth-screen">
      <div class={props.compactBrand ? "auth-brand auth-brand-compact" : "auth-brand"}>
        <img class="auth-logo" src={logoUrl} alt="" width={props.compactBrand ? 56 : 88} height={props.compactBrand ? 56 : 88} />
        <p class="auth-wordmark">LUMEN</p>
        {!props.compactBrand ? <p class="auth-tagline">Liturgia diária, Bíblia e oração</p> : null}
      </div>
      <div class="auth-card">
        {props.title ? <h1 class="auth-title">{props.title}</h1> : null}
        {props.subtitle ? <p class="auth-subtitle">{props.subtitle}</p> : null}
        {props.children}
      </div>
    </div>
  );
}
