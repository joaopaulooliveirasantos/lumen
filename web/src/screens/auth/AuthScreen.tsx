// Tela de entrada (sem sessão): entrar, criar conta, Google, esqueci a senha e aviso de confirmação.
import { useState } from "preact/hooks";
import { GoogleLogo } from "../../components/Icon";
import { Alert, Button, Checkbox, TextField } from "../../components/ui";
import { useAuth } from "../../auth/AuthProvider";
import { authErrorMessage, validateEmail, validateName, validatePassword } from "../../services/authErrors";
import { formatPhoneInput, normalizePhone } from "../../services/phone";
import { AuthLayout } from "./AuthLayout";
import { LegalScreen, TermsLabel, type LegalDoc } from "./LegalScreen";

type View = "entrar" | "criar" | "esqueci" | "verifique-email" | "link-enviado";

export function AuthScreen() {
  const auth = useAuth();
  // Em dev, ?auth=criar|esqueci|verifique-email abre direto naquela etapa (capturas e testes manuais).
  const [view, setView] = useState<View>(() => {
    const requested = import.meta.env.DEV ? (new URLSearchParams(window.location.search).get("auth") as View | null) : null;
    return requested && ["entrar", "criar", "esqueci", "verifique-email", "link-enviado"].includes(requested) ? requested : "entrar";
  });
  const [legal, setLegal] = useState<LegalDoc | null>(null);
  const [email, setEmail] = useState("");

  if (legal) return <LegalScreen doc={legal} onClose={() => setLegal(null)} />;

  return (
    <>
      {view === "entrar" || view === "criar" ? (
        <SignInOrUp
          mode={view}
          email={email}
          setEmail={setEmail}
          onSwitch={(mode) => setView(mode)}
          onForgot={() => setView("esqueci")}
          onNeedsConfirmation={() => setView("verifique-email")}
          onOpenLegal={setLegal}
          linkMessage={auth.linkMessage}
          onDismissLinkMessage={auth.clearLinkMessage}
        />
      ) : null}
      {view === "esqueci" ? <ForgotPassword email={email} setEmail={setEmail} onSent={() => setView("link-enviado")} onBack={() => setView("entrar")} /> : null}
      {view === "verifique-email" ? <CheckEmail email={email} onBack={() => setView("entrar")} /> : null}
      {view === "link-enviado" ? (
        <AuthLayout compactBrand title="Verifique seu e-mail" subtitle={`Se existir uma conta para ${email.trim()}, enviamos um link para criar uma nova senha.`}>
          <p class="muted">Abra o link neste celular. Ele vale por 1 hora. Procure também na caixa de spam.</p>
          <Button block variant="secondary" onClick={() => setView("entrar")}>
            Voltar para entrar
          </Button>
        </AuthLayout>
      ) : null}
    </>
  );
}

// ---- Entrar / Criar conta ------------------------------------------------------------------------

type SignProps = {
  mode: "entrar" | "criar";
  email: string;
  setEmail: (value: string) => void;
  onSwitch: (mode: "entrar" | "criar") => void;
  onForgot: () => void;
  onNeedsConfirmation: () => void;
  onOpenLegal: (doc: LegalDoc) => void;
  linkMessage: string | null;
  onDismissLinkMessage: () => void;
};

function SignInOrUp(props: SignProps) {
  const auth = useAuth();
  const isSignUp = props.mode === "criar";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<"form" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phoneResult = normalizePhone(phone);
  const errors = {
    name: isSignUp ? validateName(name) : null,
    email: validateEmail(props.email),
    phone: isSignUp && !phoneResult.ok ? phoneResult.error : null,
    password: isSignUp ? validatePassword(password) : password ? null : "Informe sua senha.",
    confirm: isSignUp && confirm !== password ? "As senhas não conferem." : null,
    terms: isSignUp && !accepted ? "É preciso aceitar para criar a conta." : null,
  };
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : null);

  async function submit(e: Event) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (Object.values(errors).some(Boolean)) return;
    setBusy("form");
    try {
      if (isSignUp && phoneResult.ok) {
        const { needsEmailConfirmation } = await auth.signUp({ displayName: name, email: props.email, phone: phoneResult.e164, password });
        if (needsEmailConfirmation) props.onNeedsConfirmation();
      } else {
        await auth.signIn(props.email, password);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function google() {
    setError(null);
    setBusy("google");
    try {
      await auth.signInWithGoogle();
    } catch (err) {
      const message = authErrorMessage(err);
      if (message !== "Login cancelado.") setError(message);
    } finally {
      setBusy(null);
    }
  }

  const switchMode = (mode: "entrar" | "criar") => {
    setSubmitted(false);
    setError(null);
    props.onSwitch(mode);
  };

  return (
    <AuthLayout title={isSignUp ? "Criar conta" : "Entrar"} subtitle={isSignUp ? "Leva menos de um minuto." : "Bem-vindo de volta."}>
      {props.linkMessage ? (
        <Alert tone="info" action={<Button variant="ghost" onClick={props.onDismissLinkMessage}>Ok</Button>}>
          {props.linkMessage}
        </Alert>
      ) : null}

      <button type="button" class="btn btn-secondary btn-block" disabled={busy !== null} onClick={google}>
        {busy === "google" ? <span class="spinner" style={{ width: "18px", height: "18px" }} /> : <GoogleLogo />}
        <span>Continuar com Google</span>
      </button>

      <div class="divider-text">
        <span>ou com e-mail</span>
      </div>

      <form class="auth-form" onSubmit={submit} noValidate>
        {isSignUp ? <TextField label="Nome" icon="person" value={name} onInput={setName} autoComplete="name" error={show("name")} /> : null}
        <TextField
          label="E-mail"
          type="email"
          icon="mail"
          value={props.email}
          onInput={props.setEmail}
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com"
          error={show("email")}
        />
        {isSignUp ? (
          <TextField
            label="Telefone"
            type="tel"
            icon="phone"
            value={phone}
            onInput={(v) => setPhone(formatPhoneInput(v))}
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="(21) 98765-4321"
            hint="Só para contato da conta. Não enviamos SMS."
            error={show("phone")}
          />
        ) : null}
        <TextField
          label="Senha"
          type="password"
          icon="lock"
          value={password}
          onInput={setPassword}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          hint={isSignUp ? "Pelo menos 8 caracteres, com letras e números." : undefined}
          error={show("password")}
        />
        {isSignUp ? (
          <>
            <TextField label="Confirmar senha" type="password" icon="lock" value={confirm} onInput={setConfirm} autoComplete="new-password" error={show("confirm")} />
            <Checkbox checked={accepted} onChange={setAccepted}>
              <TermsLabel onOpen={props.onOpenLegal} />
            </Checkbox>
            {show("terms") ? <p class="field-error">{errors.terms}</p> : null}
          </>
        ) : (
          <div class="auth-forgot">
            <Button variant="ghost" onClick={props.onForgot}>
              Esqueci minha senha
            </Button>
          </div>
        )}

        {error ? <Alert tone="error">{error}</Alert> : null}

        <Button type="submit" block loading={busy === "form"} disabled={busy === "google"}>
          {isSignUp ? "Criar conta" : "Entrar"}
        </Button>
      </form>

      <p class="auth-switch">
        {isSignUp ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
        <Button variant="ghost" onClick={() => switchMode(isSignUp ? "entrar" : "criar")}>
          {isSignUp ? "Entrar" : "Criar conta"}
        </Button>
      </p>

      {!isSignUp ? (
        <p class="auth-legal">
          Ao continuar, você aceita os{" "}
          <a href="#" onClick={(e) => (e.preventDefault(), props.onOpenLegal("termos"))}>
            Termos de Uso
          </a>{" "}
          e a{" "}
          <a href="#" onClick={(e) => (e.preventDefault(), props.onOpenLegal("privacidade"))}>
            Política de Privacidade
          </a>
          .
        </p>
      ) : null}
    </AuthLayout>
  );
}

// ---- Esqueci a senha ----------------------------------------------------------------------------

function ForgotPassword(props: { email: string; setEmail: (v: string) => void; onSent: () => void; onBack: () => void }) {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const emailError = validateEmail(props.email);

  async function submit(e: Event) {
    e.preventDefault();
    setSubmitted(true);
    if (emailError) return;
    setBusy(true);
    setError(null);
    try {
      await auth.sendPasswordReset(props.email);
      props.onSent();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout compactBrand title="Recuperar senha" subtitle="Enviaremos um link para você criar uma nova senha.">
      <form class="auth-form" onSubmit={submit} noValidate>
        <TextField
          label="E-mail"
          type="email"
          icon="mail"
          value={props.email}
          onInput={props.setEmail}
          autoComplete="email"
          inputMode="email"
          error={submitted ? emailError : null}
        />
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" block loading={busy}>
          Enviar link
        </Button>
        <Button block variant="ghost" onClick={props.onBack}>
          Voltar
        </Button>
      </form>
    </AuthLayout>
  );
}

// ---- Verifique seu e-mail -----------------------------------------------------------------------

function CheckEmail({ email, onBack }: { email: string; onBack: () => void }) {
  const auth = useAuth();
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setState("busy");
    setError(null);
    try {
      await auth.resendConfirmation(email);
      setState("sent");
    } catch (err) {
      setError(authErrorMessage(err));
      setState("idle");
    }
  }

  return (
    <AuthLayout compactBrand title="Confirme seu e-mail" subtitle={`Enviamos um link de confirmação para ${email.trim()}.`}>
      <p class="muted">Abra o e-mail neste celular e toque no link: o app abre já conectado. Se abrir em outro aparelho, a conta fica confirmada do mesmo jeito; volte aqui e entre com e-mail e senha.</p>
      <p class="muted">Não chegou? Veja a caixa de spam ou reenvie.</p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {state === "sent" ? <Alert tone="success">E-mail reenviado.</Alert> : null}
      <Button block variant="secondary" loading={state === "busy"} onClick={resend}>
        Reenviar e-mail
      </Button>
      <Button block variant="ghost" onClick={onBack}>
        Voltar para entrar
      </Button>
    </AuthLayout>
  );
}
