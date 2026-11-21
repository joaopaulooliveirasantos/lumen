import { useState } from "preact/hooks";
import { Icon, type IconName } from "./Icon";

export type TabName = "home" | "liturgia" | "biblia" | "oracoes" | "perfil";

const TABS: { name: TabName; label: string; icon: IconName }[] = [
  { name: "home", label: "Home", icon: "church" },
  { name: "liturgia", label: "Liturgia Diária", icon: "book" },
  { name: "biblia", label: "Bíblia", icon: "bible" },
  { name: "oracoes", label: "Orações", icon: "prayingHands" },
  { name: "perfil", label: "Perfil", icon: "person" },
];

type Props = {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  /** Foto do perfil (ex.: do login com Google). Sem foto, ou se ela não carregar, fica o ícone. */
  avatarUrl?: string | null;
};

// `key={url}` no uso recria o componente quando a foto muda, zerando o estado de falha.
function ProfileAvatar({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Icon name="person" size={20} />;
  return <img class="tab-avatar" src={url} alt="" width={24} height={24} referrerpolicy="no-referrer" onError={() => setFailed(true)} />;
}

export function BottomTabBar({ activeTab, onTabPress, avatarUrl }: Props) {
  return (
    <nav class="tab-bar" aria-label="Navegação principal">
      {TABS.map((tab) => {
        const isActive = tab.name === activeTab;
        const avatar = tab.name === "perfil" && avatarUrl ? avatarUrl : null;
        return (
          <button
            key={tab.name}
            type="button"
            class={isActive ? "tab tab-active" : "tab"}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onTabPress(tab.name)}
          >
            <span class={avatar ? "tab-icon tab-icon-avatar" : "tab-icon"}>{avatar ? <ProfileAvatar key={avatar} url={avatar} /> : <Icon name={tab.icon} size={20} />}</span>
            <span class="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
