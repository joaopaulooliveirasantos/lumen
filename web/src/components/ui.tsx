// Componentes de base do design system (Fase 4). Visual definido em styles.css, com as variáveis de
// tema (--accent, --card-bg, ...) aplicadas por theme/palette.ts. Telas novas devem usar estes
// componentes em vez de classes soltas.
import type { ComponentChildren } from "preact";
import { useId, useState } from "preact/hooks";
import { Icon, type IconName } from "./Icon";

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

// ---- Botão ---------------------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  children: ComponentChildren;
  variant?: ButtonVariant;
  icon?: IconName;
  /** Ocupa a largura toda. */
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  class?: string;
};

export function Button({ children, variant = "primary", icon, block, loading, disabled, type = "button", onClick, class: extra }: ButtonProps) {
  return (
    <button
      type={type}
      class={cx("btn", `btn-${variant}`, block && "btn-block", extra)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {loading ? <Spinner size={18} /> : icon ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
    </button>
  );
}

/** Botão redondo só com ícone (ex.: fechar, calendário). `label` vira o nome acessível. */
export function IconButton(props: { icon: IconName; label: string; onClick?: () => void; class?: string }) {
  return (
    <button type="button" class={cx("icon-btn", props.class)} aria-label={props.label} title={props.label} onClick={props.onClick}>
      <Icon name={props.icon} size={20} />
    </button>
  );
}

// ---- Campo de texto ------------------------------------------------------------------------------

type TextFieldProps = {
  label: string;
  value: string;
  onInput: (value: string) => void;
  type?: "text" | "email" | "password" | "tel";
  icon?: IconName;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal" | "search" | "url" | "none";
  disabled?: boolean;
};

export function TextField({ label, value, onInput, type = "text", icon, placeholder, hint, error, autoComplete, inputMode, disabled }: TextFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div class={cx("field", error && "field-invalid")}>
      <label class="field-label" for={id}>
        {label}
      </label>
      <div class="field-control">
        {icon ? <Icon name={icon} size={18} class="field-icon" /> : null}
        <input
          id={id}
          class="field-input"
          // O Preact 11 discrimina os atributos por `type`; a união aqui é segura para campos de texto.
          type={(isPassword && revealed ? "text" : type) as "text"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onInput={(e) => onInput((e.currentTarget as HTMLInputElement).value)}
        />
        {isPassword ? (
          <button
            type="button"
            class="field-action"
            aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setRevealed((r) => !r)}
          >
            <Icon name={revealed ? "eyeOff" : "eye"} size={18} />
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} class="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} class="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Caixa de seleção com texto (ex.: aceite dos termos). */
export function Checkbox(props: { checked: boolean; onChange: (checked: boolean) => void; children: ComponentChildren }) {
  return (
    <label class="checkbox">
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange((e.currentTarget as HTMLInputElement).checked)} />
      <span class="checkbox-box" aria-hidden="true">
        <Icon name="checkmark" size={14} />
      </span>
      <span class="checkbox-text">{props.children}</span>
    </label>
  );
}

// ---- Superfícies ---------------------------------------------------------------------------------

export function Card(props: { children: ComponentChildren; class?: string; onClick?: () => void }) {
  if (props.onClick) {
    return (
      <button type="button" class={cx("card", "card-pressable", props.class)} onClick={props.onClick}>
        {props.children}
      </button>
    );
  }
  return <div class={cx("card", props.class)}>{props.children}</div>;
}

/** Cartão de destaque com gradiente na cor litúrgica (topo da Home, cabeçalhos). */
export function HeroCard(props: { children: ComponentChildren; class?: string }) {
  return <div class={cx("hero", props.class)}>{props.children}</div>;
}

export function SectionTitle(props: { children: ComponentChildren; action?: ComponentChildren }) {
  return (
    <div class="section-title">
      <h2>{props.children}</h2>
      {props.action}
    </div>
  );
}

/** Linha de lista tocável: ícone, título, subtítulo opcional e seta. */
export function ListRow(props: { icon?: IconName; title: string; subtitle?: string; trailing?: ComponentChildren; onClick?: () => void }) {
  const content = (
    <>
      {props.icon ? (
        <span class="list-row-icon">
          <Icon name={props.icon} size={18} />
        </span>
      ) : null}
      <span class="list-row-body">
        <span class="list-row-title">{props.title}</span>
        {props.subtitle ? <span class="list-row-subtitle">{props.subtitle}</span> : null}
      </span>
      {props.trailing ?? (props.onClick ? <Icon name="chevronRight" size={18} class="list-row-chevron" /> : null)}
    </>
  );
  return props.onClick ? (
    <button type="button" class="list-row" onClick={props.onClick}>
      {content}
    </button>
  ) : (
    <div class="list-row">{content}</div>
  );
}

export function Chip(props: { children: ComponentChildren; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" class={cx("chip", props.active && "chip-active")} aria-pressed={props.active} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

// ---- Estados -------------------------------------------------------------------------------------

export function Spinner({ size = 22, label }: { size?: number; label?: string }) {
  // Preact 11 não acrescenta "px" a números em `style`.
  return <span class="spinner" style={{ width: `${size}px`, height: `${size}px` }} role={label ? "status" : undefined} aria-label={label} />;
}

type AlertTone = "error" | "info" | "success";

export function Alert(props: { tone?: AlertTone; title?: string; children?: ComponentChildren; action?: ComponentChildren }) {
  const tone = props.tone ?? "info";
  const icon: IconName = tone === "error" ? "alert" : tone === "success" ? "checkmark" : "alert";
  return (
    <div class={cx("alert", `alert-${tone}`)} role={tone === "error" ? "alert" : "status"}>
      <Icon name={icon} size={18} class="alert-icon" />
      <div class="alert-body">
        {props.title ? <p class="alert-title">{props.title}</p> : null}
        {props.children ? <div class="alert-text">{props.children}</div> : null}
        {props.action ? <div class="alert-action">{props.action}</div> : null}
      </div>
    </div>
  );
}

/** Estado vazio ou de erro de uma tela inteira, com ação opcional. */
export function EmptyState(props: { icon: IconName; title: string; children?: ComponentChildren; action?: ComponentChildren }) {
  return (
    <div class="empty-state">
      <span class="empty-state-icon">
        <Icon name={props.icon} size={28} />
      </span>
      <p class="empty-state-title">{props.title}</p>
      {props.children ? <div class="muted">{props.children}</div> : null}
      {props.action}
    </div>
  );
}

/** Cabeçalho de tela com título e ação de voltar opcional. */
export function ScreenHeader(props: { title: string; subtitle?: string; onBack?: () => void; action?: ComponentChildren }) {
  return (
    <header class="screen-header">
      {props.onBack ? <IconButton icon="arrowLeft" label="Voltar" onClick={props.onBack} /> : null}
      <div class="screen-header-text">
        <h1>{props.title}</h1>
        {props.subtitle ? <p>{props.subtitle}</p> : null}
      </div>
      {props.action}
    </header>
  );
}
