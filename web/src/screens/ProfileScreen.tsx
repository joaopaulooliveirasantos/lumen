import { useEffect, useState } from "preact/hooks";
import { App as CapApp } from "@capacitor/app";
import { useAuth } from "../auth/AuthProvider";
import { PageHeader } from "../components/PageHeader";
import { Card, ListRow, SectionTitle } from "../components/ui";
import { isNative } from "../native/platform";
import { AccountSection } from "./AccountSection";
import { ComponentGalleryScreen } from "./ComponentGalleryScreen";
import { DiagnosticsScreen } from "./DiagnosticsScreen";
import { SettingsScreen } from "./SettingsScreen";

type View = "perfil" | "configuracoes" | "diagnostico" | "componentes";

export function ProfileScreen() {
  const { profile } = useAuth();
  const [view, setView] = useState<View>("perfil");
  const [version, setVersion] = useState("web");

  useEffect(() => {
    if (!isNative()) return;
    void CapApp.getInfo()
      .then((info) => setVersion(`${info.version} (build ${info.build})`))
      .catch(() => undefined);
  }, []);

  if (view === "configuracoes") return <SettingsScreen onBack={() => setView("perfil")} />;
  if (view === "diagnostico" || view === "componentes") {
    return (
      <section>
        <div class="screen" style={{ paddingBottom: 0 }}>
          <PageHeader title={view === "diagnostico" ? "Diagnóstico" : "Componentes"} onBack={() => setView("perfil")} />
        </div>
        {view === "diagnostico" ? <DiagnosticsScreen /> : <ComponentGalleryScreen />}
      </section>
    );
  }

  const name = profile?.displayName?.trim() || profile?.email || "Usuário";
  return (
    <>
      <section class="screen" style={{ paddingBottom: 0 }}>
        <PageHeader title="Perfil" />
        <Card class="profile-card">
          {profile?.avatarUrl ? (
            <img class="avatar" src={profile.avatarUrl} alt="" width={72} height={72} referrerpolicy="no-referrer" />
          ) : (
            <span class="avatar avatar-letter" aria-hidden="true">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <p class="profile-name">{name}</p>
          {profile?.email ? <p class="muted">{profile.email}</p> : null}
        </Card>
        <div class="list">
          <ListRow icon="settings" title="Configurações" subtitle="Tema, tamanho do texto, Bíblia e lembrete" onClick={() => setView("configuracoes")} />
        </div>
      </section>

      <AccountSection />

      <section class="screen">
        <SectionTitle>Sobre o Lumen</SectionTitle>
        <Card>
          <p style={{ margin: 0 }}>Lumen é um aplicativo de liturgia diária que traz as leituras, a Bíblia, orações e reflexões do dia para você, onde estiver.</p>
          <p class="muted" style={{ marginBottom: 0 }}>Versão {version}</p>
        </Card>
        <SectionTitle>Testes (temporário)</SectionTitle>
        <div class="list">
          <ListRow icon="checkmark" title="Diagnóstico" subtitle="Recursos nativos do aparelho" onClick={() => setView("diagnostico")} />
          <ListRow icon="star" title="Componentes" subtitle="Design system" onClick={() => setView("componentes")} />
        </div>
      </section>
    </>
  );
}
