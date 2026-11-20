// Vitrine do design system (Fase 4), acessível pelo Perfil enquanto as telas não são migradas.
// Serve para revisar no aparelho ícones, cores e componentes nos três modos de leitura.
import { useEffect, useState } from "preact/hooks";
import { GoogleLogo, Icon, iconNames } from "../components/Icon";
import { LoadingScreen } from "../components/LoadingScreen";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  HeroCard,
  IconButton,
  ListRow,
  ScreenHeader,
  SectionTitle,
  Spinner,
  TextField,
} from "../components/ui";
import type { ReadingMode } from "../types/settings";
import { useAppState } from "../state/AppState";
import { liturgicColorHex } from "../theme/palette";
import { shadeColor } from "../services/color";

const LITURGIC = [
  { nome: "Verde", hex: "#2E7D32" },
  { nome: "Roxo", hex: "#6A1B9A" },
  { nome: "Vermelho", hex: "#C62828" },
  { nome: "Branco", hex: "#D97706" },
  { nome: "Rosa", hex: "#AD1457" },
];



export function ComponentGalleryScreen() {
  const { settings, updateSettings, liturgy } = useAppState();
  const readingMode = settings.readingMode;
  const [previewAccent, setPreviewAccent] = useState<string | null>(null);
  const accent = previewAccent ?? (liturgy ? liturgicColorHex(liturgy.cor) : "#2E7D32");
  // A prévia de cor vale só dentro da galeria: sobrescreve as variáveis no próprio contêiner.
  const accentVars = previewAccent
    ? { "--accent": accent, "--accent-soft": accent + "33", "--accent-light": shadeColor(accent, 18), "--accent-dark": shadeColor(accent, -24) }
    : undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const emailError = email && !email.includes("@") ? "Informe um e-mail válido." : null;

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <section class="screen" style={accentVars}>
      <ScreenHeader title="Componentes" subtitle="Design system do novo app (Fase 4)" />

      <SectionTitle>Modo de leitura</SectionTitle>
      <div class="row">
        {(["claro", "escuro", "sepia"] as const).map((mode) => (
          <Chip key={mode} active={readingMode === mode} onClick={() => updateSettings({ readingMode: mode as ReadingMode })}>
            {mode === "sepia" ? "Sépia" : mode[0].toUpperCase() + mode.slice(1)}
          </Chip>
        ))}
      </div>

      <SectionTitle>Cor litúrgica</SectionTitle>
      <div class="row">
        {LITURGIC.map((c) => (
          <Chip key={c.hex} active={accent.toLowerCase() === c.hex.toLowerCase()} onClick={() => setPreviewAccent(c.hex)}>
            {c.nome}
          </Chip>
        ))}
      </div>

      <SectionTitle>Destaque</SectionTitle>
      <HeroCard>
        <div class="row" style={{ justifyContent: "space-between" }}>
          <Icon name="cross" size={26} class="loading-cross" />
          <IconButton icon="calendar" label="Escolher data" />
        </div>
        <p style={{ margin: "10px 0 2px", fontSize: "1.25rem", fontWeight: 900, letterSpacing: "0.2em" }}>LUMEN</p>
        <p class="muted">5ª feira da 33ª Semana do Tempo Comum</p>
      </HeroCard>

      <SectionTitle action={<Button variant="ghost">Ver todos</Button>}>Cards e listas</SectionTitle>
      <Card>
        <h3 class="title">Card simples</h3>
        <p class="muted">Superfície padrão para conteúdo.</p>
      </Card>
      <Card onClick={() => undefined}>
        <h3 class="title">Card tocável</h3>
        <p class="muted">Encolhe levemente ao toque.</p>
      </Card>
      <div class="list">
        <ListRow icon="settings" title="Configurações" subtitle="Tema, fonte, lembrete" onClick={() => undefined} />
        <ListRow icon="bookmark" title="Favoritos" subtitle="12 versículos" onClick={() => undefined} />
        <ListRow icon="download" title="Bíblia offline" trailing={<Spinner size={18} />} />
      </div>

      <SectionTitle>Botões</SectionTitle>
      <Button block icon="checkmark">
        Primário
      </Button>
      <button type="button" class="btn btn-secondary btn-block">
        <GoogleLogo />
        <span>Continuar com Google</span>
      </button>
      <div class="row">
        <Button variant="secondary" icon="share">
          Secundário
        </Button>
        <Button variant="ghost">Texto</Button>
        <Button variant="danger" icon="trash">
          Excluir
        </Button>
      </div>
      <div class="row">
        <Button
          loading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        >
          Carregando
        </Button>
        <Button disabled>Desativado</Button>
      </div>

      <SectionTitle>Formulário</SectionTitle>
      <TextField
        label="E-mail"
        type="email"
        icon="mail"
        value={email}
        onInput={setEmail}
        placeholder="voce@exemplo.com"
        autoComplete="email"
        inputMode="email"
        error={emailError}
      />
      <TextField label="Senha" type="password" icon="lock" value={password} onInput={setPassword} hint="Mínimo de 8 caracteres." />
      <Checkbox checked={accepted} onChange={setAccepted}>
        Li e aceito os <a href="#">Termos de Uso</a> e a <a href="#">Política de Privacidade</a>.
      </Checkbox>

      <SectionTitle>Avisos e estados</SectionTitle>
      <Alert tone="error" title="Não foi possível carregar" action={<Button variant="secondary">Tentar novamente</Button>}>
        Verifique sua conexão.
      </Alert>
      <Alert tone="info">Exibindo versão salva no aparelho.</Alert>
      <Alert tone="success" title="Tradução baixada" />
      <Card>
        <EmptyState icon="bookmark" title="Nenhum favorito ainda">
          Toque e segure um versículo para salvar.
        </EmptyState>
      </Card>
      <Button variant="secondary" onClick={() => setShowSplash(true)}>
        Ver tela de carregamento (3 s)
      </Button>

      <SectionTitle>Ícones ({iconNames.length})</SectionTitle>
      <div class="icon-grid">
        {iconNames.map((name) => (
          <div key={name} class="icon-cell">
            <Icon name={name} size={24} />
            {name}
          </div>
        ))}
      </div>

      <SectionTitle>Marca</SectionTitle>
      <div class="swatch-row">
        {["--brand-gold", "--brand-bronze", "--brand-cream", "--brand-green", "--brand-green-dark", "--accent"].map((v) => (
          <span key={v} class="swatch" title={v} style={{ background: `var(${v})` }} />
        ))}
      </div>

      {showSplash ? <LoadingScreen message="Preparando a liturgia de hoje..." accent={accent} /> : null}
    </section>
  );
}
