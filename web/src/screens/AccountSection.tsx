// Seção "Conta" do Perfil: dados do usuário, editar nome e telefone, sair e excluir conta.
// A tela completa de Perfil (Fase 6) vai incorporar esta seção.
import { useState } from "preact/hooks";
import { useAuth } from "../auth/AuthProvider";
import { Alert, Button, Card, ListRow, SectionTitle, TextField } from "../components/ui";
import { authErrorMessage, validateName } from "../services/authErrors";
import { formatPhoneForDisplay, formatPhoneInput, normalizePhone } from "../services/phone";
import { LegalScreen, type LegalDoc } from "./auth/LegalScreen";

export function AccountSection() {
  const auth = useAuth();
  const profile = auth.profile;
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [legal, setLegal] = useState<LegalDoc | null>(null);
  const [busy, setBusy] = useState<"save" | "delete" | "signout" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState(profile?.displayName ?? "");
  const [phone, setPhone] = useState(formatPhoneForDisplay(profile?.phone));

  if (legal) return <LegalScreen doc={legal} onClose={() => setLegal(null)} />;

  const phoneResult = normalizePhone(phone);
  const nameError = validateName(name);

  async function save() {
    setError(null);
    if (nameError || !phoneResult.ok) return;
    setBusy("save");
    try {
      await auth.saveProfile({ displayName: name, phone: phoneResult.e164, acceptTerms: false });
      setEditing(false);
      setNotice("Dados atualizados.");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setError(null);
    setBusy("delete");
    try {
      await auth.deleteAccount();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(null);
    }
  }

  return (
    <section class="screen" style={{ paddingBottom: 0 }}>
      <SectionTitle>Conta</SectionTitle>

      {editing ? (
        <Card>
          <div class="auth-form">
            <TextField label="Nome" icon="person" value={name} onInput={setName} error={nameError} />
            <TextField
              label="Telefone"
              type="tel"
              icon="phone"
              value={phone}
              inputMode="tel"
              onInput={(v) => setPhone(formatPhoneInput(v))}
              error={phoneResult.ok ? null : phoneResult.error}
            />
            <div class="row">
              <Button loading={busy === "save"} onClick={save}>
                Salvar
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div class="list">
          <ListRow icon="person" title={profile?.displayName ?? "Sem nome"} subtitle={profile?.email ?? undefined} />
          <ListRow icon="phone" title={formatPhoneForDisplay(profile?.phone) || "Sem telefone"} subtitle="Telefone" />
          <ListRow
            icon="settings"
            title="Editar nome e telefone"
            onClick={() => {
              setName(profile?.displayName ?? "");
              setPhone(formatPhoneForDisplay(profile?.phone));
              setNotice(null);
              setEditing(true);
            }}
          />
        </div>
      )}

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div class="list">
        <ListRow icon="book" title="Termos de Uso" onClick={() => setLegal("termos")} />
        <ListRow icon="lock" title="Política de Privacidade" onClick={() => setLegal("privacidade")} />
      </div>

      <Button
        block
        variant="secondary"
        icon="arrowLeft"
        loading={busy === "signout"}
        onClick={async () => {
          setBusy("signout");
          await auth.signOut();
        }}
      >
        Sair da conta
      </Button>

      {confirmDelete ? (
        <Alert
          tone="error"
          title="Excluir sua conta?"
          action={
            <div class="row">
              <Button variant="danger" icon="trash" loading={busy === "delete"} onClick={remove}>
                Excluir definitivamente
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
            </div>
          }
        >
          Sua conta, nome, e-mail e telefone serão apagados e não poderão ser recuperados. Favoritos e progresso continuam só neste aparelho.
        </Alert>
      ) : (
        <Button block variant="ghost" icon="trash" class="btn-danger-text" onClick={() => setConfirmDelete(true)}>
          Excluir conta
        </Button>
      )}
    </section>
  );
}
