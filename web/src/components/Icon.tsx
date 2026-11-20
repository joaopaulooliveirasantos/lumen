import type { ComponentChildren } from "preact";

// Ícones em SVG inline (grade 24x24), só os usados no app. Os nomes seguem o AppIcon do React Native
// (mobile/src/components/AppIcon.tsx) para facilitar a migração das telas. Ícones de traço usam
// `currentColor` no stroke; os marcados com `fill` são sólidos (como os FontAwesome "solid" do RN).

type IconSpec = { body: ComponentChildren; fill?: boolean };

const ICONS = {
  // ---- Abas e marca ----
  church: {
    body: (
      <>
        <path d="M12 2v5M10 4h4" />
        <path d="M6 22V11l6-4 6 4v11" />
        <path d="M2 22v-6l4-2.5M22 22v-6l-4-2.5" />
        <path d="M10 22v-4a2 2 0 0 1 4 0v4" />
        <path d="M1 22h22" />
      </>
    ),
  },
  book: {
    body: (
      <>
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
      </>
    ),
  },
  bible: {
    fill: true,
    body: (
      <path
        fill-rule="evenodd"
        d="M6.5 2H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5a1 1 0 0 0 0 2H19a1 1 0 1 1 0 2H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Zm4.5 3v2.5H8.5v2H11V15h2V9.5h2.5v-2H13V5h-2Z"
      />
    ),
  },
  prayingHands: {
    body: (
      <>
        <path d="M12 2.5c-1 0-1.6.8-2 1.8L8 10.5 6 14.5" />
        <path d="M12 2.5c1 0 1.6.8 2 1.8l2 6.2 2 4" />
        <path d="M12 2.5V16" />
        <path d="M6 14.5 3.5 17.5 6.5 21l3-2.5c1.6-1.3 2.5-2.5 2.5-4.5M18 14.5l2.5 3-3 3.5-3-2.5C12.9 17.2 12 16 12 14" />
      </>
    ),
  },
  person: {
    body: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
      </>
    ),
  },
  cross: {
    fill: true,
    body: <path d="M10.5 2h3v5.5H18v3h-4.5V22h-3V10.5H6v-3h4.5V2Z" />,
  },

  // ---- Players ----
  play: { fill: true, body: <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /> },
  pause: {
    fill: true,
    body: (
      <>
        <rect x="5" y="4" width="5" height="16" rx="1.2" />
        <rect x="14" y="4" width="5" height="16" rx="1.2" />
      </>
    ),
  },
  playSkipBack: {
    fill: true,
    body: (
      <>
        <path d="M19 5.2v13.6a1 1 0 0 1-1.55.83L8 13.2a1.4 1.4 0 0 1 0-2.4l9.45-6.43A1 1 0 0 1 19 5.2Z" />
        <rect x="4" y="4" width="2.6" height="16" rx="1" />
      </>
    ),
  },
  playSkipForward: {
    fill: true,
    body: (
      <>
        <path d="M5 5.2v13.6a1 1 0 0 0 1.55.83L16 13.2a1.4 1.4 0 0 0 0-2.4L6.55 4.37A1 1 0 0 0 5 5.2Z" />
        <rect x="17.4" y="4" width="2.6" height="16" rx="1" />
      </>
    ),
  },

  // ---- Ações ----
  close: {
    body: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
  },
  copy: {
    body: (
      <>
        <rect width="14" height="14" x="8" y="8" rx="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </>
    ),
  },
  share: {
    body: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
      </>
    ),
  },
  bookmark: { fill: true, body: <path d="M6 2h12a1 1 0 0 1 1 1v18.2a.6.6 0 0 1-.95.49L12 17.5l-6.05 4.19A.6.6 0 0 1 5 21.2V3a1 1 0 0 1 1-1Z" /> },
  comment: {
    body: (
      <>
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
      </>
    ),
  },
  checkmark: { body: <path d="M20 6 9 17l-5-5" /> },
  timer: {
    body: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
  },
  externalLink: {
    body: (
      <>
        <path d="M15 3h6v6M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
  },
  settings: {
    body: (
      <>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  calendar: {
    body: (
      <>
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  },
  star: {
    fill: true,
    body: <path d="M11.1 2.6a1 1 0 0 1 1.8 0l2.4 4.9 5.4.8a1 1 0 0 1 .55 1.7l-3.9 3.8.92 5.37a1 1 0 0 1-1.45 1.05L12 17.7l-4.82 2.53a1 1 0 0 1-1.45-1.05l.92-5.37-3.9-3.8a1 1 0 0 1 .55-1.7l5.4-.8 2.4-4.9Z" />,
  },
  sun: {
    body: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  },
  crown: {
    body: (
      <>
        <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z" />
        <path d="M5 21h14" />
      </>
    ),
  },
  search: {
    body: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
  },
  shield: {
    body: <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />,
  },
  heart: {
    body: <path d="M19.5 13.6 12 21l-7.5-7.4A5 5 0 0 1 12 6.5a5 5 0 0 1 7.5 7.1Z" />,
  },
  flower: {
    body: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 9a3 3 0 1 1 3-3c0 1.3-1.5 3-3 3ZM12 9a3 3 0 1 0-3-3c0 1.3 1.5 3 3 3Z" />
        <path d="M15 12a3 3 0 1 1 3 3c-1.3 0-3-1.5-3-3ZM15 12a3 3 0 1 0 3-3c-1.3 0-3 1.5-3 3Z" />
        <path d="M12 15a3 3 0 1 1-3 3c0-1.3 1.5-3 3-3ZM12 15a3 3 0 1 0 3 3c0-1.3-1.5-3-3-3Z" />
        <path d="M9 12a3 3 0 1 1-3-3c1.3 0 3 1.5 3 3ZM9 12a3 3 0 1 0-3 3c1.3 0 3-1.5 3-3Z" />
      </>
    ),
  },
  voice: {
    body: (
      <>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
      </>
    ),
  },

  // ---- Navegação e formulários (novos, para login e telas) ----
  chevronRight: { body: <path d="m9 18 6-6-6-6" /> },
  chevronLeft: { body: <path d="m15 18-6-6 6-6" /> },
  arrowLeft: { body: <path d="M19 12H5M12 19l-7-7 7-7" /> },
  download: { body: <path d="M12 15V3M7 10l5 5 5-5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /> },
  trash: { body: <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /> },
  mail: {
    body: (
      <>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
  },
  lock: {
    body: (
      <>
        <rect width="18" height="11" x="3" y="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  phone: {
    body: (
      <>
        <rect width="14" height="20" x="5" y="2" rx="2" />
        <path d="M12 18h.01" />
      </>
    ),
  },
  eye: {
    body: (
      <>
        <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  eyeOff: {
    body: (
      <>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.97 0 8.9 3.37 9.94 6.65a1 1 0 0 1 0 .7 10.8 10.8 0 0 1-1.97 3.03M6.61 6.61A13.53 13.53 0 0 0 2.06 11.65a1 1 0 0 0 0 .7C3.1 15.63 7.03 19 12 19a9.74 9.74 0 0 0 5.39-1.61" />
        <path d="M14.08 14.16a3 3 0 0 1-4.24-4.24M2 2l20 20" />
      </>
    ),
  },
  alert: {
    body: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </>
    ),
  },
  wifiOff: { body: <path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.18-2.65M22 8.82a15 15 0 0 0-11.29-3.76M5 12.86a10 10 0 0 1 5.17-2.69M19 12.86a10 10 0 0 0-2-1.37M2 2l20 20" /> },
} satisfies Record<string, IconSpec>;

export type IconName = keyof typeof ICONS;
export const iconNames = Object.keys(ICONS) as IconName[];

type Props = { name: IconName; size?: number; class?: string; title?: string };

export function Icon({ name, size = 22, class: className, title }: Props) {
  const spec: IconSpec = ICONS[name];
  return (
    <svg
      class={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={spec.fill ? "currentColor" : "none"}
      stroke={spec.fill ? "none" : "currentColor"}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
    >
      {spec.body}
    </svg>
  );
}

/** Logotipo do Google para o botão "Continuar com Google" (cores oficiais exigidas pelas diretrizes). */
export function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
