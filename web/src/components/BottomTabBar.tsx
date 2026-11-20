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
};

export function BottomTabBar({ activeTab, onTabPress }: Props) {
  return (
    <nav class="tab-bar" aria-label="Navegação principal">
      {TABS.map((tab) => {
        const isActive = tab.name === activeTab;
        return (
          <button
            key={tab.name}
            type="button"
            class={isActive ? "tab tab-active" : "tab"}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onTabPress(tab.name)}
          >
            <span class="tab-icon">
              <Icon name={tab.icon} size={20} />
            </span>
            <span class="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
