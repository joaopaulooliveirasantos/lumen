// Telas do portão de entrada com sessão ativa: completar cadastro, nova senha e falha ao carregar o perfil.
import { useState } from "preact/hooks";
import { Alert, Button, Checkbox, EmptyState, TextField } from "../../components/ui";
import { useAuth } from "../../auth/AuthProvider";
import { authErrorMessage, validateName, validatePassword } from "../../services/authErrors";
import { formatPhoneForDisplay, formatPhoneInput, normalizePhone } from "../../services/phone";
import { AuthLayout } from "./AuthLayout";
import { LegalScreen, TermsLabel, type LegalDoc } from "./LegalScreen";

// ---- Completar cadastro -------------------------------------------------------------------------

export function CompleteProfileScreen() {
  const auth = useAuth();
  const profile = auth.profile;
  const needsTerms = !profile?.termsAcceptedAt;
  const [name, setName] = useState(profile?.displayName ?? "");
  const [phone, setPhone] = useState(formatPhoneForDisplay(profile?.phone));
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legal, setLegal] = useState<LegalDoc | null>(null);

  const phoneResult = normalizePhone(phone);
  const errors = {
    name: validateName(name),
    phone: phoneResult.ok ? null : phoneResult.error,
    terms: needsTerms && !accepted ? "É preciso aceitar para continuar." : null,
  };

  async function submit(e: Event) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (Object.values(errors).some(Boolean) || !phoneResult.ok) return;
    setBusy(true);
    try {
      await auth.saveProfile({ displayName: name, phone: phoneResult.e164, acceptTerms: accepted });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (legal) return <LegalScreen doc={legal} onClose={() => setLegal(null)} />;

  return (
    <AuthLayout compactBrand title="Complete seu cadastro" subtitle={profile?.email ? `Conta: ${profile.email}` : undefined}>
      <p class="muted">Precisamos de mais alguns dados para liberar o app.</p>
      <form class="auth-form" onSubmit={submit} noValidate>
        <TextField label="Nome" icon="person" value={name} onInput={setName} autoComplete="name" error={submitted ? errors.name : null} />
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
          error={submitted ? errors.phone : null}
        />
        {needsTerms ? (
          <>
            <Checkbox checked={accepted} onChange={setAccepted}>
              <TermsLabel onOpen={setLegal} />
            </Checkbox>
            {submitted && errors.terms ? <p class="field-error">{errors.terms}</p> : null}
          </>
        ) : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" block loading={busy}>
          Continuar
        </Button>
        <Button block variant="ghost" onClick={() => void auth.signOut()}>
          Sair e usar outra conta
        </Button>
      </form>
    </AuthLayout>
  );
}

// ---- Nova senha (retorno do link de recuperação) ------------------------------------------------

export function NewPasswordScreen() {
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    password: validatePassword(password),
    confirm: confirm !== password ? "As senhas não conferem." : null,
  };

  async function submit(e: Event) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (errors.password || errors.confirm) return;
    setBusy(true);
    try {
      await auth.finishPasswordRecovery(password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout compactBrand title="Crie uma nova senha" subtitle={auth.profile?.email ?? auth.session?.user.email ?? undefined}>
      <form class="auth-form" onSubmit={submit} noValidate>
        <TextField
          label="Nova senha"
          type="password"
          icon="lock"
          value={password}
          onInput={setPassword}
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres, com letras e números."
          error={submitted ? errors.password : null}
        />
        <TextField
          label="Confirmar nova senha"
          type="password"
          icon="lock"
          value={confirm}
          onInput={setConfirm}
          autoComplete="new-password"
          error={submitted ? errors.confirm : null}
        />
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" block loading={busy}>
          Salvar nova senha
        </Button>
        <Button block variant="ghost" onClick={() => void auth.signOut()}>
          Cancelar
        </Button>
      </form>
    </AuthLayout>
  );
}

// ---- Perfil não carregou ------------------------------------------------------------------------

export function ProfileErrorScreen() {
  const auth = useAuth();
  return (
    <AuthLayout compactBrand>
      <EmptyState icon="wifiOff" title="Não foi possível carregar sua conta">
        Verifique a internet. Depois do primeiro acesso, o app funciona sem conexão.
      </EmptyState>
      <Button block onClick={auth.retryProfile}>
        Tentar novamente
      </Button>
      <Button block variant="ghost" onClick={() => void auth.signOut()}>
        Sair
      </Button>
    </AuthLayout>
  );
}
